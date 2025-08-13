import { onRequest } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import * as crypto from 'crypto';
import { emitEvent } from './events';

// Import semantic classification functions
import { 
  loadObligationProfiles, 
  performSemanticClassification
} from './semanticClassificationUtils';

const db = getFirestore();
const CHANGES_COLLECTION = 'regulatory_changes';
const IMPACTS_COLLECTION = 'regulatory_impacts';

interface IngestRequestBody { sourceUrl: string; jurisdiction: string; content: string; }

async function loadObligationKeywords(): Promise<Map<string, string[]>> {
  const snap = await db.collection('obligations').get();
  const map = new Map<string, string[]>();
  snap.docs.forEach(d => {
    const data: any = d.data();
    const base = (data.title || '').toLowerCase();
    const idParts = d.id.split('.');
    const tokens = Array.from(new Set([...base.split(/[^a-z0-9]+/).filter(Boolean), ...idParts]));
    map.set(d.id, tokens);
  });
  return map;
}

function classify(text: string, keywordMap: Map<string,string[]>) {
  const lower = text.toLowerCase();
  const impacted: string[] = [];
  const rationaleRefs: string[] = [];
  const unmatchedKeywords: string[] = [];
  
  // Critical indicators that suggest regulatory urgency
  const criticalKeywords = [
    'immediate', 'urgent', 'deadline', 'cease', 'suspend', 'revoke', 'penalty',
    'fine', 'enforcement', 'violation', 'breach', 'sanction', 'license',
    'criminal', 'prosecution', 'investigation', 'suspicious transaction',
    'money laundering', 'terrorist financing', 'compliance failure'
  ];
  
  // High-priority obligation areas
  const highPriorityAreas = [
    'beneficial owner', 'aml', 'kyc', 'suspicious', 'accounting', 'filing',
    'report', 'declaration', 'register', 'disclosure', 'notification'
  ];
  
  let criticalIndicators = 0;
  let highPriorityMatches = 0;
  
  // Analyze for critical and high-priority indicators
  criticalKeywords.forEach(keyword => {
    if (lower.includes(keyword)) {
      criticalIndicators++;
      rationaleRefs.push(`CRITICAL:${keyword}`);
    }
  });
  
  highPriorityAreas.forEach(area => {
    if (lower.includes(area)) {
      highPriorityMatches++;
    }
  });
  
  // Match against obligation keywords
  for (const [obId, words] of keywordMap.entries()) {
    let hits = 0;
    for (const w of words) {
      if (w.length < 3) continue;
      if (lower.includes(w)) { 
        hits++; 
        rationaleRefs.push(`${obId}:${w}`); 
      }
    }
    if (hits > 0) impacted.push(obId); 
    else unmatchedKeywords.push(obId);
  }
  
  // Enhanced impact level determination
  let impactLevel: string = 'LOW';
  
  // CRITICAL: Urgent regulatory actions or multiple critical indicators
  if (criticalIndicators >= 2 || (criticalIndicators >= 1 && impacted.length >= 2)) {
    impactLevel = 'CRITICAL';
  }
  // HIGH: Multiple obligations affected or single critical indicator
  else if (impacted.length >= 3 || (criticalIndicators >= 1 && impacted.length >= 1)) {
    impactLevel = 'HIGH';
  }
  // MEDIUM: Multiple obligations or high-priority area matches
  else if (impacted.length === 2 || (impacted.length === 1 && highPriorityMatches >= 2)) {
    impactLevel = 'MEDIUM';
  }
  // LOW: Single obligation affected
  else if (impacted.length === 1) {
    impactLevel = 'LOW';
  }
  
  // Additional heuristics for specific compliance areas
  if (/suspicious|aml|beneficial owner|accounting/i.test(text)) {
    if (impactLevel === 'LOW') impactLevel = 'MEDIUM';
  }
  
  return { 
    impacted, 
    rationaleRefs, 
    impactLevel, 
    unmatchedKeywords, 
    criticalIndicators,
    highPriorityMatches
  };
}

