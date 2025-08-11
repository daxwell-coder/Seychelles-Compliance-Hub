// Import necessary libraries
import { StorageEvent } from "firebase-functions/v2/storage";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app"; // Correctly imported
import { getFirestore } from "firebase-admin/firestore"; // Correctly imported
import { parse } from "csv-parse";
import { getStorage } from "firebase-admin/storage";
import * as path from "path"; // Added missing import
import * as os from "os"; // Added missing import
import * as fs from "fs"; // Added missing import

// Initialize the Firebase Admin SDK
initializeApp();
const firestore = getFirestore();
const storage = getStorage();

import { emitEvent } from "./events";
import { onRequest } from "firebase-functions/v2/https";

// Define a type for a single transaction record based on the CSV columns
interface TransactionRecord {
  transactionId: string;
  amount: number; // Use number for better data integrity and querying
  currency: string;
  description: string;
}

// Define the Cloud Function
export const processTransactionFile = async (event: StorageEvent) => {
  // Add a guard clause to handle unexpected invocations.
  // This prevents crashes when the function is triggered by something other
  // than a valid Cloud Storage event (e.g., Google's internal health checks).
  if (!event.data || !event.data.name) {
    logger.warn("Function triggered with an invalid event payload. Exiting.", { event });
    return null;
  }

  const { name, contentType } = event.data;
  const fileBucket = event.data.bucket;

  // 1. Validate file type and ignore hidden/temporary files
  if (!name || !contentType || path.basename(name).startsWith('.') || !contentType.startsWith("text/csv")) {
    logger.log("This is not a valid CSV file. Exiting.", { name, contentType });
    return null;
  }

  logger.info(`Processing file: ${name} from bucket: ${fileBucket}`);
  await emitEvent("transactions.file.received", { file: name, bucket: fileBucket });

  const bucket = storage.bucket(fileBucket);
  const file = bucket.file(name);
  // Use basename to prevent path traversal issues with file names like 'folder/file.csv'
  const tempFilePath = path.join(os.tmpdir(), path.basename(name));
  const collectionRef = firestore.collection("transactions");

  try {
    await file.download({ destination: tempFilePath });
    logger.info(`File downloaded to ${tempFilePath}`);

    // 2. Robustly parse the CSV file into an array of records
    const records: TransactionRecord[] = await new Promise((resolve, reject) => {
      const parsedRecords: TransactionRecord[] = [];
      fs.createReadStream(tempFilePath)
        .pipe(parse({ columns: true, skip_empty_lines: true }))
        .on("data", (row: any) => {
          // 3. Perform data transformation and validation during parsing
          const amount = parseFloat(row.amount);
          if (isNaN(amount)) {
            logger.warn(`Skipping record with invalid amount: ${row.amount}`, row);
            return;
          }
          parsedRecords.push({ ...row, amount });
        })
        .on("end", () => resolve(parsedRecords))
        .on("error", (error: Error) => reject(error)); // Explicitly typed 'error' to fix implicit 'any'
    });

    logger.info(`CSV parsed. Found ${records.length} valid records.`);
    await emitEvent("transactions.parsed", { file: name, records: records.length });

    if (records.length > 0) {
      // 4. Use batched writes to handle large files and avoid Firestore limits
      const BATCH_SIZE = 499; // Firestore batch limit is 500 operations
      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const chunk = records.slice(i, i + BATCH_SIZE);
        const batch = firestore.batch();
        chunk.forEach((record) => {
          const docRef = collectionRef.doc(); // Auto-generate document ID
          batch.set(docRef, record);
        });
        await batch.commit();
        logger.info(`Committed batch of ${chunk.length} records.`);
      }
      logger.info("Successfully imported all records to Firestore.");
      await emitEvent("transactions.stored", { file: name, records: records.length });
    }

    // 5. Delete the original file from the bucket only on successful processing
    await file.delete();
    logger.info(`Successfully deleted original uploaded file: ${name}`);
    await emitEvent("transactions.file.cleaned", { file: name });

  } catch (error) {
    logger.error("Error processing file:", { name, error });
    await emitEvent("transactions.file.error", { file: name, message: (error as any)?.message });
  } finally {
    // 6. Ensure the local temporary file is always deleted, even if an error occurs
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
      logger.info(`Successfully deleted temporary file: ${tempFilePath}`);
    }
  }

  return null;
};

// Export the regulatory monitor function from its own file
// 7. Removed the duplicate declaration of checkRegulatoryChanges
export * from "./regulatoryMonitor";
export * from "./auditHashChain";

// Secure metrics endpoint (internal use). Requires METRICS_API_KEY if set.
export const metricsEndpoint = onRequest(async (req, res) => {
  const expected = process.env.METRICS_API_KEY;
  if (expected) {
    const provided = (req.headers["x-api-key"] as string) || (req.query.api_key as string);
    if (!provided || provided !== expected) {
      res.status(401).json({ status: "error", code: "UNAUTHORIZED" });
      return;
    }
  }
  try {
    const metricsSnap = await firestore.collection("_metrics").doc("onboarding").get();
    const latestSnap = await firestore.collection("_audit_chain").doc("latest").get();
    res.json({
      status: "ok",
      onboardingMetrics: metricsSnap.exists ? metricsSnap.data() : {},
      latestAuditHash: latestSnap.exists ? latestSnap.data() : {},
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    logger.error("metrics.endpoint.error", { e });
    res.status(500).json({ status: "error" });
  }
});
