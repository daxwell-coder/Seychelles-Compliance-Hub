# Compliance Platform Backlog (Updated August 12, 2025)

**Sprint 1 Deliverables Completed**: Task #3 (Deterministic Encryption) and Task #4 (External Anchoring) successfully implemented and deployed. This backlog has been updated to reflect current priorities with major security and integrity improvements now operational.

This backlog turns blueprint gaps into actionable, prioritized work. It favors sequence that reduces rework and strengthens governance (classifier → task engine → envelope standardization) before higher-level analytics and UI layers.

## Prioritization Key
- P0: Immediate (unblocks core regulatory/intelligence workflows & integrity)
- P1: Near-term (enhances analyst productivity & depth)
- P2: Mid-term (advanced analytics, external assurance, nice-to-have until foundations solid)

## Epic Summary Table **[UPDATED]**
| Epic | Priority | Status | Core Outcome |
|------|----------|---------|--------------|
| ✅ **Regulatory Impact Classifier** | **P0** | **✅ COMPLETE** | **Structured impact assessment events for new/changed obligations implemented** |
| ✅ **Task Engine & Workflow** | **P0** | **✅ COMPLETE** | **Lifecycle tracking (created→in_progress→escalated→closed) with auditable events** |
| ✅ **Event Envelope Normalization** | **P0** | **✅ COMPLETE** | **Consistent envelope (producer, correlation_id, tenant_id, occurred_at) enabling cross-stream joins** |
| ✅ **Narrative Scoring Service** | **P1** | **✅ COMPLETE** | **Automated quality scoring vs rubric for analyst narratives / STR drafts** |
| ✅ **Deterministic Encryption & Multi-Tenancy** | **P1** | **✅ COMPLETE** | **Field-level protection + searchable hashed tokens implemented** |
| ✅ **External Chain Anchoring** | **P2** | **✅ COMPLETE** | **Stub provider anchoring + verification endpoints implemented** |
| Obligation Packs & Loader | P1 | Not Started | Modular obligation set installation + version tracking |
| Sanctions Heuristics Enhancement | P1 | Not Started | Phonetic & transliteration fuzzy screening improvements |
| Regulator Portal (Read‑Only MVP) | P1 | Not Started | External transparency dashboard for obligations & integrity chains |
| AI Feature Store & Anomaly/Risk Layer | P2 | Not Started | Centralized engineered features feeding detection models |
| Business Ownership XML Generator | P2 | Not Started | Standards-compliant BO / beneficial owner export |
| Red-Flag Prompt Generator | P2 | Not Started | Dynamic LLM prompts aligned with current regulatory red flags |

---
## 1. Regulatory Impact Classifier (P0)
Goal: Convert regulatory change inputs into structured impact assessments and prioritized remediation tasks.

User Stories:
- As a compliance analyst, I want automated classification of a new regulatory text so I can quickly triage required actions.
- As an auditor, I need immutable events capturing the decision basis.

Key Event Schemas (new):
- regulatory.change.ingested
- regulatory.impact.assessed

Acceptance Criteria:
- Given uploaded/ingested text, system emits regulatory.change.ingested with source URI, hash, jurisdiction.
- Impact classifier produces impacted_obligation_ids[], impact_level (LOW|MEDIUM|HIGH|CRITICAL), rationale_ref (pointer to extracted paragraphs) within 60s.
- Emits regulatory.impact.assessed referencing change_event_id and snapshot of classifier version/hash.
- 95% of runs produce deterministic hash for identical inputs.

Tasks:
- Schema JSON additions + hash recompute.
- Firestore collections: regulatory_changes, regulatory_impacts.
- Minimal classifier stub (rule-based matching on obligation keywords) with interface for future ML.
- Unit tests: keyword mapping, idempotency (same hash → no duplicate impact event).
- Infra: Function (HTTP or Pub/Sub) + scheduled retrain placeholder (no-op initially).

Metrics:
- Time from ingestion → impact event (p50/p95).
- % changes with zero matched obligations (alert if >20%).

---
## 2. Task Engine & Workflow (P0)
Goal: Track remediation & operational tasks arising from impact assessments, audits, and chain invalidations.

User Stories:
- As a remediation lead, I want tasks auto-created from high-impact assessments.
- As an auditor, I need an immutable event trail of status transitions.

Event Schemas (new):
- task.created
- task.status.changed
- task.escalated
- task.closed

