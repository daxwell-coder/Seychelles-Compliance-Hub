#!/usr/bin/env node
// Computes per-schema and registry hash for docs/event_schema_registry.json
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const registryPath = path.join(__dirname, '..', 'docs', 'event_schema_registry.json');

function stableStringify(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(v => stableStringify(v)).join(',') + ']';
  return '{' + Object.keys(obj).sort().map(k => JSON.stringify(k) + ':' + stableStringify(obj[k])).join(',') + '}';
}

function hash(input) { return crypto.createHash('sha256').update(input).digest('hex'); }

const raw = fs.readFileSync(registryPath, 'utf-8');
const json = JSON.parse(raw);

const updatedSchemas = json.schemas.map(s => {
  const schemaCopy = { ...s };
  delete schemaCopy.schema_hash; // normalize
  const h = hash(stableStringify(schemaCopy));
  return { ...s, schema_hash: h };
});

const registryHash = hash(stableStringify(updatedSchemas.map(s => ({ type: s.type, schema_hash: s.schema_hash }))));

const output = { ...json, schemas: updatedSchemas, registry_hash: registryHash };
fs.writeFileSync(registryPath, JSON.stringify(output, null, 2) + '\n');
console.log('Updated schema hashes. Registry hash:', registryHash);
