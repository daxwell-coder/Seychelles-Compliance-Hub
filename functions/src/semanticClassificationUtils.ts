// Shared semantic classification utilities
// Used by both semanticClassifier.ts and regulatoryClassifier.ts

import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

export interface SemanticRiskAssessmentResult {
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number; // 0-1 confidence score
  impacted: string[];
  criticalIndicators: number;
  highPriorityMatches: number;
  semanticMatches: SemanticMatch[];
  rationaleRefs: string[];
}

export interface SemanticMatch {
  obligationId: string;
  similarityScore: number;
  matchedPhrases: string[];
  contextWindow: string;
}

export interface ObligationProfile {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  semanticEmbeddings?: number[];
  rulePatterns: RegExp[];
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export async function loadObligationProfiles(): Promise<ObligationProfile[]> {
  const snap = await db.collection('obligations').get();
  const profiles: ObligationProfile[] = [];

  snap.docs.forEach(doc => {
    const data: any = doc.data();
    
    // Build rule patterns from keywords
    const keywords = extractKeywords(data.title || '', data.description || '');
    const rulePatterns = keywords.map(keyword => 
      new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    );

    profiles.push({
      id: doc.id,
      title: data.title || '',
      description: data.description || '',
      keywords,
      rulePatterns,
      criticality: determineCriticality(data, keywords),
      // TODO: Load pre-computed embeddings from storage
      semanticEmbeddings: data.embeddings || []
    });
  });

  return profiles;
}

export async function performSemanticClassification(
  content: string, 
  profiles: ObligationProfile[]
): Promise<SemanticRiskAssessmentResult> {
  
  // Rule-based classification (existing logic)
  const ruleBasedResult = performRuleBasedClassification(content, profiles);
  
  // Semantic similarity analysis
  const semanticMatches = await performSemanticAnalysis(content, profiles);
  
  // Combine results with confidence scoring
  const combinedResult = combineClassificationResults(ruleBasedResult, semanticMatches);
  
  return combinedResult;
}

function extractKeywords(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const words = text.split(/[^a-z0-9]+/).filter(word => 
    word.length >= 3 && !isStopWord(word)
  );
  
  // Extract important phrases and compound terms
  const phrases = extractPhrases(text);
  
  return Array.from(new Set([...words, ...phrases]));
}

function extractPhrases(text: string): string[] {
  // Extract important regulatory phrases
  const regulatoryPhrases = [
    'beneficial owner', 'money laundering', 'terrorist financing',
    'suspicious transaction', 'customer due diligence', 'enhanced due diligence',
    'politically exposed person', 'ultimate beneficial owner', 'source of funds',
    'know your customer', 'anti money laundering', 'compliance officer',
    'risk assessment', 'suspicious activity report', 'currency transaction report'
  ];

  return regulatoryPhrases.filter(phrase => text.includes(phrase));
}

function isStopWord(word: string): boolean {
  const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
  return stopWords.has(word);
}

function determineCriticality(data: any, keywords: string[]): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
  // Determine criticality based on obligation metadata and keywords
  const criticalKeywords = ['license', 'criminal', 'fine', 'penalty', 'revoke', 'suspend'];
  const highKeywords = ['report', 'filing', 'disclosure', 'register', 'notify'];
  
  const hasCritical = keywords.some(k => criticalKeywords.includes(k));
  const hasHigh = keywords.some(k => highKeywords.includes(k));
  
  if (hasCritical) return 'CRITICAL';
  if (hasHigh) return 'HIGH';
  if (data.priority === 'high' || data.regulatory_priority === 'critical') return 'HIGH';
  if (keywords.length >= 5) return 'MEDIUM';
  return 'LOW';
}

function performRuleBasedClassification(content: string, profiles: ObligationProfile[]) {
  const lower = content.toLowerCase();
  const impacted: string[] = [];
  const rationaleRefs: string[] = [];
  
  // Critical regulatory indicators
  const criticalKeywords = [
    'immediate', 'urgent', 'deadline', 'cease', 'suspend', 'revoke', 'penalty',
    'fine', 'enforcement', 'violation', 'breach', 'sanction', 'license',
    'criminal', 'prosecution', 'investigation', 'suspicious transaction',
    'money laundering', 'terrorist financing', 'compliance failure'
  ];
  
  let criticalIndicators = 0;
  let highPriorityMatches = 0;
  
  // Count critical indicators
  criticalKeywords.forEach(keyword => {
    if (lower.includes(keyword)) {
      criticalIndicators++;
      rationaleRefs.push(`CRITICAL:${keyword}`);
    }
  });
  
  // Match against obligation patterns
  profiles.forEach(profile => {
    let hits = 0;
    const matchedKeywords: string[] = [];
    
    profile.rulePatterns.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        hits += matches.length;
        matchedKeywords.push(profile.keywords[index] || 'unknown');
        rationaleRefs.push(`${profile.id}:${profile.keywords[index]}`);
      }
    });
    
    if (hits > 0) {
      impacted.push(profile.id);
      if (profile.criticality === 'HIGH' || profile.criticality === 'CRITICAL') {
        highPriorityMatches++;
      }
    }
  });
  
  return {
    impacted,
    criticalIndicators,
    highPriorityMatches,
    rationaleRefs
  };
}

