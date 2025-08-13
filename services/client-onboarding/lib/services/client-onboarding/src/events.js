"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitEvent = emitEvent;
const pubsub_1 = require("@google-cloud/pubsub");
const logger = __importStar(require("firebase-functions/logger"));
const crypto_1 = require("crypto");
let pubsub = null;
function getPubSub() { if (!pubsub)
    pubsub = new pubsub_1.PubSub(); return pubsub; }
// Minimal validation passthrough (schema governance handled centrally in functions package runtime)
async function emitEvent(type, payload = {}) {
    const topic = process.env.EVENT_TOPIC;
    const canonical = JSON.stringify(sortKeys(payload));
    const payload_hash = (0, crypto_1.createHash)('sha256').update(canonical).digest('hex');
    const enriched = { ...payload, type, emittedAt: new Date().toISOString(), event_id: (0, crypto_1.randomUUID)(), payload_hash };
    if (!topic) {
        logger.warn("event.topic.missing", { type });
        return;
    }
    try {
        await getPubSub().topic(topic).publishMessage({ json: enriched });
        logger.info("event.published", { type });
    }
    catch (err) {
        logger.error("event.publish.error", { type, err });
    }
}
function sortKeys(obj) {
    if (Array.isArray(obj))
        return obj.map(sortKeys);
    if (obj && typeof obj === 'object') {
        return Object.keys(obj).sort().reduce((acc, k) => { acc[k] = sortKeys(obj[k]); return acc; }, {});
    }
    return obj;
}
//# sourceMappingURL=events.js.map