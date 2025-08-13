// Narrative Scoring Service for schv1
// Scores analyst narratives against rubric dimensions
import fs from 'fs';
import path from 'path';

const RUBRIC_PATH = path.join(process.cwd(), 'docs', 'narrative_rubric.json');

function loadRubric() {
  return JSON.parse(fs.readFileSync(RUBRIC_PATH, 'utf-8'));
}

function scoreNarrative(text) {
  const rubric = loadRubric();
  const scores = {};
  let total = 0;
  let count = 0;
  for (const dim of rubric.dimensions) {
    // Heuristic: score 5 if dimension keyword present, else 2
    const present = text.toLowerCase().includes(dim.id.replace('_', ''));
    const score = present ? 5 : 2;
    scores[dim.id] = score;
    total += score;
    count++;
  }
  const composite = total / count;
  return { ...scores, composite };
}

export { scoreNarrative };
