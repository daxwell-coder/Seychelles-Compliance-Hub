// Integration test for schv1 compliance pipeline
import { classifyRegulatoryImpact } from '../lib/impactClassifier.js';
import { createTask } from '../lib/taskWorkflow.js';
import { emitEvent } from '../lib/emitter.js';
import { installObligationPack } from '../lib/obligationPackLoader.mjs';
import { sanctionsSimilarityScore } from '../lib/sanctionsHeuristics.mjs';
import { scoreNarrative } from '../lib/narrativeScoring.mjs';
import path from 'path';

// 1. Install obligation pack
const manifestPath = path.join(process.cwd(), 'data', 'schemas', 'obligation_pack_sample.json');
const packResult = installObligationPack(manifestPath);
console.log('Obligation pack install:', packResult);

// 2. Simulate regulatory change event
const regulatoryText = 'New AML and beneficial ownership requirements for all IBCs.';
const impact = classifyRegulatoryImpact(regulatoryText);
console.log('Impact classification:', impact);

// 3. Create task from impact
const task = createTask('impact_assessment', 'corr-456');
console.log('Task created:', task);

// 4. Emit event for impact assessment
const event = emitEvent('regulatory.impact.assessed', impact, { producer: 'integration-test' });
console.log('Event emitted:', event);

// 5. Run sanctions similarity check
const sanctionsScore = sanctionsSimilarityScore('Müller', 'Mueller');
console.log('Sanctions similarity score (Müller vs Mueller):', sanctionsScore);

// 6. Score a narrative
const narrative = 'This STR clearly describes the suspicious activity. All events are in order. Red flags are referenced. Transactions and entities are linked. Legal guidance is cited. The narrative is concise.';
const narrativeScore = scoreNarrative(narrative);
console.log('Narrative score:', narrativeScore);
