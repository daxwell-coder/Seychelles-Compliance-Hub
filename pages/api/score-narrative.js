// API route for narrative scoring
// Connects frontend to deployed Google Cloud Function

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { narrative, case_id, scoring_context } = req.body;

    if (!narrative || typeof narrative !== 'string') {
      return res.status(400).json({ error: 'Invalid narrative provided' });
    }

    // Try to call the deployed Cloud Function
    const cloudFunctionUrl = process.env.NARRATIVE_SCORING_URL || 
      'https://us-central1-seychelles-compliance-hub.cloudfunctions.net/scoreNarrative';

    try {
      const response = await fetch(cloudFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          narrative,
          case_id,
          scoring_context
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return res.status(200).json(result);
      } else {
        console.warn('Cloud function not available, using fallback scoring');
      }
    } catch (cloudError) {
      console.warn('Cloud function error:', cloudError.message);
    }

    // Fallback to local scoring logic for development
    const fallbackResult = performLocalScoring(narrative, scoring_context);
    return res.status(200).json({
      success: true,
      scoring_result: fallbackResult,
      fallback: true
    });

  } catch (error) {
    console.error('Narrative scoring API error:', error);
    return res.status(500).json({ 
      error: 'Scoring failed',
      message: error.message 
    });
  }
}

// Fallback scoring logic for development
function performLocalScoring(narrative, _context) {
  const text = narrative.toLowerCase().trim();
  const wordCount = text.split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Basic scoring algorithm
  let clarity = 5.0;
  const avgSentenceLength = text.length / sentences.length;
  if (avgSentenceLength > 150) clarity -= 1.0;
  if (avgSentenceLength > 200) clarity -= 1.0;
  
  let completeness = 0;
  const requiredElements = [
    /(suspect|individual|client|person)/i,
    /(transaction|transfer|payment|amount)/i,
    /(date|time|when|on)/i,
    /(suspicious|unusual|irregular|concern)/i,
    /(account|bank|financial)/i,
    /(reason|because|due to|explanation)/i
  ];
  
  requiredElements.forEach(pattern => {
    if (pattern.test(text)) completeness += 0.8;
  });
  
  let specificity = 0;
  if (wordCount > 50) specificity += 1.0;
  if (wordCount > 100) specificity += 1.0;
  if (/\$[\d,]+|\d+\.\d+|SCR[\d,]+/i.test(text)) specificity += 1.0;
  if (/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/i.test(text)) specificity += 0.5;
  
  let timeline = 0;
  const timelineIndicators = [
    /initially|first|began|started/i,
    /then|next|subsequently|after|following/i,
    /finally|concluded|ended|ultimately/i
  ];
  timelineIndicators.forEach(pattern => {
    if (pattern.test(text)) timeline += 1.0;
  });
  
  let redFlags = 0;
  const redFlagKeywords = [
    /cash.{0,20}(intensive|heavy|large)/i,
    /structur\w+.{0,20}transaction/i,
    /(unusual|irregular).{0,20}pattern/i,
    /round.{0,10}number/i
  ];
  redFlagKeywords.forEach(pattern => {
    if (pattern.test(text)) redFlags += 0.8;
  });
  
  let compliance = 3.0;
  if (/pursuant|accordance|regulation|compliance/i.test(text)) compliance += 0.5;
  
  const rubric = {
    clarity: Math.max(0, Math.min(5, clarity)),
    completeness: Math.max(0, Math.min(5, completeness)),
    specificity: Math.max(0, Math.min(5, specificity)),
    timeline: Math.max(0, Math.min(5, timeline)),
    redFlags: Math.max(0, Math.min(5, redFlags)),
    compliance: Math.max(0, Math.min(5, compliance))
  };
  
  const weights = {
    clarity: 0.15,
    completeness: 0.25,
    specificity: 0.20,
    timeline: 0.15,
    redFlags: 0.15,
    compliance: 0.10
  };
  
  const overall_score = Object.entries(rubric).reduce((sum, [key, score]) => {
    return sum + (score * weights[key]);
  }, 0);
  
  let quality_tier = 'POOR';
  if (overall_score >= 4.5) quality_tier = 'EXCELLENT';
  else if (overall_score >= 3.5) quality_tier = 'GOOD';
  else if (overall_score >= 2.5) quality_tier = 'FAIR';
  
  const recommendations = [];
  if (rubric.clarity < 3.0) {
    recommendations.push("Consider shorter, clearer sentences to improve readability");
  }
  if (rubric.completeness < 3.0) {
    recommendations.push("Include more details about the suspicious activity, parties involved, and timeline");
  }
  if (rubric.specificity < 3.0) {
    recommendations.push("Add specific amounts, dates, and account details where available");
  }
  if (rubric.timeline < 2.0) {
    recommendations.push("Provide a clearer chronological sequence of events");
  }
  if (rubric.redFlags < 2.0) {
    recommendations.push("Explicitly identify and explain the suspicious indicators observed");
  }
  
  if (recommendations.length === 0) {
    recommendations.push("Narrative meets quality standards");
  }
  
  return {
    overall_score: Math.round(overall_score * 10) / 10,
    rubric_scores: rubric,
    confidence: Math.min(1.0, (wordCount / 100) * (rubric.completeness / 5)),
    recommendations,
    quality_tier,
    requires_review: overall_score < 3.0
  };
}
