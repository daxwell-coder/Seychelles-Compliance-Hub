// Task SLA Monitoring and Escalation Service
// Monitors task deadlines and handles automated escalations

import { CloudEvent } from "firebase-functions/v2";
import { MessagePublishedData } from "firebase-functions/v2/pubsub";
import * as logger from "firebase-functions/logger";
import { getFirestore } from "firebase-admin/firestore";
import { emitEvent } from "./events";

const db = getFirestore();

interface TaskSLA {
  taskId: string;
  slaHours: number;
  deadline: Date;
  status: 'ACTIVE' | 'BREACHED' | 'COMPLETED';
  createdAt: Date;
  breachedAt?: Date;
  warningsSent?: number;
}

interface TaskEscalation {
  taskId: string;
  escalationHours: number;
  escalationTime: Date;
  status: 'PENDING' | 'ESCALATED' | 'COMPLETED';
  createdAt: Date;
  escalatedAt?: Date;
}

/**
 * Scheduled function to monitor task SLAs and escalations
 * Runs every 15 minutes to check for approaching deadlines and breaches
 */
export const taskSLAMonitor = async (_event: CloudEvent<MessagePublishedData>) => {
  logger.info('⏰ Task SLA Monitor running');
  
  try {
    const now = new Date();
    
    // Check for SLA breaches and warnings
    await checkSLABreaches(now);
    await checkSLAWarnings(now);
    
    // Check for escalations
    await checkEscalations(now);
    
    // Generate SLA metrics
    await generateSLAMetrics(now);
    
    logger.info('✅ Task SLA monitoring completed');
    
  } catch (error) {
    logger.error('❌ Task SLA monitoring failed', { error: (error as Error).message });
    
    await emitEvent('task.sla_monitoring.error', {
      error: (error as Error).message,
      timestamp: new Date()
    }, {
      producer: 'task-sla-monitor'
    });
  }
};

/**
 * Check for SLA breaches
 */
async function checkSLABreaches(now: Date): Promise<void> {
  try {
    // Get all active SLAs that are past deadline
    const breachedSLAs = await db
      .collection('task_sla_monitoring')
      .where('status', '==', 'ACTIVE')
      .where('deadline', '<=', now)
      .get();

    if (breachedSLAs.empty) {
      logger.info('No SLA breaches found');
      return;
    }

    logger.warn(`Found ${breachedSLAs.size} SLA breaches`);

    for (const slaDoc of breachedSLAs.docs) {
      const sla = slaDoc.data() as TaskSLA;
      await processSLABreach(sla);
    }

  } catch (error) {
    logger.error('Failed to check SLA breaches', { error });
  }
}

/**
 * Check for SLA warnings (approaching deadlines)
 */
async function checkSLAWarnings(now: Date): Promise<void> {
  try {
    // Check for tasks approaching deadline (within 25% of SLA time)
    const warningTime = new Date(now.getTime() + (60 * 60 * 1000)); // 1 hour ahead
    
    const approachingSLAs = await db
      .collection('task_sla_monitoring')
      .where('status', '==', 'ACTIVE')
      .where('deadline', '>', now)
      .where('deadline', '<=', warningTime)
      .get();

    if (approachingSLAs.empty) {
      return;
    }

    logger.info(`Found ${approachingSLAs.size} tasks approaching SLA deadline`);

    for (const slaDoc of approachingSLAs.docs) {
      const sla = slaDoc.data() as TaskSLA;
      await sendSLAWarning(sla);
    }

  } catch (error) {
    logger.error('Failed to check SLA warnings', { error });
  }
}

/**
 * Check for pending escalations
 */
async function checkEscalations(now: Date): Promise<void> {
  try {
    const pendingEscalations = await db
      .collection('task_escalations')
      .where('status', '==', 'PENDING')
      .where('escalationTime', '<=', now)
      .get();

    if (pendingEscalations.empty) {
      logger.info('No pending escalations');
      return;
    }

    logger.info(`Found ${pendingEscalations.size} tasks ready for escalation`);

    for (const escalationDoc of pendingEscalations.docs) {
      const escalation = escalationDoc.data() as TaskEscalation;
      await processEscalation(escalation);
    }

  } catch (error) {
    logger.error('Failed to check escalations', { error });
  }
}

/**
 * Process an SLA breach
 */
