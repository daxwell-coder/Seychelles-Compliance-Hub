import * as logger from "firebase-functions/logger";
import { PubSub } from "@google-cloud/pubsub";
import { validateEventPayload } from "./eventRegistry";
import * as crypto from "crypto";
import { randomUUID } from "crypto";

let pubsub: PubSub | null = null;
function getPubSub() {
  if (!pubsub) pubsub = new PubSub();
  return pubsub;
}

/**
 * Lightweight event emission stub. In Phase 2 this will publish to Pub/Sub.
 */
const CRITICAL_EVENT_PREFIXES = [
  'onboarding.',
  'sanctions.',
  'regulatory.diff_detected',
  'audit.hash.chain.computed'
];

function isCritical(type: string): boolean {
  return CRITICAL_EVENT_PREFIXES.some(p => type.startsWith(p));
}

interface EventEnvelopeMeta {
  correlationId?: string;
  tenantId?: string | null;
  producer?: string;
  occurredAt?: string; // when the underlying business action happened
  userId?: string; // who initiated the action
  sessionId?: string; // user session context
  traceId?: string; // distributed tracing
}

/**
 * Enhanced event emission with full envelope normalization
 * All events now carry consistent metadata for correlation, multi-tenancy, and lineage
 */
export async function emitEvent(type: string, payload: Record<string, any> = {}, meta: EventEnvelopeMeta = {}) {
  const validation = validateEventPayload(type, payload);
  if (!validation.ok) {
    const msg = { type, missing: validation.missing, extraneous: validation.extraneous };
    if (isCritical(type)) {
      logger.error("event.validation.blocked", msg);
      throw new Error(`Critical event validation failed for ${type}`);
    } else {
      logger.warn("event.validation.failed", msg);
    }
  }
  
  // Create stable canonical JSON for hashing (sorted keys) to ensure deterministic payload_hash
  const canonical = JSON.stringify(sortKeys(payload));
  const payload_hash = crypto.createHash('sha256').update(canonical).digest('hex');
  const event_id = randomUUID();
  
  let schema_version: string | null = null;
  const schemaId = validation.schema?.schema_id || null;
  if (schemaId) {
    const m = /_v(\d+)$/.exec(schemaId);
    if (m) schema_version = `v${m[1]}`;
  }
  
  const nowIso = new Date().toISOString();
  
  // Enhanced envelope with full normalization
  const enriched = {
    envelope: {
      version: 2, // Increment version for new fields
      producer: meta.producer || process.env.SERVICE_NAME || process.env.FUNCTION_NAME || 'functions',
      correlation_id: meta.correlationId || event_id,
      tenant_id: meta.tenantId || null,
      user_id: meta.userId || null,
      session_id: meta.sessionId || null,
      trace_id: meta.traceId || null,
      emitted_at: nowIso
    },
    type,
    occurred_at: meta.occurredAt || nowIso,
    _schema: schemaId,
    schema_version,
    event_id,
    payload_hash,
    payload,
    // Legacy compatibility
    emitted_at: nowIso
  };
  
  const topic = process.env.EVENT_TOPIC || 'platform-events';
  if (topic) {
    try {
      await getPubSub().topic(topic).publishMessage({ json: enriched });
      logger.info("event.published", { type, topic, correlation_id: enriched.envelope.correlation_id });
      return;
    } catch (err) {
      logger.error("event.publish.error", { type, err });
    }
  }
  
  logger.info("event.emitted", { 
    type, 
    event_id, 
    producer: enriched.envelope.producer, 
    correlation_id: enriched.envelope.correlation_id,
    tenant_id: enriched.envelope.tenant_id 
  });
}

// Utility: recursively sort object keys for canonical JSON stringification
function sortKeys(obj: any): any {
  if (Array.isArray(obj)) return obj.map(sortKeys);
  if (obj && typeof obj === 'object') {
    return Object.keys(obj).sort().reduce((acc: any, key) => { acc[key] = sortKeys(obj[key]); return acc; }, {});
  }
  return obj;
}