async function performSemanticAnalysis(
  content: string, 
  profiles: ObligationProfile[]
): Promise<SemanticMatch[]> {
  
  const matches: SemanticMatch[] = [];
  
  // Extract key phrases from content
  const contentPhrases = extractContentPhrases(content);
  
  for (const profile of profiles) {
    // Simple semantic similarity based on phrase matching
    // In production, this would use proper embeddings/transformers
    const similarity = calculatePhraseSimilarity(contentPhrases, profile.keywords);
    
    if (similarity.score > 0.3) { // Threshold for semantic relevance
      matches.push({
        obligationId: profile.id,
        similarityScore: similarity.score,
        matchedPhrases: similarity.matches,
        contextWindow: extractContextWindow(content, similarity.matches[0])
      });
    }
  }
  
  // Sort by similarity score
  return matches.sort((a, b) => b.similarityScore - a.similarityScore);
}

function extractContentPhrases(content: string): string[] {
  // Extract meaningful phrases from content
  const sentences = content.split(/[.!?]+/);
  const phrases: string[] = [];
  
  sentences.forEach(sentence => {
    const words = sentence.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    // Extract n-grams (2-4 words)
    for (let i = 0; i <= words.length - 2; i++) {
      phrases.push(words.slice(i, i + 2).join(' '));
      if (i <= words.length - 3) {
        phrases.push(words.slice(i, i + 3).join(' '));
      }
    }
  });
  
  return Array.from(new Set(phrases));
}

function calculatePhraseSimilarity(contentPhrases: string[], obligationKeywords: string[]) {
  let totalScore = 0;
  const matches: string[] = [];
  
  obligationKeywords.forEach(keyword => {
    const bestMatch = contentPhrases.find(phrase => 
      phrase.includes(keyword) || keyword.includes(phrase)
    );
    
    if (bestMatch) {
      // Simple Jaccard similarity
      const keywordWords = new Set(keyword.split(/\s+/));
      const phraseWords = new Set(bestMatch.split(/\s+/));
      const intersection = new Set([...keywordWords].filter(x => phraseWords.has(x)));
      const union = new Set([...keywordWords, ...phraseWords]);
      
      const score = intersection.size / union.size;
      totalScore += score;
      matches.push(keyword);
    }
  });
  
  return {
    score: totalScore / obligationKeywords.length,
    matches: matches.slice(0, 5)
  };
}

function extractContextWindow(content: string, phrase: string, windowSize: number = 100): string {
  if (!phrase) return '';
  const index = content.toLowerCase().indexOf(phrase.toLowerCase());
  if (index === -1) return '';
  
  const start = Math.max(0, index - windowSize);
  const end = Math.min(content.length, index + phrase.length + windowSize);
  
  return content.substring(start, end).trim();
}

function combineClassificationResults(ruleBasedResult: any, semanticMatches: SemanticMatch[]): SemanticRiskAssessmentResult {
  const { impacted, criticalIndicators, highPriorityMatches, rationaleRefs } = ruleBasedResult;
  
  // Combine impacted obligations from both approaches
  const allImpacted = Array.from(new Set([
    ...impacted,
    ...semanticMatches.filter(m => m.similarityScore > 0.5).map(m => m.obligationId)
  ]));
  
  // Calculate confidence based on multiple factors
  let confidence = 0.0;
  
  // Rule-based confidence
  const ruleConfidence = Math.min(1.0, (impacted.length * 0.2) + (criticalIndicators * 0.3));
  
  // Semantic confidence (average of top 3 matches)
  const topSemanticScores = semanticMatches.slice(0, 3).map(m => m.similarityScore);
  const semanticConfidence = topSemanticScores.length > 0 
    ? topSemanticScores.reduce((sum, score) => sum + score, 0) / topSemanticScores.length
    : 0.0;
  
  // Weighted combination
  confidence = (ruleConfidence * 0.6) + (semanticConfidence * 0.4);
  
  // Determine impact level with confidence consideration
  let riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  
  if (criticalIndicators >= 2 || (criticalIndicators >= 1 && allImpacted.length >= 2)) {
    riskLevel = confidence >= 0.7 ? 'CRITICAL' : 'HIGH';
  } else if (allImpacted.length >= 3 || (criticalIndicators >= 1 && allImpacted.length >= 1)) {
    riskLevel = confidence >= 0.6 ? 'HIGH' : 'MEDIUM';
  } else if (allImpacted.length >= 2 || highPriorityMatches >= 2) {
    riskLevel = confidence >= 0.5 ? 'MEDIUM' : 'LOW';
  } else if (allImpacted.length >= 1 || highPriorityMatches >= 1) {
    riskLevel = confidence >= 0.6 ? 'MEDIUM' : 'LOW';
  }
  
  return {
    riskLevel,
    confidence,
    impacted: allImpacted,
    criticalIndicators,
    highPriorityMatches,
    semanticMatches,
    rationaleRefs
  };
}
