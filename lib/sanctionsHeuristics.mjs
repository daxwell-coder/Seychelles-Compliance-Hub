// Sanctions Heuristics Enhancement for schv1
// Adds phonetic (Double Metaphone) and basic transliteration normalization for sanctions screening

import { doubleMetaphone } from 'double-metaphone';

function normalizeName(name) {
  // Lowercase, remove diacritics, basic transliteration
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/ß/g, 'ss')
    .replace(/ø/g, 'o')
    .replace(/æ/g, 'ae')
    .replace(/œ/g, 'oe');
}

function getPhoneticCode(name) {
  return doubleMetaphone(normalizeName(name));
}

function sanctionsSimilarityScore(nameA, nameB) {
  const [codeA1, codeA2] = getPhoneticCode(nameA);
  const [codeB1, codeB2] = getPhoneticCode(nameB);
  // Score: 1 if primary matches, 0.5 if secondary matches, 0 otherwise
  if (codeA1 === codeB1) return 1;
  if (codeA2 === codeB2) return 0.5;
  return 0;
}

export { normalizeName, getPhoneticCode, sanctionsSimilarityScore };
