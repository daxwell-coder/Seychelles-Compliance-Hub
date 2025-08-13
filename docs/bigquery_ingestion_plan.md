# BigQuery Ingestion Plan (Phase Alignment with Blueprint v6.0)

## Purpose
Establish an event journal and analytics foundation in BigQuery to support: risk signals, obligation impact analytics, AI evaluation sets, and regulator portal metrics. Aligns with Blueprint v6.0 Sections 5 (Data Architecture), 6 (Event-Driven), 8 (Security & Privacy), 11 (Metrics & SLOs), and future Phase 2+ needs.

## Scope (Initial Increment)
1. Create dataset: `platform_events` (region US, default partition expiration disabled initially).
2. Create table: `event_log` (partitioned by ingestion time, clustered by `type`).
3. Ingest every Pub/Sub platform event (raw) with minimal transformation.
4. Derive daily summary table (scheduled query) for counts & distinct entities.
5. Expose MATERIALIZED VIEW later for regulator portal aggregated KPIs.

## Table Schema (event_log)
| Column | Type | Description |
|--------|------|-------------|
| event_id | STRING | UUID (generated if absent) |
| type | STRING | Event type (e.g. onboarding.completed) |
| emitted_at | TIMESTAMP | Original emitter timestamp |
| received_at | TIMESTAMP | Ingestion timestamp (server) |
| schema_id | STRING | Registry schema ID (if available) |
| payload_hash | STRING | SHA256 canonical hash of payload JSON |
| raw_payload | JSON | Original payload object |
| producer | STRING | Logical service (derived from type or header) |
| tenant_id | STRING | Future multi-tenant routing (nullable now) |
| correlation_id | STRING | Workflow correlation (nullable) |

Partitioning: by received_at (DAY).  
Clustering: by type, schema_id.

## Ingestion Options Considered
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Cloud Function subscriber (Node) | Simple, fast iteration | Possible scaling lag for bursts | Selected (initial) |
| Dataflow Flex (Beam) | Scales, windowing built-in | Higher complexity & cost early | Later phase upgrade |
| Pub/Sub BigQuery direct write (not native) | N/A | Not supported directly | N/A |

## Implementation Steps (Incremental)
1. Terraform: enable BigQuery API, create dataset & table (raw schema minimal).  
2. Add `events-ingestor` Cloud Function subscribed to `platform-events` topic.  
3. Function logic: wrap message, compute payload_hash, default missing envelope fields.  
4. Add retries on transient BigQuery errors (deadline exceeded, internal).  
5. Add dead-letter Pub/Sub topic (terraform) for failed ingestions after N retries.  
6. Scheduled query for daily summary (counts by type, distinct (raw_payload.clientId)).

## Hashing Canonicalization
Canonical stringify: stable key sort JSON; hash with SHA256 for payload_hash; store for tamper detection + alignment with audit hash chain future Merkle root.

## Security & Governance
- Service account: scoped to BigQuery Data Editor on dataset only.  
- Deny raw PII export queries without row-level policy (future).  
- Access logs tied to regulator portal read sessions.

## Phase Alignment
- Phase 1 deliverable: dataset + raw ingestion.  
- Phase 2: add enrichment columns (entity_id, obligation_ids impacted).  
- Phase 3: risk feature generation incremental tables.  
- Phase 4: anomaly detection feature views.  
- Phase 5: multi-tenant partitioning or dataset per tenant.

## Future Enhancements
- Upgrade to Dataflow streaming pipeline with dead-letter BigQuery table.  
- Materialized view for 7‑day rolling metrics.  
- Automated schema evolution tests (CI) comparing registry vs event_log columns.  
- Integration with audit hash chain: store daily chain root into control table `audit_daily_roots`.

## Acceptance Criteria
- All events published to Pub/Sub appear in `event_log` within < 60s.  
- 0 ingestion failures for baseline load test (100 sample events).  
- Daily summary query completes < 10s for first month of data.

## Next Action (if approved)
Proceed to implement Terraform BigQuery dataset + table plus events-ingestor function.
