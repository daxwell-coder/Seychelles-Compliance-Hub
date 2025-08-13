// Minimal rule-based impact classifier for regulatory changes
// Returns impacted obligation IDs, impact level, and rationale reference

const OBLIGATION_KEYWORDS = {
  'beneficial ownership': 'BO-001',
  'aml': 'AML-001',
  'transaction monitoring': 'TM-001',
  'sanctions': 'SAN-001',
  'customer due diligence': 'CDD-001'
};

function classifyRegulatoryImpact(text) {
  const impacted = [];
  let impactLevel = 'LOW';
  let rationale = [];

  for (const [keyword, id] of Object.entries(OBLIGATION_KEYWORDS)) {
    if (text.toLowerCase().includes(keyword)) {
      impacted.push(id);
      rationale.push(keyword);
      if (keyword === 'aml' || keyword === 'sanctions') impactLevel = 'CRITICAL';
      else if (keyword === 'transaction monitoring') impactLevel = 'HIGH';
      else if (keyword === 'customer due diligence') impactLevel = 'MEDIUM';
    }
  }

  return {
    impacted_obligation_ids: impacted,
    impact_level: impactLevel,
    rationale_ref: rationale.join(', ')
  };
}

module.exports = { classifyRegulatoryImpact };
