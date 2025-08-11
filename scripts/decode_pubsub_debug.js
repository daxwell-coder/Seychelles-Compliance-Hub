#!/usr/bin/env node
// Pull and decode recent messages from platform-events-debug via gcloud CLI.
// Usage: node scripts/decode_pubsub_debug.js [limit]
const { execSync } = require('child_process');
const limit = process.argv[2] || '10';
try {
  const raw = execSync(`gcloud pubsub subscriptions pull platform-events-debug --limit=${limit} --auto-ack --format=json`, { stdio: 'pipe' }).toString();
  const arr = JSON.parse(raw);
  const decoded = arr.map(msg => {
    try {
      const buf = Buffer.from(msg.message.data, 'base64').toString('utf8');
      return { id: msg.message.messageId, publishTime: msg.message.publishTime, data: JSON.parse(buf), attributes: msg.message.attributes || {} };
    } catch (e) {
      return { id: msg.message.messageId, error: 'decode-failed', raw: msg.message.data };
    }
  });
  console.log(JSON.stringify(decoded, null, 2));
} catch (e) {
  console.error('Failed to pull messages:', e.message);
  process.exit(1);
}
