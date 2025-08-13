# Seychelles Compliance Hub – Strategic, Tactical & Architectural Blueprint (Version 6.0)

> This Version 6.0 supersedes v5.2. It integrates: obligation knowledge graph, event-driven architecture, AI governance, secret & key lifecycle, regulator collaboration portal, extensibility path for all FSA‑regulated entities, and execution continuation plan.

## 1. Vision (Plain Language)
We are building a living compliance engine for Seychelles. It watches regulatory changes, updates itself, guides users to do the right filings on time, drafts high‑quality reports, and lets regulators transparently review what they need—securely—reducing risk for every stakeholder (IBC, Resident Agent, VASP, banks, FSA, FIU).

## 2. Core Strategic Pillars
1. Dynamic Obligation Graph – One canonical source of “who must do what, when, and with which data fields.”
2. Event‑Driven Architecture – Every important action becomes an event enabling automation, auditability, replay.
3. Explainable AI Assistance – AI helps draft, classify, score narratives, but always cites sources and is reviewable.
4. Regulator Collaboration Mode – Time‑boxed, read‑only, fully logged access for FSA examiners.
5. Jurisdictional Depth First – Deep mastery of Seychelles, then structured expansion to other Indian Ocean & global jurisdictions.
6. Extensibility via “Obligation Packs” – Plug‑in bundles (schemas + validations + workflow templates + filing generators).

## 3. Stakeholder Pain Points & How We Solve Them
| Stakeholder | Pain Point | Platform Solution |
|-------------|-----------|------------------|
| IBC | Deadlines, fragmented docs | Automated reminders, document vault, obligation tasks |
| Resident Agent / ICSP | Duplicate data re-entry | Canonical entity & BO graph shared across modules |
| Compliance Officer | STR narrative quality pressure | Narrative Co‑Pilot + scoring rubric + red‑flag prompts |
| FIU | Poor STR consistency, BO data errors | Validated schemas, AI pre‑validation, change-driven schema updates |
| FSA | Limited proactive visibility | Regulator dashboard with curated metrics, immutable audit journal |
| VASP | High-volume anomaly detection | Transaction risk engine + goAML API staging |
| Future Regulated Entities | Onboarding new obligations slow | Obligation pack model reduces time-to-support |

## 4. Capability Map (Modules)
- Onboarding & BO Module (entity + ownership graph, XML generator) 
- STR / VASTR Co‑Pilot (structured field auto-fill, narrative drafting + quality scoring) 
- Sanctions & Screening (fuzzy + transliteration + local heuristics) 
- Regulatory Change Monitor (web diff + semantic impact + obligation graph updates) 
- Obligation Knowledge Graph Service (schemas, deadlines, dependencies, jurisdiction tags) 
- Task & Workflow Engine (SLA timers, escalations, multistep approvals) 
- Document Vault (encrypted storage, retention & residency policies) 
- Risk & Analytics Layer (feature store, anomaly detection, scoring) 
- Regulator Portal (time‑boxed access, dashboards, audit trails) 
- Extension Framework (obligation packs, versioned) 

## 5. Data & Information Architecture
### 5.1 Logical Stores
| Layer | Purpose | Tech (initial) |
|-------|---------|----------------|
| Raw Ingestion | Immutable capture (page snapshots, raw filings) | Cloud Storage versioned |
| Operational Core | Current truth (entities, obligations, tasks) | Firestore |
| Analytics & ML | Aggregations, risk features, trend analysis | BigQuery |
| Feature Store | Materialized signals (risk scores, timings) | BigQuery tables / views |
| Audit Journal | Append-only event log | Pub/Sub -> BigQuery + hash chain |
| Secrets & Keys | Credential & encryption management | Secret Manager + KMS |

### 5.2 Knowledge Graph (Initial Node Types)
- Entity (IBC, VASP, Officer, UBO) 
- Filing (BO submission, STR, Accounting batch) 
- Obligation (template w/ rule set & effective dates) 
- RegulatoryChange (diff summary + impacted obligations) 
- Task (human action needed) 
- RiskSignal (derived metric) 
- Document (vault item w/ retention policy) 

