import * as admin from "firebase-admin";
import { onRequest, HttpsError } from "firebase-functions/v2/https";
import { z } from "zod";
import { OnboardingDataSchema, OnboardingData } from "./schemas";
import * as logger from "firebase-functions/logger";
import { emitEvent } from "./events"; // Refactored to shared-style emitter (local copy)

admin.initializeApp();
const db = admin.firestore();

// Simple metrics helper (increment Firestore counter fields under _metrics/onboarding)
const incMetric = async (field: string) => {
  try {
    await db.collection("_metrics").doc("onboarding").set({ [field]: admin.firestore.FieldValue.increment(1) }, { merge: true });
  } catch (e) {
    logger.warn("metric.increment.failed", { field, e });
  }
};

// --- 1. Define Validation Schemas based on schema.json ---
// This creates a runtime-enforceable schema using Zod, ensuring data integrity.
// Schemas centralized in schemas.ts

// For demonstration, create a mock list of sanctioned entities.
const MOCK_SANCTIONS_LIST = new Set([
  "JOHN DOE",
  "JANE SMITH",
]);

/**
 * Mocks an API call to a sanctions screening provider.
 * In a real-world scenario, this would involve an HTTP request to a third-party API.
 * @param {string} name The name to screen.
 * @return {Promise<'CLEARED' | 'MATCH_FOUND'>} The screening result.
 */
const performSanctionsScreen = async (name: string): Promise<"CLEARED" | "MATCH_FOUND"> => {
  // Prepare for production by checking for a real API key.
  // In a real deployment, this secret would be set via Terraform.
  if (process.env.SANCTIONS_API_KEY) {
    // --- PRODUCTION: This is where the real API call would go ---
    // const response = await fetch("...", { headers: { "Authorization": `Bearer ${process.env.SANCTIONS_API_KEY}` }});
    // ...
  }

  logger.info(`Performing sanctions screen for: ${name}`);
  // --- PRODUCTION: Replace this mock with a real API call ---
  // Example:
  // const response = await fetch("https://api.sanctions-provider.com/v1/screen", {
  //   method: "POST",
  //   headers: { "Authorization": `Bearer ${process.env.SANCTIONS_API_KEY}` },
  //   body: JSON.stringify({ name: name }),
  // });
  // if (!response.ok) throw new Error("Sanctions API call failed");
  // const result = await response.json();
  // return result.match ? "MATCH_FOUND" : "CLEARED";

  // For demonstration, simulate network latency to test frontend loading states.
  await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));

  // Simulate an API failure for testing the catch block.
  if (name.toLowerCase().includes("api-error")) {
    throw new Error("Simulated 500 Internal Server Error from sanctions API.");
  }

  // For demonstration, we'll simulate a "clear" result.
  // To test a match, you could check for a specific name:
  if (MOCK_SANCTIONS_LIST.has(name.toUpperCase())) {
    return "MATCH_FOUND";
  }
  return "CLEARED";
};


