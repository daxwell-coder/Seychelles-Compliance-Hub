// Minimal event emitter for schv1 compliance platform
// Provides standardized event emission with envelope v1

const { v4: uuidv4 } = require('uuid');

function emitEvent(eventType, payload, options = {}) {
  const envelope = {
    envelope_version: 1,
    producer: options.producer || 'schv1-core',
    correlation_id: options.correlation_id || uuidv4(),
    tenant_id: options.tenant_id || null,
    occurred_at: options.occurred_at || new Date().toISOString(),
    emitted_at: new Date().toISOString()
  };
  return {
    type: eventType,
    envelope,
    payload
  };
}

module.exports = { emitEvent };
