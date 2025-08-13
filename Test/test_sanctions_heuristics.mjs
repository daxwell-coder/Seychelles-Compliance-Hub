// Test for Sanctions Heuristics Enhancement
import { normalizeName, getPhoneticCode, sanctionsSimilarityScore } from '../lib/sanctionsHeuristics.mjs';

const names = [
  ['Müller', 'Mueller'],
  ['O’Connor', 'Oconnor'],
  ['Schröder', 'Schroeder'],
  ['Smith', 'Smyth'],
  ['Ivanov', 'Ivanoff'],
  ['García', 'Garcia'],
  ['Jørgensen', 'Jorgensen'],
  ['François', 'Francois'],
  ['Søren', 'Soren'],
  ['Björk', 'Bjork']
];

for (const [a, b] of names) {
  const normA = normalizeName(a);
  const normB = normalizeName(b);
  const [codeA1, codeA2] = getPhoneticCode(a);
  const [codeB1, codeB2] = getPhoneticCode(b);
  const score = sanctionsSimilarityScore(a, b);
  console.log(`${a} vs ${b}: normA=${normA}, normB=${normB}, codeA=[${codeA1},${codeA2}], codeB=[${codeB1},${codeB2}], score=${score}`);
}
