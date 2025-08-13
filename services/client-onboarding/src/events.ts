import { PubSub } from "@google-cloud/pubsub";
import * as logger from "firebase-functions/logger";
import { randomUUID, createHash } from "crypto";

let pubsub: PubSub | null = null;
function getPubSub() { if (!pubsub) pubsub = new PubSub(); return pubsub; }

// Minimal validation passthrough (schema governance handled centrally in functions package runtime)
export async function emitEvent(type: string, payload: Record<string, any> = {}) {
  const topic = process.env.EVENT_TOPIC;
  const canonical = JSON.stringify(sortKeys(payload));
  const payload_hash = createHash('sha256').update(canonical).digest('hex');
  const enriched = { ...payload, type, emittedAt: new Date().toISOString(), event_id: randomUUID(), payload_hash };
  if (!topic) { logger.warn("event.topic.missing", { type }); return; }
  try {
    await getPubSub().topic(topic).publishMessage({ json: enriched });
    logger.info("event.published", { type });
  } catch (err) {
    logger.error("event.publish.error", { type, err });
  }
}

function sortKeys(obj: any): any {
  if (Array.isArray(obj)) return obj.map(sortKeys);
  if (obj && typeof obj === 'object') {
    return Object.keys(obj).sort().reduce((acc: any, k) => { acc[k] = sortKeys(obj[k]); return acc; }, {});
  }
  return obj;
}