async function processSLABreach(sla: TaskSLA): Promise<void> {
  try {
    const now = new Date();
    
    // Update SLA status to breached
    await db.collection('task_sla_monitoring').doc(sla.taskId).update({
      status: 'BREACHED',
      breachedAt: now
    });

    // Get the task details
    const taskDoc = await db.collection('tasks').doc(sla.taskId).get();
    if (!taskDoc.exists) {
      logger.error('Task not found for SLA breach', { taskId: sla.taskId });
      return;
    }

    const task = taskDoc.data() as any;

    // Emit SLA breach event
    await emitEvent('task.sla.breached', {
      taskId: sla.taskId,
      title: task.title,
      owner: task.owner,
      priority: task.priority,
      impactLevel: task.impactLevel,
      slaHours: sla.slaHours,
      breachedAt: now,
      breachDuration: now.getTime() - sla.deadline.getTime()
    }, {
      producer: 'task-sla-monitor',
      correlationId: sla.taskId
    });

    // Send breach notification
    await sendSLABreachNotification(task, sla, now);

    logger.warn('SLA breach processed', { 
      taskId: sla.taskId, 
      title: task.title,
      deadline: sla.deadline,
      breachedAt: now
    });

  } catch (error) {
    logger.error('Failed to process SLA breach', { taskId: sla.taskId, error });
  }
}

/**
 * Send SLA warning notification
 */
async function sendSLAWarning(sla: TaskSLA): Promise<void> {
  try {
    // Check if we've already sent warning
    if (sla.warningsSent && sla.warningsSent > 0) {
      return; // Already warned
    }

    const taskDoc = await db.collection('tasks').doc(sla.taskId).get();
    if (!taskDoc.exists) {
      return;
    }

    const task = taskDoc.data() as any;
    
    // Update warnings sent count
    await db.collection('task_sla_monitoring').doc(sla.taskId).update({
      warningsSent: (sla.warningsSent || 0) + 1
    });

    // Emit warning event
    await emitEvent('task.sla.warning', {
      taskId: sla.taskId,
      title: task.title,
      owner: task.owner,
      priority: task.priority,
      deadline: sla.deadline,
      timeRemaining: sla.deadline.getTime() - Date.now()
    }, {
      producer: 'task-sla-monitor',
      correlationId: sla.taskId
    });

    logger.info('SLA warning sent', { taskId: sla.taskId, deadline: sla.deadline });

  } catch (error) {
    logger.error('Failed to send SLA warning', { taskId: sla.taskId, error });
  }
}

/**
 * Process task escalation
 */
async function processEscalation(escalation: TaskEscalation): Promise<void> {
  try {
    const now = new Date();

    // Get the task details
    const taskDoc = await db.collection('tasks').doc(escalation.taskId).get();
    if (!taskDoc.exists) {
      logger.error('Task not found for escalation', { taskId: escalation.taskId });
      return;
    }

    const task = taskDoc.data() as any;

    // Skip if task is already completed
    if (task.status === 'CLOSED' || task.status === 'COMPLETED') {
      await db.collection('task_escalations').doc(escalation.taskId).update({
        status: 'COMPLETED'
      });
      return;
    }

    // Update escalation status
    await db.collection('task_escalations').doc(escalation.taskId).update({
      status: 'ESCALATED',
      escalatedAt: now
    });

    // Update task status to escalated if still open
    if (task.status === 'OPEN') {
      await db.collection('tasks').doc(escalation.taskId).update({
        status: 'ESCALATED',
        escalatedAt: now,
        updatedAt: now
      });
    }

    // Emit escalation event
    await emitEvent('task.escalated', {
      taskId: escalation.taskId,
      title: task.title,
      owner: task.owner,
      priority: task.priority,
      impactLevel: task.impactLevel,
      originalOwner: task.owner,
      escalatedAt: now,
      escalationReason: 'SLA_TIMEOUT'
    }, {
      producer: 'task-sla-monitor',
      correlationId: escalation.taskId
    });

    // Send escalation notification
    await sendEscalationNotification(task, escalation, now);

    logger.info('Task escalated', { 
      taskId: escalation.taskId, 
      title: task.title,
      escalatedAt: now
    });

  } catch (error) {
    logger.error('Failed to process escalation', { taskId: escalation.taskId, error });
  }
}

/**
 * Send SLA breach notification
 */
async function sendSLABreachNotification(task: any, sla: TaskSLA, breachedAt: Date): Promise<void> {
  logger.info('📧 SLA Breach Notification', {
    taskId: task.taskId,
    title: task.title,
    owner: task.owner,
    priority: task.priority,
    deadline: sla.deadline,
    breachedAt: breachedAt,
    // In production, integrate with email/SMS service
    notification: {
      type: 'SLA_BREACH',
      subject: `🚨 SLA BREACH: ${task.title}`,
      message: `Task "${task.title}" has breached its SLA deadline. 
      
Task ID: ${task.taskId}
Priority: ${task.priority}
Owner: ${task.owner}
Deadline: ${sla.deadline.toLocaleString()}
Breached At: ${breachedAt.toLocaleString()}

Please take immediate action to resolve this compliance task.`
    }
  });
}

/**
 * Send escalation notification
 */
