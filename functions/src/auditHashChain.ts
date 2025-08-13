import * as logger from "firebase-functions/logger";
import { getFirestore } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as crypto from "crypto";
import { emitEvent } from "./events";

// Enhanced audit hash chain:
// 1. Reads last chain state (_audit_chain/latest).
// 2. Derives a daily aggregation marker (placeholder: timestamp only). Future: incorporate previous 24h event batch hash.
// 3. Stores immutable chain link documents under _audit_chain/links/{isoTs}.
// 4. Updates pointer doc 'latest'.
// 5. Emits audit.hash.chain.computed event with new/previous hash.

export const auditHashChain = onSchedule({ schedule: "15 1 * * *" }, async () => {
  const firestore = getFirestore();
  const latestRef = firestore.collection("_audit_chain").doc("latest");
  const latestSnap = await latestRef.get();
  const previousHash = latestSnap.exists ? latestSnap.data()?.hash : "GENESIS";

  // Placeholder aggregation input: could be concatenated hashes of events from prior day.
  const timestamp = new Date().toISOString();
  const aggregationMarker = `DAY:${timestamp.substring(0,10)}`;
  const combined = `${previousHash}|${aggregationMarker}|${timestamp}`;
  const newHash = crypto.createHash("sha256").update(combined).digest("hex");

  const linkRef = firestore.collection("_audit_chain").doc(`link_${timestamp}`);
  await linkRef.set({
    hash: newHash,
    previousHash,
    aggregationMarker,
    computedAt: timestamp,
    algorithm: "sha256",
    version: 1
  });
  await latestRef.set({ hash: newHash, previousHash, pointerUpdatedAt: timestamp, algorithm: "sha256" });

  logger.info("audit.hash.chain.computed", { newHash, previousHash, link: linkRef.id });
  try {
    await emitEvent("audit.hash.chain.computed", { newHash, previousHash, algorithm: "sha256" });
  } catch (e) {
    logger.error("audit.hash.chain.event.emit.failed", { error: e });
  }
});
