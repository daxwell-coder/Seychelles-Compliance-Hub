// Auto Task Creation Service
// Automatically creates compliance tasks from regulatory impact assessments

import { CloudEvent } from "firebase-functions/v2";
import { MessagePublishedData } from "firebase-functions/v2/pubsub";
import * as logger from "firebase-functions/logger";
import { getFirestore } from "firebase-admin/firestore";
import { randomUUID } from "crypto";
import { emitEvent } from "./events";

const db = getFirestore();

interface RegulatoryImpact {
  impactId: string;
  changeId: string;
  sourceUrl: string;
  jurisdiction: string;
  impactLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  affectedObligations: string[];
  summary: string;
  actionRequired: boolean;
  deadline?: string;
  createdAt: Date;
}

interface AutoTaskConfig {
  impactLevel: string;
  taskTitle: string;
  taskDescription: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  autoAssignTo?: string;
  slaHours: number;
  escalationHours?: number;
  requiresReview: boolean;
}

// Configuration for auto task creation based on impact levels
const TASK_CREATION_RULES: AutoTaskConfig[] = [
  {
    impactLevel: 'CRITICAL',
    taskTitle: '🚨 CRITICAL Regulatory Compliance Action Required',
    taskDescription: 'Immediate regulatory compliance action required due to critical regulatory change',
    priority: 'URGENT',
    autoAssignTo: 'compliance-team',
    slaHours: 4, // 4 hours for critical
    escalationHours: 2, // escalate after 2 hours
    requiresReview: true
  },
  {
    impactLevel: 'HIGH',
    taskTitle: '⚠️ HIGH Priority Regulatory Review Required',
    taskDescription: 'High-priority regulatory change requires review and potential action',
    priority: 'HIGH',
    autoAssignTo: 'compliance-team',
    slaHours: 24, // 24 hours for high
    escalationHours: 12, // escalate after 12 hours
    requiresReview: true
  },
  {
    impactLevel: 'MEDIUM',
    taskTitle: '📋 Regulatory Change Review',
    taskDescription: 'Medium-priority regulatory change requires assessment',
    priority: 'MEDIUM',
    slaHours: 72, // 72 hours for medium
    requiresReview: false
  },
  {
    impactLevel: 'LOW',
    taskTitle: '📝 Regulatory Update Notification',
    taskDescription: 'Low-priority regulatory change for information only',
    priority: 'LOW',
    slaHours: 168, // 7 days for low priority
    requiresReview: false
  }
];

/**
 * Cloud Function to automatically create tasks from regulatory impact assessments
 * Triggered by regulatory.impact.classified events
 */
export const autoTaskCreator = async (event: CloudEvent<MessagePublishedData>) => {
  logger.info('🤖 Auto Task Creator triggered', { messageId: event.id });
  
  try {
    const message = event.data?.message;
    if (!message) {
      logger.warn('No message data in event');
      return;
    }

    // Decode the pub/sub message
    const data = JSON.parse(Buffer.from(message.data, 'base64').toString());
    logger.info('Processing impact event', { eventType: data.eventType, impactId: data.impactId });

    // Only process regulatory impact classified events
    if (data.eventType !== 'regulatory.impact.classified') {
      logger.info('Ignoring non-impact event', { eventType: data.eventType });
      return;
    }

    // Get the regulatory impact details
    const impact = await getRegulatoryImpact(data.impactId);
    if (!impact) {
      logger.error('Impact not found', { impactId: data.impactId });
      return;
    }

    // Check if we should create tasks for this impact level
    const taskConfig = getTaskConfig(impact.impactLevel);
    if (!taskConfig) {
      logger.info('No task creation rule for impact level', { impactLevel: impact.impactLevel });
      return;
    }

    // Check if task already exists for this impact
    const existingTask = await checkExistingTask(impact.impactId);
    if (existingTask) {
      logger.info('Task already exists for this impact', { 
        impactId: impact.impactId, 
        taskId: existingTask 
      });
      return;
    }

    // Create the automated compliance task
    const task = await createComplianceTask(impact, taskConfig);
    logger.info('✅ Auto task created successfully', { 
      taskId: task.taskId, 
      impactLevel: impact.impactLevel,
      priority: taskConfig.priority
    });

    // Emit task creation event
    await emitEvent('task.auto_created', {
      taskId: task.taskId,
      impactId: impact.impactId,
      impactLevel: impact.impactLevel,
      priority: taskConfig.priority,
      slaHours: taskConfig.slaHours,
      autoAssigned: !!taskConfig.autoAssignTo
    }, {
      producer: 'auto-task-creator',
      correlationId: impact.impactId
    });

    // Set up SLA monitoring if configured
    if (taskConfig.slaHours > 0) {
      await setupSLAMonitoring(task.taskId, taskConfig);
    }

    // Set up escalation if configured  
    if (taskConfig.escalationHours) {
      await setupEscalation(task.taskId, taskConfig);
    }

  } catch (error) {
    logger.error('❌ Auto task creation failed', { error: (error as Error).message });
    await emitEvent('task.auto_creation.failed', {
      error: (error as Error).message,
      messageId: event.id
    }, {
      producer: 'auto-task-creator'
    });
  }
};

/**
 * Get regulatory impact from Firestore
 */
async function getRegulatoryImpact(impactId: string): Promise<RegulatoryImpact | null> {
  try {
    const impactDoc = await db.collection('regulatory_impacts').doc(impactId).get();
    if (!impactDoc.exists) {
      return null;
    }
    
    return {
      impactId,
      ...impactDoc.data() as any
    };
  } catch (error) {
    logger.error('Failed to get regulatory impact', { impactId, error });
    return null;
  }
}