export const regulatoryClassifier = onRequest(async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ status: 'error', message: 'POST required' }); return; }
  const body: IngestRequestBody = req.body || {};
  if (!body.sourceUrl || !body.jurisdiction || !body.content) { res.status(400).json({ status: 'error', message: 'Missing fields' }); return; }
  const contentHash = crypto.createHash('sha256').update(body.content).digest('hex');
  const existing = await db.collection(CHANGES_COLLECTION).where('contentHash', '==', contentHash).limit(1).get();
  let changeId: string;
  if (!existing.empty) {
    changeId = existing.docs[0].id;
  } else {
    const doc = await db.collection(CHANGES_COLLECTION).add({
      sourceUrl: body.sourceUrl,
      jurisdiction: body.jurisdiction,
      contentHash,
      createdAt: new Date(),
      length: body.content.length
    });
    changeId = doc.id;
    await emitEvent('regulatory.change.ingested', { changeId, sourceUrl: body.sourceUrl, jurisdiction: body.jurisdiction, contentHash, extractedLength: body.content.length, truncated: false }, { producer: 'regulatory-classifier' });
  }

  const impactExisting = await db.collection(IMPACTS_COLLECTION).where('changeId', '==', changeId).limit(1).get();
  if (!impactExisting.empty) {
    const data = impactExisting.docs[0].data();
    res.json({ status: 'ok', changeId, impactId: impactExisting.docs[0].id, reused: true, impactLevel: data.impactLevel });
    return;
  }
  
  const start = Date.now();
  
  // Enhanced classification: Use semantic classifier if available, fallback to rule-based
  const enableSemantic = process.env.ENABLE_SEMANTIC_ANALYSIS === 'true';
  let result: any;
  let classifierVersion: string;
  
  if (enableSemantic) {
    try {
      // Use semantic classification approach
      const obligationProfiles = await loadObligationProfiles();
      result = await performSemanticClassification(body.content, obligationProfiles);
      classifierVersion = '2.0-semantic-hybrid';
    } catch (semanticError) {
      console.warn('Semantic classification failed, falling back to rule-based:', semanticError);
      // Fallback to rule-based classification
      const keywordMap = await loadObligationKeywords();
      result = classify(body.content, keywordMap);
      classifierVersion = 'kw-v1-fallback';
    }
  } else {
    // Use original rule-based classification
    const keywordMap = await loadObligationKeywords();
    result = classify(body.content, keywordMap);
    classifierVersion = 'kw-v1';
  }
  
  const impactDoc = await db.collection(IMPACTS_COLLECTION).add({
    changeId,
    impactedObligations: result.impacted,
    impactLevel: result.riskLevel || result.impactLevel,
    confidence: result.confidence || null,
    semanticMatches: result.semanticMatches || [],
    rationaleRefs: result.rationaleRefs,
    unmatchedKeywords: result.unmatchedKeywords || [],
    criticalIndicators: result.criticalIndicators || 0,
    highPriorityMatches: result.highPriorityMatches || 0,
    classifierVersion,
    createdAt: new Date()
  });
  const durationMs = Date.now() - start;
  await emitEvent('regulatory.impact.assessed', {
    changeId,
    impactLevel: result.riskLevel || result.impactLevel,
    confidence: result.confidence || null,
    impactedObligations: result.impacted,
    classifierVersion,
    rationaleRefs: result.rationaleRefs.slice(0,25),
    unmatchedKeywords: (result.unmatchedKeywords || []).slice(0,25),
    criticalIndicators: result.criticalIndicators || 0,
    highPriorityMatches: result.highPriorityMatches || 0,
    semanticMatchCount: (result.semanticMatches || []).length,
    durationMs
  }, { producer: 'regulatory-classifier', correlationId: changeId });
  
  // Emit classified event to trigger auto task creation
  await emitEvent('regulatory.impact.classified', {
    changeId,
    impactLevel: result.impactLevel,
    impactedObligations: result.impacted,
    sourceUrl: body.sourceUrl,
    jurisdiction: body.jurisdiction,
    criticalIndicators: result.criticalIndicators || 0,
    highPriorityMatches: result.highPriorityMatches || 0,
    classifierVersion
  }, { producer: 'regulatory-classifier', correlationId: changeId });
  
  // Enhanced auto-task creation with focus on CRITICAL impacts
  if (result.impactLevel === 'CRITICAL') {
    try {
      const taskId = `crit-${changeId}`;
      const urgencyHours = 4; // CRITICAL tasks need response within 4 hours
      const dueDate = new Date(Date.now() + urgencyHours * 60 * 60 * 1000);
      
      const taskTitle = `URGENT: Assess CRITICAL regulatory change ${changeId}`;
      const taskDescription = `Critical regulatory impact detected requiring immediate attention. Affected obligations: ${result.impacted.join(', ')}. Critical indicators: ${result.criticalIndicators}`;
      
      const taskDoc = { 
        taskId, 
        title: taskTitle,
        description: taskDescription,
        originType: 'REG_CHANGE', 
        originId: changeId, 
        impactLevel: result.impactLevel, 
        status: 'OPEN', 
        priority: 'CRITICAL',
        dueDate,
        slaHours: urgencyHours,
        affectedObligations: result.impacted,
        criticalIndicators: result.criticalIndicators,
        rationaleRefs: result.rationaleRefs.slice(0, 10),
        createdAt: new Date(), 
        updatedAt: new Date(),
        metadata: {
          sourceUrl: body.sourceUrl,
          jurisdiction: body.jurisdiction,
          contentHash,
          autoCreated: true,
          classifierVersion
        }
      };
      
      await db.collection('tasks').doc(taskId).set(taskDoc, { merge: true });
      
      await emitEvent('task.created', { 
        taskId, 
        title: taskTitle,
        description: taskDescription, 
        status: 'OPEN', 
        priority: 'CRITICAL',
        originType: 'REG_CHANGE', 
        originId: changeId, 
        impactLevel: result.impactLevel,
        dueDate: dueDate.toISOString(),
        slaHours: urgencyHours,
        affectedObligations: result.impacted,
        autoCreated: true
      }, { producer: 'task-engine', correlationId: changeId });
      
      // Additional escalation event for CRITICAL tasks
      await emitEvent('task.critical.created', {
        taskId,
        changeId,
        impactLevel: result.impactLevel,
        criticalIndicators: result.criticalIndicators,
        affectedObligations: result.impacted,
        dueDate: dueDate.toISOString()
      }, { producer: 'regulatory-classifier', correlationId: changeId });
      
    } catch (e) {
      console.error('Failed to create CRITICAL task:', e);
      // Log but don't fail the main response
    }
  }
  // For HIGH and MEDIUM impacts, create standard tasks (less urgent)
  else if (['HIGH', 'MEDIUM'].includes(result.impactLevel)) {
    try {
      const taskId = `std-${changeId}`;
      const slaHours = result.impactLevel === 'HIGH' ? 24 : 72; // HIGH: 1 day, MEDIUM: 3 days
      const dueDate = new Date(Date.now() + slaHours * 60 * 60 * 1000);
      
      const taskTitle = `Assess ${result.impactLevel.toLowerCase()} regulatory change ${changeId}`;
      const taskDescription = `${result.impactLevel} regulatory impact requiring review. Affected obligations: ${result.impacted.join(', ')}.`;
      
      const taskDoc = { 
        taskId, 
        title: taskTitle,
        description: taskDescription,
        originType: 'REG_CHANGE', 
        originId: changeId, 
        impactLevel: result.impactLevel, 
        status: 'OPEN',
        priority: result.impactLevel,
        dueDate,
        slaHours,
        affectedObligations: result.impacted,
        createdAt: new Date(), 
        updatedAt: new Date(),
        metadata: {
          sourceUrl: body.sourceUrl,
          jurisdiction: body.jurisdiction,
          autoCreated: true,
          classifierVersion
        }
      };
      
      await db.collection('tasks').doc(taskId).set(taskDoc, { merge: true });
      
      await emitEvent('task.created', { 
        taskId, 
        title: taskTitle, 
        status: 'OPEN', 
        priority: result.impactLevel,
        originType: 'REG_CHANGE', 
        originId: changeId, 
        impactLevel: result.impactLevel,
        dueDate: dueDate.toISOString(),
        slaHours,
        autoCreated: true
      }, { producer: 'task-engine', correlationId: changeId });
      
    } catch (e) {
      console.error(`Failed to create ${result.impactLevel} task:`, e);
      // Log but don't fail the main response
    }
  }
  res.json({ 
    status: 'ok', 
    changeId, 
    impactId: impactDoc.id, 
    impactLevel: result.impactLevel, 
    impacted: result.impacted, 
    criticalIndicators: result.criticalIndicators,
    highPriorityMatches: result.highPriorityMatches,
    durationMs,
    taskCreated: ['CRITICAL', 'HIGH', 'MEDIUM'].includes(result.impactLevel)
  });
});