Edges encode relationships (OWNS, CONTROLS, SATISFIES, IMPACTS, REQUIRES, PRODUCED_FROM).

### 5.3 Versioning
Every obligation + schema carries: { schema_id, version, effective_from, deprecated_from, source_reference_url }.

## 6. Event-Driven Architecture
Event Envelope: `{ event_id, type, occurred_at, producer, schema_ref, payload_hash, tenant_id, correlation_id }`.

Key Event Types (Phase 1):
- onboarding.requested / onboarding.completed
- sanctions.screened / sanctions.flagged
- regulatory.page_fetched / regulatory.diff_detected / regulatory.impact_assessed
- obligation.schema.updated
- filing.bo.generated / filing.str.draft_created / filing.str.submitted
- task.created / task.escalated / task.closed

Events feed: automation handlers, audit journal, metrics pipelines.

## 7. AI & Automation Governance
| Dimension | Policy |
|-----------|--------|
| Source Grounding | All AI outputs cite regulatory section IDs / URLs |
| Human Oversight | STR & BO filings require human sign-off before submission |
| Drift Monitoring | Monthly evaluation set; score deltas logged |
| Bias & Hallucination Control | Retrieval‑augmented prompts; reject ungrounded claims |
| Data Privacy | No PII leaves controlled processing boundary; redaction layer for model queries |
| Feedback Loop | User dispositions (approve/edit/reject) feed model recalibration |

Narrative Scoring Dimensions (0–5 each): clarity, chronology, risk flags coverage, data linkage, regulatory citation, conciseness.

## 8. Security & Privacy Model
- Multi-tenancy isolation: tenant_id scoped queries + Firestore composite indexes; future row-level security in secondary store.
- Field-level deterministic encryption for sensitive identifiers (UBO IDs) enabling equality search.
- KMS key-per-tenant roadmap; centralized rotation policy (annual + ad hoc).
- Secrets: secret version resources + quarterly rotation tasks.
- Immutable audit: BigQuery table + daily Merkle root anchoring (hash stored in separate control file).

## 9. Regulator Collaboration Portal
Features: Time-limited access tokens, curated dashboards (no raw PII unless justified), export with watermarking, full access log, automatic revocation. Compliance officer workflow for granting & revoking.

## 10. Extensibility (“Obligation Packs”)
Pack Contents: obligation_metadata.json, form_schemas (JSON Schema / Zod), validation rules, workflow templates, filing generators, dashboards config. Installed via internal admin UI—applies migrations to obligation graph.

Roadmap of Packs:
- Pack A: BO + Accounting (done first) 
- Pack B: STR / VASTR 
- Pack C: Prudential Returns (securities dealers) 
- Pack D: Fitness & Propriety (officer changes) 
- Pack E: Insurance & Trust Reporting 

## 11. Metrics & SLOs
| Metric | Definition | Target |
|--------|------------|--------|
| Filing Timeliness | % filings before deadline | ≥ 95% |
| Reg Change Adoption | Detection → schema update deployed | < 5 days |
| Reg Change Detection Latency | Page change → diff event | < 2 hours |
| STR Narrative Quality | Avg rubric score | ≥ 4.0/5 |
| Sanctions False Positive Reduction | Baseline vs current | ≥ 25% year 1 |
| Mean Onboarding Cycle Time | request → completion | < 1 business day |

## 12. Execution Continuation Plan (From Current State)
Current Achievements: Basic onboarding function, CSV ingestion function, regulatory monitor prototype, Terraform infra (buckets, functions, secret, IAM), initial secret but no version.

### Phase 0 (Immediate Hardening – Weeks 1–2)
1. Fix Zod schema (date usage) & normalize inputs. 
2. Add Secret Manager secret version + rotation variable. 
3. Implement obligation_matrix.json (seed) + load on startup. 
4. Introduce event emitter wrapper & log onboarding events. 
5. Add basic sanctions screening adapter interface (mock implementation).

### Phase 1 (Foundation Expansion – Weeks 3–6)
1. Regulatory Diff MVP (fetch FSA/FIU pages, hash, diff, store snapshot). 
2. Impact classifier stub (manual tagging workflow). 
3. Task Engine skeleton (create/escalate/close). 
4. Narrative scoring service (rule-based initial rubric). 
5. Add audit hash chaining job (daily Cloud Scheduler). 

