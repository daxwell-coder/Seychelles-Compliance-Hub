/**
 * Standardized Event Envelope Utility
 * 
 * Ensures all events emitted across the platform use consistent snake_case field names
 * that match the BigQuery schema expectations.
 * 
 * This fixes the envelope migration issue identified in Milestone Gap Report.
 */

import { randomUUID, createHash } from "crypto";
import * as logger from "firebase-functions/logger";

export interface StandardEventEnvelope {
  type: string;
  emitted_at: string;  // ISO timestamp - ALWAYS snake_case
  event_id: string;    // UUID
  payload_hash: string; // SHA256 of canonical payload
  _schema?: string | null;
  schema_version?: string | null;
  envelope?: {
    version: number;
    producer?: string;
    correlation_id?: string;
    tenant_id?: string | null;
  };
  occurred_at?: string; // When the business action happened
  payload: Record<string, any>;
}

export interface EventEmitterOptions {
  correlationId?: string;
  tenantId?: string | null;
  producer?: string;
  occurredAt?: string;
  schemaId?: string | null;
}

/**
 * Creates a standardized event envelope with snake_case field names.
 * This ensures compatibility with BigQuery schema expectations.
 */
export function createStandardEventEnvelope(
  type: string, 
  payload: Record<string, any>, 
  options: EventEmitterOptions = {}
): StandardEventEnvelope {
  // Create stable canonical JSON for hashing (sorted keys)
  const canonical = JSON.stringify(sortKeys(payload));
  const payload_hash = createHash('sha256').update(canonical).digest('hex');
  const event_id = randomUUID();
  const nowIso = new Date().toISOString();
  
  // Parse schema version if available
  let schema_version: string | null = null;
  if (options.schemaId) {
    const match = /_v(\d+)$/.exec(options.schemaId);
    if (match) schema_version = `v${match[1]}`;
  }
  
  return {
    type,
    emitted_at: nowIso,  // CRITICAL: Always use snake_case to match BigQuery
    event_id,
    payload_hash,
    _schema: options.schemaId || null,
    schema_version,
    envelope: {
      version: 1,
      producer: options.producer || process.env.SERVICE_NAME || 'unknown',
      correlation_id: options.correlationId || event_id,
      tenant_id: options.tenantId || null
    },
    occurred_at: options.occurredAt || nowIso,
    payload
  };
}

/**
 * Utility: recursively sort object keys for canonical JSON stringification
 */
function sortKeys(obj: any): any {
  if (Array.isArray(obj)) return obj.map(sortKeys);
  if (obj && typeof obj === 'object') {
    return Object.keys(obj).sort().reduce((acc: any, key) => { 
      acc[key] = sortKeys(obj[key]); 
      return acc; 
    }, {});
  }
  return obj;
}

/**
 * Validates that an event envelope follows the standard format.
 * Used for testing and validation purposes.
 */
export function validateEventEnvelope(envelope: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!envelope.emitted_at) {
    errors.push("Missing required field: emitted_at");
  } else if (typeof envelope.emitted_at !== 'string') {
    errors.push("emitted_at must be a string");
  }
  
  // Check for legacy field that should not be present
  if (envelope.emittedAt) {
    errors.push("Found deprecated field 'emittedAt' - should be 'emitted_at'");
  }
  
  if (!envelope.event_id) {
    errors.push("Missing required field: event_id");
  }
  
  if (!envelope.type) {
    errors.push("Missing required field: type");
  }
  
  if (!envelope.payload_hash) {
    errors.push("Missing required field: payload_hash");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Migration utility: converts legacy camelCase events to snake_case
 */
export function migrateLegacyEventEnvelope(legacyEvent: any): StandardEventEnvelope {
  const migratedEvent = { ...legacyEvent };
  
  // Convert emittedAt to emitted_at if present
  if (legacyEvent.emittedAt && !legacyEvent.emitted_at) {
    migratedEvent.emitted_at = legacyEvent.emittedAt;
    delete migratedEvent.emittedAt;
    logger.info("envelope.migration.applied", { 
      type: legacyEvent.type, 
      event_id: legacyEvent.event_id 
    });
  }
  
  return migratedEvent as StandardEventEnvelope;
}
