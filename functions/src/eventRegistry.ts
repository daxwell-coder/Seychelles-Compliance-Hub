import * as fs from 'fs';
import * as path from 'path';
import * as logger from 'firebase-functions/logger';

interface EventSchema {
  type: string;
  schema_id: string;
  required_fields: string[];
  optional_fields: string[];
  sensitive_fields: string[];
}

interface RegistryFile {
  version: number;
  schemas: EventSchema[];
}

let registry: Map<string, EventSchema> | null = null;

function loadRegistry(): Map<string, EventSchema> {
  if (registry) return registry;
  try {
    // Assume docs/event_schema_registry.json is deployed with function source root one level up.
    const registryPath = path.join(__dirname, '..', '..', 'docs', 'event_schema_registry.json');
    if (fs.existsSync(registryPath)) {
      const raw = fs.readFileSync(registryPath, 'utf-8');
      const parsed = JSON.parse(raw) as RegistryFile;
      registry = new Map(parsed.schemas.map(s => [s.type, s]));
    } else {
      logger.warn('event.registry.missing', { registryPath });
      registry = new Map();
    }
  } catch (err) {
    logger.error('event.registry.load.error', { err });
    registry = new Map();
  }
  return registry;
}

export interface ValidationResult {
  ok: boolean;
  missing: string[];
  extraneous: string[];
  schema?: EventSchema;
}

export function validateEventPayload(type: string, payload: Record<string, any>): ValidationResult {
  const reg = loadRegistry();
  const schema = reg.get(type);
  if (!schema) {
    return { ok: false, missing: [], extraneous: [], schema: undefined };
  }
  const missing = schema.required_fields.filter(f => !(f in payload));
  const allowed = new Set([...schema.required_fields, ...schema.optional_fields]);
  const extraneous = Object.keys(payload).filter(k => !allowed.has(k));
  return { ok: missing.length === 0 && extraneous.length === 0, missing, extraneous, schema };
}