### Phase 2 (Obligation Graph & BO XML – Weeks 7–10)
1. Formalize BO obligation pack (schema + xml mapping). 
2. BO XML generator service (validated against FIU spec). 
3. Add idempotent onboarding (client_request_id). 
4. Regulator portal prototype (read-only summary & access grant workflow). 

### Phase 3 (STR Co-Pilot & Sanctions Enhancements – Weeks 11–14)
1. Structured field auto-population engine (mapping layer). 
2. Red-flag prompt generator (rule + ML hybrid). 
3. Sanctions heuristics layer (phonetic + transliteration). 
4. Human review workflow w/ dual control for STR submission. 

### Phase 4 (VASP & Risk Layer – Weeks 15–20)
1. Blockchain data ingestion connector (staging). 
2. Feature store baseline (transaction velocity, geo entropy, ownership complexity index). 
3. Anomaly detection (unsupervised baseline). 
4. VASTR/VASAR draft staging via goAML API test env.

### Phase 5 (Extensibility & Multi-Entity – Weeks 21–26)
1. Obligation pack installer UI. 
2. Add Securities Dealer & Prudential Returns pack. 
3. Fitness & Propriety pack (officer change workflow). 
4. Multi-tenant encryption key scheme (KMS key per tenant pilot). 

### Ongoing Streams
- AI Governance Reviews (monthly) 
- Security Hardening & Pen Tests (quarterly) 
- Reg Change Backlog Grooming (bi-weekly) 
- Metrics & SLO review (monthly) 

## 13. Risk Register (Top 5)
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| Secret version missing causes runtime failures | High | Medium | Add version resource + CI policy |
| Regulatory change parser hallucination | Medium | High | Retrieval + human impact validation step |
| Puppeteer instability | Medium | Medium | Add retry + fallback lightweight fetch strategy |
| Data model divergence across packs | Medium | High | Central schema registry with version gates |
| STR narrative AI over-reliance | Low | High | Mandatory human approval + quality rubric enforcement |

## 14. Non-Technical System Diagram (Plain Text)
```
[Users]
  |-- Company Clients (IBCs, VASPs)
  |-- Compliance Officers / Resident Agents
  |-- FSA / FIU Examiners (controlled access)

[Client Portal Web App]
  -> talks to -> [API & Gateway Layer]
       -> routes to microservices:
          - Onboarding & BO Service
          - STR / VASTR Co-Pilot Service
          - Sanctions Screening Service
          - Regulatory Change Monitor
          - Obligation Graph Service
          - Task & Workflow Engine
          - Document Vault Service
          - Risk & Analytics Service
          - Regulator Portal Service

[Event Bus (Pub/Sub)]
  <- receives events from all services
  -> feeds Audit Journal, Metrics, Automation

[Data Stores]
  - Firestore (operational data)
  - Cloud Storage (documents & snapshots)
  - BigQuery (analytics & risk features)
  - Secret Manager (API keys, credentials)
  - KMS (encryption keys)

[AI / ML Layer]
  - Narrative Scoring
  - Regulatory Diff & Impact
  - Sanctions Heuristics
  - Risk / Anomaly Models

[Regulator Portal]
  - Read-only dashboards
  - Time-limited secure access

[Monitoring & Audit]
  - Central logs + hash chain
  - Metrics dashboards & alerts
```

## 15. Initial Artifacts Added
- `docs/obligation_matrix.json` (seed)
- `docs/event_schema_registry.json`
- `docs/narrative_rubric.json`
- `docs/ai_governance_policy.md`

## 16. Immediate Developer Actions
1. Implement secret version resource in Terraform. 
2. Patch onboarding function schema (date handling). 
3. Create event emitter utility & log onboarding events. 
4. Populate obligation matrix iteratively with compliance officer input.

## 17. Versioning & Change Control
Future blueprint changes will: include semantic version bump, diff summary, and risk impact note. Store in repo under `docs/` with changelog.

---
Prepared: Version 6.0 Blueprint. Ready for execution phases.