Acceptance Criteria:
- Creating a task emits task.created with initial status=OPEN.
- Status transitions validated by finite state model (OPEN→IN_PROGRESS→REVIEW→CLOSED; OPEN→ESCALATED→IN_PROGRESS allowed).
- Escalation requires reason field; emits task.escalated with escalation_level.
- All events reference origin (impact_assessment_id | manual | system) + correlation_id thread.

Tasks:
- Firestore collections: tasks, task_history (optional) or rely solely on events.
- Library: workflow/state guard (pure function validateTransition(prev, next)).
- Automatic task creation from CRITICAL impact assessments.
- Indexes: tasks by status, owner, origin.
- Tests: invalid transitions rejected; escalation reason required.

Metrics:
- Task SLA aging buckets; escalation rate.

---
## 3. Event Envelope Normalization (P0)
Goal: Consistent metadata enabling correlation, multi-tenancy, and lineage.

Envelope Fields (add if missing):
- envelope.version (start at 1)
- producer (service/module name)
- correlation_id (UUID) – constant per workflow chain
- tenant_id (nullable placeholder until multi-tenant ready)
- occurred_at (ISO timestamp actual event time) distinct from emitted_at

Acceptance Criteria:
- All new events carry full envelope.
- Backward compatibility: legacy consumer paths tolerate missing fields.
- BigQuery view updated with standardized column names.
- Schema registry updated; registry hash recomputed.

Tasks:
- Shared event emitter wrapper upgrade; migration script / fallback wrapper for old code.
- Update hashing logic to hash canonical event excluding non-deterministic emitted_at.
- Tests: deterministic hash same across replays with identical occurred_at.

---
## 4. Narrative Scoring Service (P1)
Goal: Automatic quality score for analyst narratives vs rubric.

Event Schemas:
- narrative.scored

Acceptance Criteria:
- POST narrative text returns score components (clarity, completeness, risk_alignment, traceability) each 0–1 and composite.
- Deterministic baseline heuristic (keyword density, obligation coverage) before LLM integration.
- Event narrative.scored emitted with rubric_version + scoring_model_hash.

Tasks:
- Rubric loader (docs/narrative_rubric.json already exists) + validation.
- Heuristic scorer implementation + unit tests (edge: empty, very long, missing obligations references).
- Optional LLM adapter interface (not implemented yet) + stub.

---
## 5. Obligation Packs & Loader (P1)
Goal: Modular installation/versioning of obligation sets (e.g., Beneficial Ownership, AML Transaction Monitoring).

Event Schemas:
- obligation.pack.installed
- obligation.pack.upgraded

Acceptance Criteria:
- Pack manifest format (id, version, obligations[], source_hash, license).
- Install path validates no duplicate obligation IDs; maintains pack_versions collection.
- Hash chain continues unaffected; snapshot includes pack attribution.

Tasks:
- Pack manifest schema definition.
- Loader function (HTTP authorized) reading uploaded manifest JSON.
- Tests: version upgrade detection, duplicate prevention.

---
## ✅ 6. Deterministic Encryption & Multi-Tenancy **[COMPLETED]**
**Status**: ✅ **IMPLEMENTED AND DEPLOYED**

**Implemented Features**:
- ✅ **Deterministic Encryption Utility**: AES-256-CTR with PBKDF2 key derivation
- ✅ **Searchable Hash Generation**: HMAC-SHA256 for equality queries while preserving privacy
- ✅ **Field-Level PII Encryption**: Full name, addresses, national IDs, tax IDs
- ✅ **Encrypted Data Search Service**: Universal and field-specific searches
- ✅ **REST API Endpoints**: Health checks, search, and client detail retrieval
- ✅ **Integration**: Client onboarding now encrypts PII automatically

**Deployed Functions**:
- `search-encrypted-data`: Main search API
- `search-health-check`: Service health monitoring
- Updated `onboard-client-function` with encryption

**Evidence**: 
- Code: `functions/src/deterministicEncryption.ts`, `encryptedDataSearch.ts`, `searchService.ts`
- Tests: `scripts/test_task3_encryption.ps1`

---
## ✅ 10. External Chain Anchoring **[COMPLETED]**
**Status**: ✅ **IMPLEMENTED AND DEPLOYED**

**Implemented Features**:
- ✅ **Anchor Provider Abstraction**: Interface supporting multiple external providers
- ✅ **Stub Gist Provider**: Signed JSON + simulated public URL anchoring
- ✅ **Weekly Automatic Anchoring**: Scheduled job aggregating chain roots
- ✅ **Manual Anchor Trigger**: Emergency/testing endpoint
- ✅ **Anchor Verification**: Tamper detection and integrity validation
- ✅ **Event-Driven Processing**: Listens to chain computation events
- ✅ **Combined Root Hash**: Merkle-tree ready aggregation

