// STR Narrative Scoring Service
// Evaluates quality of STR narratives against regulatory rubric
// Part of Phase 2: STR Co-Pilot implementation

import { onRequest } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { getFirestore } from "firebase-admin/firestore";
import { emitEvent } from "./events";

const db = getFirestore();

// Narrative Quality Rubric (based on FIU requirements)
interface NarrativeRubric {
  clarity: number;           // 0-5: Language clarity and readability
  completeness: number;      // 0-5: All required elements present
  specificity: number;       // 0-5: Concrete details vs vague statements
  timeline: number;         // 0-5: Clear chronological sequence
  redFlags: number;         // 0-5: Identification of suspicious indicators
  compliance: number;       // 0-5: Adherence to regulatory format
}

interface ScoringResult {
  overall_score: number;     // 0-5 weighted average
  rubric_scores: NarrativeRubric;
  confidence: number;        // 0-1 algorithm confidence
  recommendations: string[];
  quality_tier: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
  requires_review: boolean;
}

// Scoring weights based on regulatory importance
const RUBRIC_WEIGHTS = {
  clarity: 0.15,
  completeness: 0.25,
  specificity: 0.20,
  timeline: 0.15,
  redFlags: 0.15,
  compliance: 0.10
};

// Quality thresholds
const QUALITY_THRESHOLDS = {
  EXCELLENT: 4.5,
  GOOD: 3.5,
  FAIR: 2.5,
  POOR: 0
};

/**
 * HTTP endpoint for scoring narrative text
 */
