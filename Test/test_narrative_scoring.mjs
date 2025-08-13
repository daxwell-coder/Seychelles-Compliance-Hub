// Test for Narrative Scoring Service
import { scoreNarrative } from '../lib/narrativeScoring.mjs';

const narratives = [
  'This STR clearly describes the suspicious activity. All events are in order. Red flags are referenced. Transactions and entities are linked. Legal guidance is cited. The narrative is concise.',
  'Suspicion is described. Some events are out of order. No red flags. Transactions are mentioned. No legal citation. Narrative is verbose.',
  'Clear, concise, and cites regulations. All events are linked.'
];

for (const text of narratives) {
  const score = scoreNarrative(text);
  console.log(`Narrative: ${text}\nScore:`, score, '\n');
}