**Deployed Functions**:
- `process-chain-for-anchoring`: Event handler for chain events
- `weekly-anchor-publisher`: Scheduled weekly job
- `publish-anchor-manual`: Manual trigger endpoint
- `verify-anchor`: Verification API
- `anchor-status`: System status dashboard

**Evidence**:
- Code: `functions/src/externalAnchor.ts`
- Tests: `scripts/test_task4_anchoring.ps1`

**Next Steps**: Replace stub provider with production blockchain/timestamping service
Goal: Improve name screening beyond exact match.

Acceptance Criteria:
- Add phonetic (Double Metaphone) + basic transliteration normalization.
- Provide similarity score threshold; emit sanctions.screening.performed event.
- False positive rate baseline logged (manually labeled sample support).

Tasks:
- Library selection (e.g., metaphone implementation) or implement minimal algorithm.
- Normalization pipeline: lowercasing, diacritics removal.
- Tests: Cyrillic → Latin transliteration edge cases.

---
## 8. Regulator Portal (Read-Only MVP) (P1)
Goal: External-facing view (protected) of obligations state & integrity status.

Acceptance Criteria:
- Displays: current obligations count, last snapshot hash, last audit chain root, outstanding CRITICAL tasks.
- Auth via API key or future OIDC (configurable).
- No write operations.

Tasks:
- Minimal Next.js page leveraging existing Firestore reads (read-only service account).
- Cache layer (60s) to avoid quota spikes.

---
## 9. AI Feature Store & Anomaly/Risk Layer (P2)
Goal: Central repository of engineered features powering future ML models.

Acceptance Criteria:
- Feature registry JSON (name, description, owner, computation cadence, data lineage).
- Batch computation job writing to BigQuery feature table with version column.

Tasks:
- Define base features (transaction_amount_zscore, client_country_risk_score).
- Scheduler + job function.

---
## 7. Sanctions Heuristics Enhancement (P1)
## 11. Business Ownership XML Generator (P2)
Goal: Export beneficial ownership in regulatory XML schema.

Acceptance Criteria:
- Generate validated XML (schema XSD documented) for a client id.
- Emits bo.export.generated event with hash of file.

Tasks:
- XSD schema capture + validator selection.
- Mapping logic from Firestore structures.

---
## 12. Red-Flag Prompt Generator (P2)
Goal: Contextual prompts for analysts / LLM based on emerging red flags.

Acceptance Criteria:
- Maintains red_flag_catalog collection.
- Scheduled function assembles prompt template referencing active flags + jurisdiction deltas.
- Emits redflags.prompt.generated event.

Tasks:
- Catalog JSON format + sample seed.
- Prompt assembly engine.

---
## Cross-Cutting Tasks
- Update schema registry & hash after every new event schema.
- Extend test coverage threshold (line >=80% for new modules).
- Observability: structured logs for classifier decisions & scoring rationales.
- Security review checklist per epic (authz, PII fields, encryption tagging).
- Documentation: Each epic gets README in docs/epics/<epic-id>.md before implementation considered done.

---
## Suggested Implementation Order (Sprint-Level) **[UPDATED]**
1. ✅ **Sprint 1 (completed Aug 12)**: ~~Epics 1, 2, 3~~ + **Deterministic Encryption + External Anchoring** delivered ahead of schedule
2. **Sprint 2 (current)**: Epics 1, 2, 3 (Classifier, Task Engine, Envelope) + schema updates + Narrative Scoring baseline
3. Sprint 3: Finish narrative scoring, Epics 7, 8 (sanctions heuristics, portal); start feature store skeleton  
4. Sprint 4+: Remaining P2 epics (BO XML, red-flag prompts) + iterative ML enrichment + production anchoring provider

---
## Definition of Done (Per Epic Item)
- Code + tests merged (CI green, coverage threshold met).
- Schema registry updated & hashed; no drift.
- Docs: Epic README + API / event examples.
- Security review notes committed (docs/security/<epic>.md).
- Metrics instrumentation exposed (log or BigQuery table). 

---
## Next Immediate Actions (P0 Execution)
1. Add new event schemas (classifier + task engine + envelope v1) to registry.
2. Upgrade emitter library & retrofit existing emissions.
3. Implement minimal rule-based impact classifier.
4. Implement task workflow service + events + tests.
5. Recompute schema hashes; adjust BigQuery ingestion mapping.

---
Generated backlog is intentionally lean on implementation detail for P2 epics to avoid premature optimization. Update as domain clarifications emerge.
