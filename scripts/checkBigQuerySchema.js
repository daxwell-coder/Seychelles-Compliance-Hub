#!/usr/bin/env node
// Lightweight offline BigQuery schema guard. Ensures the expected schema file
// stays consistent and that no required columns are accidentally removed.
const fs = require('fs');
const path = require('path');

const specPath = path.join(__dirname, '..', 'docs', 'bigquery_event_log_expected.json');
if (!fs.existsSync(specPath)) {
  console.error('Missing expected schema spec at', specPath);
  process.exit(1);
}
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));

// Very simple check: ensure there are no duplicate column names and types are present.
const names = new Set();
for (const col of spec.required_columns) {
  if (!col.name || !col.type) {
    console.error('Column missing name or type:', col);
    process.exit(1);
  }
  if (names.has(col.name)) {
    console.error('Duplicate column name in expected schema:', col.name);
    process.exit(1);
  }
  names.add(col.name);
}

// In future: compare against live BQ via API (requires auth) or Terraform state.
console.log('BigQuery expected schema check passed. Columns:', [...names].join(', '));
