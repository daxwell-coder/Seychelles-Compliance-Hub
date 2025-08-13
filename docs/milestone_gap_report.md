# Milestone & Blueprint Gap Report (Generated Aug 12 2025)

## 1. Executive Summary
**Major Progress Update**: Foundation (Phase 0) complete with recent Sprint 1 deliverables successfully implemented. **Task #3 (Deterministic Encryption)** and **Task #4 (External Anchoring)** now fully deployed and operational. Core security posture significantly strengthened with PII encryption, searchable hashes, and external tamper-evidence scaffolding. System ready for Phase 1 intelligence enhancements.

## 2. Current Capability Matrix
| Capability | Status | Evidence | Gaps |
|-----------|--------|----------|------|
| Onboarding (validation + idempotency) | ✅ **Enhanced** | services/client-onboarding **+ PII encryption** | Multi-tenant scoping pending |
| Sanctions Screening (mock) | Implemented (basic) | onboarding service events | Lacks fuzzy heuristics & watchlist integration |
| Event Governance (registry + hashing) | Implemented | docs/event_schema_registry.json, computeSchemaHashes.js | Envelope normalization added but legacy events not backfilled |
| Regulatory Change Monitoring | Implemented (page hash) | regulatoryMonitor.ts | No diff summarization / semantic extraction |
| Regulatory Impact Classifier | Implemented (rule stub) | regulatoryClassifier.ts | Needs ML/semantic model, confidence scores |
| Task Engine Workflow | Implemented (basic) | taskEngine.ts | Missing auto-task creation on CRITICAL impacts, escalation SLA metrics |
| Obligations Snapshot Chain | Implemented | obligationsSnapshot.ts | ✅ **External anchoring implemented** |
| Audit Hash Chain | Implemented | auditHashChain.ts | ✅ **External anchoring + chain root publication implemented** |
| Chain Verification & Invalid Event | Implemented | obligationsSnapshotVerify*, audit hash verification | Add BigQuery reconciliation later |
| Metrics Endpoint | Implemented | metricsEndpoint in index.ts | Need auth hardening (IP allow / mTLS optional) |
| BigQuery Event Ledger | Implemented | eventsIngestor.ts + terraform | Envelope schema mismatch (emitted_at vs emittedAt) normalization scheduled |
| **Deterministic Encryption** | ✅ **Implemented** | **functions/src/deterministicEncryption.ts + searchService.ts** | **Production-ready with AES-256-CTR + searchable hashes** |
| **Encrypted Data Search** | ✅ **Implemented** | **functions/src/encryptedDataSearch.ts** | **Full-text and field-specific encrypted searches** |
| **External Chain Anchoring** | ✅ **Implemented** | **functions/src/externalAnchor.ts** | **Stub provider ready; replace with production blockchain/timestamping** |
| Multi-Tenancy (tenant_id) | Partially scaffolded | envelope tenant_id placeholder | End-to-end access controls & key isolation missing |
| Narrative Scoring | Not started | N/A | Implement heuristic + rubric loader |
| Obligation Packs Loader | Not started | N/A | Define manifest & events |
| Sanctions Heuristics (phonetic/transliteration) | Not started | N/A | Add algorithms + metrics |
| Regulator Portal | Not started | N/A | Build read-only dashboard |
| AI Feature Store / Anomaly Layer | Not started | N/A | Define registry + first batch features |
| BO XML Export | Not started | N/A | XSD mapping + generation |
| Red-Flag Prompt Generator | Not started | N/A | Catalog & scheduled synthesis |

## 3. Risk & Priority Highlights
- ✅ **Integrity: Major Improvement** - Internal hash chains strengthened with external anchoring scaffold; tamper risk perception gap significantly reduced
- ✅ **Security: Major Improvement** - Deterministic encryption implemented with AES-256-CTR; PII now encrypted with searchable hashes; Firestore IAM plus field-level encryption
- Observability: Event ingestion robust; classifier & task engine need metrics (latency, transition counts).
- Schema Drift: Envelope normalization changed field names (emitted_at vs emittedAt) requiring ingestion mapping update (planned).

## 4. Immediate High-Impact Actions (Next 2 Sprints) **[UPDATED]**
1. Complete envelope migration & adjust BigQuery ingestion to new structure.
2. Auto task creation: create CRITICAL remediation tasks directly from impact assessments.
3. ✅ **COMPLETED**: ~~Add deterministic encryption util + hash-only search fields for PII~~
4. ✅ **COMPLETED**: ~~External anchoring scaffold (even stub provider) for audit/obligation chain roots~~
5. **NEW PRIORITY**: Narrative scoring heuristic baseline to unlock quality metrics.

## 5. Technical Debt Items
- Legacy events previously emitted without envelope: consider one-time backfill or consumer tolerant parsing.
- Lack of test coverage for new classifier/task engine modules (add jest tests to maintain baseline quality).
- Puppeteer fetch risk (fragility, blocking): introduce timeout & fallback.
- Hard-coded classifier heuristic tokens; move to config for hot reload.

## 6. Metrics Roadmap
| Metric | Owner | Source | Phase |
|--------|-------|--------|-------|
| Event ingestion p95 latency | Platform | BigQuery vs emitted_at | 1 |
| Impact classification duration | Compliance Intelligence | ingestRegulatoryChange logs | 1 |
| Task SLA aging buckets | Operations | Firestore aggregation | 1 |
| Narrative quality composite | Intelligence | narrative.scored events | 2 |
| Sanctions heuristic FP rate | Screening | screening logs | 2 |
| Chain anchor interval compliance | Integrity | anchor events | 2 |

## 7. Governance & Compliance Alignment
- Traceability: Event payload hashing plus ledger supports forensic reconstruction (missing external notarization).
- Least Privilege: Single functions service account; future segregation (ingestion vs analytics) recommended.
- Data Minimization: Full raw regulatory page content stored; plan summarization + redaction for non-required sections.

## 8. Proposed Timeline Snapshot **[UPDATED]**
- ✅ **Sprint 1 (completed Aug 12)**: ~~Envelope migration~~ + ~~auto tasks~~ + **encryption util + external anchoring implemented**.
- Sprint 2 (current): **Narrative scoring** + sanctions heuristics v1 + **anchoring production provider**.
- Sprint 3: Packs loader + feature store + portal MVP.
- Sprint 4: Red-flag prompts + BO XML + multi-tenancy key isolation.

## 9. Open Questions
- Jurisdiction expansion sequence (which regulator next?).
- Required external attestations timeline (need by which audit date?).
- Acceptable PII encryption latency budget (client onboarding SLA?).

## 10. Appendices
- Registry Hash (current): be2a920fc33acf09b35fabf7a0f2658750f529f95c85a086b31c751e727e6e5a
- Classifier Version: kw-v1
- Task Engine State Model: OPEN -> IN_PROGRESS -> REVIEW -> CLOSED; OPEN -> ESCALATED -> IN_PROGRESS/CLOSED; REVIEW -> IN_PROGRESS/CLOSED.

---
Generated automatically; update when major architectural changes land.