async function sendEscalationNotification(task: any, escalation: TaskEscalation, escalatedAt: Date): Promise<void> {
  logger.info('📧 Task Escalation Notification', {
    taskId: task.taskId,
    title: task.title,
    owner: task.owner,
    priority: task.priority,
    escalatedAt: escalatedAt,
    // In production, integrate with email/SMS service
    notification: {
      type: 'TASK_ESCALATION',
      subject: `⬆️ TASK ESCALATED: ${task.title}`,
      message: `Task "${task.title}" has been escalated due to timeout.

Task ID: ${task.taskId}
Priority: ${task.priority}
Original Owner: ${task.owner}
Escalated At: ${escalatedAt.toLocaleString()}

This task requires immediate management attention.`
    }
  });
}

/**
 * Generate SLA metrics for monitoring dashboard
 */
async function generateSLAMetrics(now: Date): Promise<void> {
  try {
    // Get SLA statistics
    const [activeSLAs, breachedSLAs, completedSLAs] = await Promise.all([
      db.collection('task_sla_monitoring').where('status', '==', 'ACTIVE').get(),
      db.collection('task_sla_monitoring').where('status', '==', 'BREACHED').get(),
      db.collection('task_sla_monitoring').where('status', '==', 'COMPLETED').get()
    ]);

    const metrics = {
      timestamp: now,
      activeTasks: activeSLAs.size,
      breachedTasks: breachedSLAs.size,
      completedTasks: completedSLAs.size,
      totalTasks: activeSLAs.size + breachedSLAs.size + completedSLAs.size,
      breachRate: completedSLAs.size > 0 
        ? Math.round((breachedSLAs.size / (breachedSLAs.size + completedSLAs.size)) * 100)
        : 0,
      // Task breakdown by priority
      tasksByPriority: await getTasksByPriority(),
      // SLA performance
      averageCompletionTime: await getAverageCompletionTime()
    };

    // Store metrics
    await db.collection('sla_metrics').add(metrics);

    // Emit metrics event
    await emitEvent('task.sla.metrics_generated', metrics, {
      producer: 'task-sla-monitor'
    });

    logger.info('SLA metrics generated', metrics);

  } catch (error) {
    logger.error('Failed to generate SLA metrics', { error });
  }
}

/**
 * Get task counts by priority
 */
async function getTasksByPriority(): Promise<any> {
  try {
    const [urgent, high, medium, low] = await Promise.all([
      db.collection('tasks').where('priority', '==', 'URGENT').where('status', 'in', ['OPEN', 'IN_PROGRESS', 'ESCALATED']).get(),
      db.collection('tasks').where('priority', '==', 'HIGH').where('status', 'in', ['OPEN', 'IN_PROGRESS', 'ESCALATED']).get(),
      db.collection('tasks').where('priority', '==', 'MEDIUM').where('status', 'in', ['OPEN', 'IN_PROGRESS', 'ESCALATED']).get(),
      db.collection('tasks').where('priority', '==', 'LOW').where('status', 'in', ['OPEN', 'IN_PROGRESS', 'ESCALATED']).get()
    ]);

    return {
      URGENT: urgent.size,
      HIGH: high.size,
      MEDIUM: medium.size,
      LOW: low.size
    };
  } catch (error) {
    logger.error('Failed to get tasks by priority', { error });
    return { URGENT: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  }
}

/**
 * Calculate average completion time for completed tasks
 */
async function getAverageCompletionTime(): Promise<number> {
  try {
    const completedTasks = await db
      .collection('tasks')
      .where('status', '==', 'CLOSED')
      .orderBy('updatedAt', 'desc')
      .limit(100)
      .get();

    if (completedTasks.empty) {
      return 0;
    }

    let totalTime = 0;
    let count = 0;

    completedTasks.docs.forEach(doc => {
      const task = doc.data();
      if (task.createdAt && task.updatedAt) {
        const completionTime = task.updatedAt.toDate().getTime() - task.createdAt.toDate().getTime();
        totalTime += completionTime;
        count++;
      }
    });

    return count > 0 ? Math.round(totalTime / count / (60 * 60 * 1000)) : 0; // Return hours
  } catch (error) {
    logger.error('Failed to calculate average completion time', { error });
    return 0;
  }
}

/**
 * HTTP endpoint to manually trigger SLA monitoring
 */
export const triggerSLAMonitoring = async (req: any, res: any) => {
  try {
    const now = new Date();
    
    await checkSLABreaches(now);
    await checkSLAWarnings(now);
    await checkEscalations(now);
    await generateSLAMetrics(now);
    
    res.json({ 
      success: true, 
      message: 'SLA monitoring completed',
      timestamp: now
    });

  } catch (error) {
    logger.error('Manual SLA monitoring failed', error);
    res.status(500).json({ 
      error: 'SLA monitoring failed',
      message: (error as Error).message
    });
  }
};