export const scoreNarrative = onRequest(
  { 
    cors: true,
    timeoutSeconds: 30,
    memory: "256MiB"
  },
  async (request, response) => {
    try {
      if (request.method !== 'POST') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
      }

      const { narrative, case_id, scoring_context } = request.body;
      
      if (!narrative || typeof narrative !== 'string') {
        response.status(400).json({ error: 'Missing or invalid narrative text' });
        return;
      }

      logger.info('Scoring narrative', { 
        case_id, 
        narrative_length: narrative.length,
        context: scoring_context 
      });

      // Perform narrative scoring
      const result = await performNarrativeScoring(narrative, scoring_context);
      
      // Store result if case_id provided
      if (case_id) {
        await storeNarrativeScore(case_id, result, narrative);
        
        // Emit scoring event
        await emitEvent('narrative.scored', {
          case_id,
          overall_score: result.overall_score,
          quality_tier: result.quality_tier,
          requires_review: result.requires_review,
          scored_at: new Date().toISOString()
        });
      }

      response.json({
        success: true,
        scoring_result: result
      });

    } catch (error) {
      logger.error('Narrative scoring failed', error);
      response.status(500).json({ 
        error: 'Scoring failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Automatic scoring trigger when STR draft is created
 */
export const autoScoreSTRDraft = onDocumentCreated(
  "str_cases/{caseId}/drafts/{draftId}",
  async (event) => {
    try {
      const snapshot = event.data;
      if (!snapshot) {
        logger.warn('No data in STR draft creation event');
        return;
      }

      const draftData = snapshot.data();
      const caseId = event.params.caseId;
      const draftId = event.params.draftId;

      if (draftData.narrative && draftData.narrative.length > 50) {
        logger.info('Auto-scoring STR draft narrative', { 
          case_id: caseId, 
          draft_id: draftId 
        });

        const result = await performNarrativeScoring(
          draftData.narrative, 
          { type: 'STR_DRAFT', case_id: caseId }
        );

        // Update draft with scoring results
        await snapshot.ref.update({
          scoring_result: result,
          scored_at: new Date(),
          auto_scored: true
        });

        // Emit event for downstream processing
        await emitEvent('str.draft.auto_scored', {
          case_id: caseId,
          draft_id: draftId,
          overall_score: result.overall_score,
          quality_tier: result.quality_tier,
          requires_review: result.requires_review
        });

        logger.info('STR draft auto-scored successfully', {
          case_id: caseId,
          score: result.overall_score,
          tier: result.quality_tier
        });
      }

    } catch (error) {
      logger.error('Auto STR scoring failed', error);
    }
  }
);

/**
 * Core narrative scoring algorithm
 */
async function performNarrativeScoring(
  narrative: string, 
  context?: any
): Promise<ScoringResult> {
  
  // Normalize text for analysis
  const text = narrative.toLowerCase().trim();
  const wordCount = text.split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Initialize rubric scores
  const rubric: NarrativeRubric = {
    clarity: scoreClarity(text, sentences),
    completeness: scoreCompleteness(text, context),
    specificity: scoreSpecificity(text, wordCount),
    timeline: scoreTimeline(text),
    redFlags: scoreRedFlags(text),
    compliance: scoreCompliance(text, context)
  };

  // Calculate weighted overall score
  const overall_score = (
    rubric.clarity * RUBRIC_WEIGHTS.clarity +
    rubric.completeness * RUBRIC_WEIGHTS.completeness +
    rubric.specificity * RUBRIC_WEIGHTS.specificity +
    rubric.timeline * RUBRIC_WEIGHTS.timeline +
    rubric.redFlags * RUBRIC_WEIGHTS.redFlags +
    rubric.compliance * RUBRIC_WEIGHTS.compliance
  );

  // Determine quality tier
  let quality_tier: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT' = 'POOR';
  if (overall_score >= QUALITY_THRESHOLDS.EXCELLENT) quality_tier = 'EXCELLENT';
  else if (overall_score >= QUALITY_THRESHOLDS.GOOD) quality_tier = 'GOOD';
  else if (overall_score >= QUALITY_THRESHOLDS.FAIR) quality_tier = 'FAIR';

  // Generate recommendations
  const recommendations = generateRecommendations(rubric, overall_score);

  // Calculate confidence based on text length and completeness
  const confidence = Math.min(1.0, (wordCount / 100) * (rubric.completeness / 5));

  return {
    overall_score: Math.round(overall_score * 10) / 10,
    rubric_scores: rubric,
    confidence: Math.round(confidence * 100) / 100,
    recommendations,
    quality_tier,
    requires_review: overall_score < 3.0 || quality_tier === 'POOR'
  };
}

/**
 * Score narrative clarity (0-5)
 */
function scoreClarity(text: string, sentences: string[]): number {
  let score = 5.0;
  
  // Penalize very long sentences (hard to read)
  const avgSentenceLength = text.length / sentences.length;
  if (avgSentenceLength > 150) score -= 1.0;
  if (avgSentenceLength > 200) score -= 1.0;
  
  // Check for complex jargon overuse
  const jargonWords = ['aforementioned', 'heretofore', 'pursuant', 'notwithstanding'];
  const jargonCount = jargonWords.reduce((count, word) => 
    count + (text.match(new RegExp(word, 'gi')) || []).length, 0
  );
  if (jargonCount > 5) score -= 0.5;
  
  // Reward clear structure indicators
  if (text.includes('first') || text.includes('initially')) score += 0.2;
  if (text.includes('then') || text.includes('subsequently')) score += 0.2;
  if (text.includes('finally') || text.includes('concluded')) score += 0.2;
  
  return Math.max(0, Math.min(5, score));
}

/**
 * Score narrative completeness (0-5)
 */
function scoreCompleteness(text: string, _context?: any): number {
  let score = 0;
  
  // Essential elements for STR narrative
  const requiredElements = [
    { pattern: /(suspect|individual|client|person)/i, points: 1.0 },
    { pattern: /(transaction|transfer|payment|amount)/i, points: 1.0 },
    { pattern: /(date|time|when|on)/i, points: 0.5 },
    { pattern: /(suspicious|unusual|irregular|concern)/i, points: 1.0 },
    { pattern: /(account|bank|financial)/i, points: 0.5 },
    { pattern: /(reason|because|due to|explanation)/i, points: 1.0 }
  ];
  
  requiredElements.forEach(element => {
    if (element.pattern.test(text)) {
      score += element.points;
    }
  });
  
  return Math.min(5, score);
}

/**
 * Score narrative specificity (0-5)
 */
function scoreSpecificity(text: string, wordCount: number): number {
  let score = 0;
  
  // Base score from length (more detail generally better)
  if (wordCount > 50) score += 1.0;
  if (wordCount > 100) score += 1.0;
  if (wordCount > 200) score += 0.5;
  
  // Look for specific details
  if (/\$[\d,]+|\d+\.\d+|SCR[\d,]+/i.test(text)) score += 1.0; // Amounts
  if (/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/i.test(text)) score += 0.5; // Dates
  if (/\d{2}:\d{2}|\d{1,2}:\d{2}(am|pm)/i.test(text)) score += 0.3; // Times
  
  // Penalize vague language
  const vagueWords = ['something', 'somehow', 'various', 'multiple', 'several'];
  const vagueCount = vagueWords.reduce((count, word) => 
    count + (text.match(new RegExp(word, 'gi')) || []).length, 0
  );
  score -= vagueCount * 0.2;
  
  return Math.max(0, Math.min(5, score));
}

/**
 * Score timeline clarity (0-5)
 */
function scoreTimeline(text: string): number {
  let score = 0;
  
  // Timeline indicators
  const timelineIndicators = [
    /initially|first|began|started/i,
    /then|next|subsequently|after|following/i,
    /finally|concluded|ended|ultimately/i,
    /during|while|throughout/i
  ];
  
  timelineIndicators.forEach(pattern => {
    if (pattern.test(text)) score += 1.0;
  });
  
  // Date/time references
  if (/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/i.test(text)) score += 0.5;
  
  return Math.min(5, score);
}

/**
 * Score red flag identification (0-5)
 */
function scoreRedFlags(text: string): number {
  let score = 0;
  
  // Common STR red flag indicators
  const redFlagKeywords = [
    /cash.{0,20}(intensive|heavy|large)/i,
    /structur\w+.{0,20}transaction/i,
    /(unusual|irregular).{0,20}pattern/i,
    /round.{0,10}number/i,
    /just.{0,10}below.{0,20}threshold/i,
    /(reluctant|refused).{0,20}information/i,
    /inconsistent.{0,20}(explanation|information)/i,
    /(high.{0,10}risk|sanctioned).{0,20}(country|jurisdiction)/i
  ];
  
  redFlagKeywords.forEach(pattern => {
    if (pattern.test(text)) score += 0.8;
  });
  
  return Math.min(5, score);
}

/**
 * Score regulatory compliance (0-5)
 */
function scoreCompliance(text: string, _context?: any): number {
  let score = 3.0; // Start with baseline compliance
  
  // Professional tone indicators
  if (/pursuant|accordance|regulation|compliance/i.test(text)) score += 0.5;
  
  // Avoid subjective language
  const subjectiveWords = ['probably', 'maybe', 'seems like', 'might be'];
  const subjectiveCount = subjectiveWords.reduce((count, word) => 
    count + (text.match(new RegExp(word, 'gi')) || []).length, 0
  );
  score -= subjectiveCount * 0.3;
  
  // Factual presentation
  if (text.includes('observed') || text.includes('identified')) score += 0.3;
  
  return Math.max(0, Math.min(5, score));
}

/**
 * Generate improvement recommendations
 */
function generateRecommendations(rubric: NarrativeRubric, overallScore: number): string[] {
  const recommendations: string[] = [];
  
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
  
  if (rubric.compliance < 3.0) {
    recommendations.push("Use more formal, objective language appropriate for regulatory reporting");
  }
  
  if (overallScore < 2.5) {
    recommendations.push("Consider significant revision - narrative needs substantial improvement before submission");
  }
  
  return recommendations;
}

/**
 * Store narrative scoring result
 */
async function storeNarrativeScore(
  caseId: string, 
  result: ScoringResult, 
  narrative: string
): Promise<void> {
  const scoreDoc = {
    case_id: caseId,
    narrative_hash: hashNarrative(narrative),
    scoring_result: result,
    scored_at: new Date(),
    narrative_length: narrative.length
  };

  await db.collection('narrative_scores').add(scoreDoc);
}

/**
 * Simple hash function for narrative deduplication
 */
function hashNarrative(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}