export const onboardClientFunction = onRequest(async (req, res) => {
  // NOTE: Converted to plain HTTP (was callable) to simplify manual testing without Firebase Auth.
  //       In production you may revert to onCall + auth enforcement.
  const executionId = (req as any).id || (Date.now().toString(36) + Math.random().toString(36).slice(2));

  // --- AuthN: Optional API key enforcement if ONBOARDING_API_KEY is configured ---
  const expectedKey = process.env.ONBOARDING_API_KEY;
  if (expectedKey) {
    const provided = (req.headers["x-api-key"] as string) || (req.query.api_key as string);
    if (!provided || provided !== expectedKey) {
      logger.warn("auth.apikey.invalid", { executionId, hasProvided: !!provided });
  res.status(401).json({ status: "error", code: "UNAUTHORIZED", message: "Invalid or missing API key." });
  return;
    }
  }

  // Accept either a callable-style envelope { data: {...} } or raw JSON body.
  let raw: any = (req.body && typeof req.body === 'object') ? (req.body.data ?? req.body) : {};

  // Backwards compatibility / user convenience: map companyName -> clientName if present.
  if (raw.companyName && !raw.clientName) raw.clientName = raw.companyName;

  // --- 2. Validate incoming data against the Zod schema ---
  let validatedData: OnboardingData;
  try {
    validatedData = OnboardingDataSchema.parse(raw);
  } catch (error) {
    const formatted = (error as z.ZodError).format();
    logger.error("Client data validation failed.", { executionId, error: formatted, receivedData: raw });
    await incMetric("validationErrors");
  res.status(400).json({
      status: "error",
      code: "INVALID_ARGUMENT",
      message: "The data provided is invalid.",
      details: formatted,
    });
    return;
  }

  // --- 3. Perform Sanctions Screening ---
  let screeningResults;
  let overallScreeningStatus: "CLEARED" | "MATCH_FOUND";

  try {
    const allNames = [
      validatedData.clientName,
      ...validatedData.beneficialOwners.map((bo) => bo.fullName),
    ];

    const settledResults = await Promise.allSettled(
      allNames.map(async (name) => ({ name, result: await performSanctionsScreen(name) })),
    );

    // Filter out failed API calls and log them for review.
    screeningResults = settledResults
      .filter((res) => {
        if (res.status === "rejected") {
          logger.error("A sanctions screening call failed.", { executionId, reason: res.reason });
          return false;
        }
        return true;
      })
      .map((res) => (res as PromiseFulfilledResult<{name: string, result: "CLEARED" | "MATCH_FOUND"}>).value);

    const foundMatch = screeningResults.find((r: { result: string; }) => r.result === "MATCH_FOUND");
    overallScreeningStatus = foundMatch ? "MATCH_FOUND" : "CLEARED";
    logger.info(`Overall screening status: ${overallScreeningStatus}`, { executionId, screeningResults });
  } catch (error) {
    logger.error("Sanctions screening API call failed.", { executionId, error });
    // Return a more specific error if the third-party service is down.
    throw new HttpsError(
      "unavailable",
      "The sanctions screening service is currently unavailable. Please try again later.",
    );
  }

  // Idempotency check if clientRequestId provided
  if (validatedData.clientRequestId) {
    const existing = await db.collection("clients")
      .where("clientRequestId", "==", validatedData.clientRequestId)
      .limit(1).get();
    if (!existing.empty) {
      const doc = existing.docs[0];
      logger.info("Idempotent replay detected", { executionId, clientId: doc.id });
  res.status(200).json({ status: "success", message: "Client already onboarded (idempotent replay).", clientId: doc.id, idempotent: true });
  return;
    }
  }

  // --- 4. Save Data to Firestore ---
  // We will proceed to save the data regardless of the screening outcome,
  // but we will flag the client record accordingly. The compliance officer
  // can then review clients with a "MATCH_FOUND" status.
  try {
    const clientRef = db.collection("clients").doc();
    const batch = db.batch();

    // Create the main client document
    batch.set(clientRef, {
      name: validatedData.clientName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      clientRequestId: validatedData.clientRequestId || null,
      onboardingStatus: "PENDING_REVIEW",
      sanctionsScreening: {
        status: overallScreeningStatus,
        checkedAt: admin.firestore.FieldValue.serverTimestamp(),
        details: screeningResults, // Store detailed results for audit
      },
    });

    // Create documents for beneficial owners.
    // Note: Firestore batches are limited to 500 operations. For simplicity,
    // we assume fewer than 499 BOs. A production system might need to
    // handle this by chunking writes into multiple batches.
    if (validatedData.beneficialOwners.length < 499) {
      validatedData.beneficialOwners.forEach((bo) => {
        const boRef = clientRef.collection("beneficial_owners").doc();
        batch.set(boRef, {
          ...bo,
          // Convert string dates from the client to Firestore Timestamps
          dateOfBirth: admin.firestore.Timestamp.fromDate(new Date(bo.dateOfBirth)),
          dateBecameBo: admin.firestore.Timestamp.fromDate(new Date(bo.dateBecameBo)),
        });
      });
    } else {
      // Handle the case of too many BOs for a single batch. This would involve
      // more complex logic to create multiple batches. For now, we'll throw.
      throw new HttpsError("invalid-argument", "Exceeded maximum number of beneficial owners.");
    }

    await batch.commit();
    logger.info(`Successfully created client ${clientRef.id} and ${validatedData.beneficialOwners.length} beneficial owners.`, { executionId });

    // Emit onboarding.completed event via shared-style emitter
    await emitEvent("onboarding.completed", {
      clientId: clientRef.id,
      clientName: validatedData.clientName,
      beneficialOwnerCount: validatedData.beneficialOwners.length,
      clientRequestId: validatedData.clientRequestId || null,
      sanctionsStatus: overallScreeningStatus,
    });

  res.status(200).json({
      status: "success",
      message: "Client onboarding data submitted successfully.",
      clientId: clientRef.id,
    });
  return;
  } catch (error) {
    logger.error("Error saving data to Firestore for client.", {
      executionId,
      clientId: validatedData.clientName, // Log which client failed
      error,
    });
  res.status(500).json({ status: "error", code: "INTERNAL", message: "An internal error occurred while saving client data." });
  return;
  }
});