/**
 * Get task creation configuration for impact level
 */
function getTaskConfig(impactLevel: string): AutoTaskConfig | null {
  return TASK_CREATION_RULES.find(rule => rule.impactLevel === impactLevel) || null;
}

/**
 * Check if task already exists for this impact
 */
async function checkExistingTask(impactId: string): Promise<string | null> {
  try {
    const existingTasks = await db
      .collection('tasks')
      .where('originType', '==', 'regulatory_impact')
      .where('originId', '==', impactId)
      .limit(1)
      .get();

    if (!existingTasks.empty) {
      return existingTasks.docs[0].data().taskId;
    }
    
    return null;
  } catch (error) {
    logger.error('Failed to check existing tasks', { impactId, error });
    return null;
  }
}

/**
 * Create compliance task in Firestore
 */
async function createComplianceTask(impact: RegulatoryImpact, config: AutoTaskConfig) {
  const taskId = randomUUID();
  const now = new Date();
  const slaDeadline = new Date(now.getTime() + (config.slaHours * 60 * 60 * 1000));

  const task = {
    taskId,
    title: config.taskTitle,
    description: createTaskDescription(impact, config),
    status: 'OPEN',
    priority: config.priority,
    originType: 'regulatory_impact',
    originId: impact.impactId,
    impactLevel: impact.impactLevel,
    owner: config.autoAssignTo || null,
    createdAt: now,
    updatedAt: now,
    slaDeadline,
    slaHours: config.slaHours,
    escalationHours: config.escalationHours,
    requiresReview: config.requiresReview,
    autoCreated: true,
    // Regulatory context
    sourceUrl: impact.sourceUrl,
    jurisdiction: impact.jurisdiction,
    affectedObligations: impact.affectedObligations,
    regulatoryDeadline: impact.deadline || null,
    actionRequired: impact.actionRequired
  };

  await db.collection('tasks').doc(taskId).set(task);

  // Also store in auto_tasks collection for tracking
  await db.collection('auto_tasks').doc(taskId).set({
    taskId,
    impactId: impact.impactId,
    createdAt: now,
    config: config,
    status: 'ACTIVE'
  });

  return task;
}

/**
 * Create detailed task description
 */
function createTaskDescription(impact: RegulatoryImpact, config: AutoTaskConfig): string {
  const obligations = impact.affectedObligations.length > 0 
    ? `\n\nAffected Obligations: ${impact.affectedObligations.join(', ')}`
    : '';

  const deadline = impact.deadline 
    ? `\n\nRegulatory Deadline: ${impact.deadline}`
    : '';

  const actionNote = impact.actionRequired 
    ? '\n\n⚠️ IMMEDIATE ACTION REQUIRED'
    : '\n\n📋 Review and assess impact required';

  return `${config.taskDescription}

**Impact Summary:**
${impact.summary}

**Source:** ${impact.sourceUrl}
**Jurisdiction:** ${impact.jurisdiction}
**Impact Level:** ${impact.impactLevel}${obligations}${deadline}${actionNote}

**SLA:** Complete within ${config.slaHours} hours
${config.escalationHours ? `**Escalation:** Auto-escalate after ${config.escalationHours} hours` : ''}
${config.requiresReview ? '**Review Required:** Yes - compliance team review mandatory' : ''}

This task was automatically created by the regulatory monitoring system.`;
}

/**
 * Set up SLA monitoring for the task
 */
async function setupSLAMonitoring(taskId: string, config: AutoTaskConfig): Promise<void> {
  try {
    const slaDoc = {
      taskId,
      slaHours: config.slaHours,
      deadline: new Date(Date.now() + (config.slaHours * 60 * 60 * 1000)),
      status: 'ACTIVE',
      createdAt: new Date()
    };

    await db.collection('task_sla_monitoring').doc(taskId).set(slaDoc);
    
    logger.info('SLA monitoring set up', { taskId, slaHours: config.slaHours });
  } catch (error) {
    logger.error('Failed to set up SLA monitoring', { taskId, error });
  }
}

/**
 * Set up escalation for the task
 */
async function setupEscalation(taskId: string, config: AutoTaskConfig): Promise<void> {
  try {
    if (!config.escalationHours) return;

    const escalationDoc = {
      taskId,
      escalationHours: config.escalationHours,
      escalationTime: new Date(Date.now() + (config.escalationHours * 60 * 60 * 1000)),
      status: 'PENDING',
      createdAt: new Date()
    };

    await db.collection('task_escalations').doc(taskId).set(escalationDoc);
    
    logger.info('Task escalation scheduled', { taskId, escalationHours: config.escalationHours });
  } catch (error) {
    logger.error('Failed to set up escalation', { taskId, error });
  }
}

/**
 * HTTP endpoint for manual task creation testing
 */
export const createTaskManually = async (req: any, res: any) => {
  try {
    const { impactId } = req.body;
    
    if (!impactId) {
      res.status(400).json({ error: 'impactId required' });
      return;
    }

    const impact = await getRegulatoryImpact(impactId);
    if (!impact) {
      res.status(404).json({ error: 'Impact not found' });
      return;
    }

    const config = getTaskConfig(impact.impactLevel);
    if (!config) {
      res.status(400).json({ error: 'No task configuration for impact level' });
      return;
    }

    const task = await createComplianceTask(impact, config);
    
    res.json({ 
      success: true, 
      taskId: task.taskId,
      impactLevel: impact.impactLevel,
      priority: config.priority
    });

  } catch (error) {
    logger.error('Manual task creation failed', error);
    res.status(500).json({ error: 'Task creation failed' });
  }
};
