import { CloudEvent } from "firebase-functions/v2";
import { MessagePublishedData } from "firebase-functions/v2/pubsub";
import * as logger from "firebase-functions/logger";
import { BigQuery } from "@google-cloud/bigquery";
import { getFirestore } from "firebase-admin/firestore";
import { migrateLegacyEventEnvelope, validateEventEnvelope } from "./eventEnvelope";

// Lazy BigQuery client
let bq: BigQuery | null = null;
function getBq() { if (!bq) bq = new BigQuery(); return bq; }

const DATASET = process.env.BQ_EVENT_DATASET || "event_ledger";
const TABLE = process.env.BQ_EVENT_TABLE || "event_log";
const DEADLETTER_COLLECTION = "_event_ingest_deadletter";
const db = getFirestore();

interface PlatformEventEnvelope {
  type: string;
  emitted_at?: string;
  emittedAt?: string; // legacy - will be migrated
  event_id?: string;
  payload_hash?: string;
  _schema?: string | null;
  [k: string]: any;
}

/**
 * Event ingestion function subscribes to platform-events and writes immutable rows into BigQuery.
 * - Ensures idempotency by ignoring duplicates on event_id (BigQuery INSERT semantics + later dedupe queries)
 * - Stores raw JSON payload for maximum flexibility.
 * - Handles envelope migration from legacy camelCase to snake_case format.
 */
export const eventsIngestor = async (event: CloudEvent<MessagePublishedData>) => {
  const pubsubMessage = event.data?.message;
  if (!pubsubMessage) { logger.warn("ingestor.no_message"); return; }
  let decoded: PlatformEventEnvelope | null = null;
  try {
    const jsonStr = Buffer.from(pubsubMessage.data || '', 'base64').toString('utf8');
    decoded = JSON.parse(jsonStr);
  } catch (e) {
    logger.error("ingestor.decode_error", { e });
    return;
  }

  if (!decoded) return;

  // Apply envelope migration for legacy events
  let migratedEvent = decoded;
  if (decoded.emittedAt && !decoded.emitted_at) {
    migratedEvent = migrateLegacyEventEnvelope(decoded);
    logger.info("ingestor.envelope.migrated", { 
      type: decoded.type, 
      event_id: decoded.event_id,
      from_field: "emittedAt",
      to_field: "emitted_at"
    });
  }

  // Validate the envelope format
  const validation = validateEventEnvelope(migratedEvent);
  if (!validation.isValid) {
    logger.warn("ingestor.envelope.validation_failed", { 
      type: migratedEvent.type, 
      event_id: migratedEvent.event_id,
      errors: validation.errors 
    });
  }

  // Derive schema_version from schema_id if pattern *_v<digit>
  let schema_version: string | null = null;
  if (migratedEvent._schema) {
    const m = /_v(\d+)$/.exec(migratedEvent._schema);
    if (m) schema_version = `v${m[1]}`;
  }

  // Use migrated timestamp (guaranteed to be emitted_at format)
  const emittedSource = migratedEvent.emitted_at || new Date().toISOString();
  const row = {
    event_id: migratedEvent.event_id || generateDeterministicId(migratedEvent),
    type: migratedEvent.type,
    emitted_at: new Date(emittedSource).toISOString(),
    ingested_at: new Date().toISOString(),
    schema_id: migratedEvent._schema || null,
    schema_version,
    payload_hash: migratedEvent.payload_hash || computePayloadHash(migratedEvent),
    payload: JSON.stringify(migratedEvent),
    source_topic: process.env.EVENT_TOPIC || 'platform-events'
  };

  try {
    await getBq().dataset(DATASET).table(TABLE).insert(row);
    logger.info("ingestor.row_inserted", { event_id: row.event_id, type: row.type });
  } catch (e: any) {
    // Handle already exists (duplicate) silently; BigQuery streaming insert returns partial errors structure
    if (e && e.name === 'PartialFailureError') {
      const errors = e.errors || [];
      const nonDup = errors.filter((err: any) => !/ALREADY_EXISTS/i.test(err.message));
      if (nonDup.length === 0) {
        logger.warn("ingestor.duplicate", { event_id: row.event_id });
        return;
      }
    }
    logger.error("ingestor.insert_error", { e });
    try {
      await db.collection(DEADLETTER_COLLECTION).add({
        receivedAt: new Date(),
        error: e?.message || String(e),
        event: decoded,
        migratedEvent,
        row
      });
    } catch (dlErr) {
      logger.error("deadletter.write_failed", { dlErr });
    }
  }
};

import * as crypto from 'crypto';
function computePayloadHash(obj: any): string {
  const clone = { ...obj };
  delete clone.payload_hash; // avoid circular hash changes
  const canonical = JSON.stringify(sortKeys(clone));
  return crypto.createHash('sha256').update(canonical).digest('hex');
}
function generateDeterministicId(obj: any): string {
  return computePayloadHash(obj).slice(0, 32); // short hash as fallback id
}
function sortKeys(obj: any): any {
  if (Array.isArray(obj)) return obj.map(sortKeys);
  if (obj && typeof obj === 'object') {
    return Object.keys(obj).sort().reduce((acc: any, k) => { acc[k] = sortKeys(obj[k]); return acc; }, {});
  }
  return obj;
}
