import { PubSub } from "@google-cloud/pubsub";
import * as logger from "firebase-functions/logger";

let pubsub: PubSub | null = null;
function getPubSub() { if (!pubsub) pubsub = new PubSub(); return pubsub; }

// Minimal validation passthrough (schema governance handled centrally in functions package runtime)
export async function emitEvent(type: string, payload: Record<string, any> = {}) {
  const topic = process.env.EVENT_TOPIC;
  const enriched = { ...payload, type, emittedAt: new Date().toISOString() };
  if (!topic) { logger.warn("event.topic.missing", { type }); return; }
  try {
    await getPubSub().topic(topic).publishMessage({ json: enriched });
    logger.info("event.published", { type });
  } catch (err) {
    logger.error("event.publish.error", { type, err });
  }
}
