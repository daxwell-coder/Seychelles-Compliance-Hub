import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore } from 'firebase-admin/firestore';
import { emitEvent } from './events';

const db = getFirestore();
const TASKS_COLLECTION = 'tasks';

/**
 * Critical Task Monitor
 * Scheduled function that monitors CRITICAL tasks for SLA violations
 * and triggers automatic escalations
 */
export const monitorCriticalTasks = onSchedule('*/15 * * * *', async (_event) => {
  const now = new Date();
  console.log(`Critical task monitor running at ${now.toISOString()}`);
  
  try {
    // Query for overdue CRITICAL tasks
    const overdueQuery = await db.collection(TASKS_COLLECTION)
      .where('priority', '==', 'CRITICAL')
      .where('status', 'in', ['OPEN', 'IN_PROGRESS'])
      .where('dueDate', '<', now)
      .get();
    
    const escalatedTasks = [];
    
    for (const doc of overdueQuery.docs) {
      const task = doc.data();
      const taskId = task.taskId;
      
      // Check if already escalated recently (avoid duplicate escalations)
      const lastEscalationCheck = task.lastEscalationCheck || new Date(0);
      const hoursSinceLastCheck = (now.getTime() - lastEscalationCheck.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastCheck < 1) {
        console.log(`Skipping recent escalation check for task ${taskId}`);
        continue;
      }
      
      const hoursOverdue = (now.getTime() - task.dueDate.toDate().getTime()) / (1000 * 60 * 60);
      
      try {
        // Update task with escalation marker
        await doc.ref.update({
          status: 'ESCALATED',
          escalatedAt: now,
          hoursOverdue: Math.round(hoursOverdue * 10) / 10,
          lastEscalationCheck: now,
          updatedAt: now
        });
        
        // Emit escalation events
        await emitEvent('task.sla.violated', {
          taskId,
          impactLevel: task.impactLevel,
          priority: task.priority,
          hoursOverdue: Math.round(hoursOverdue * 10) / 10,
          slaHours: task.slaHours,
          originType: task.originType,
          originId: task.originId,
          affectedObligations: task.affectedObligations || []
        }, { producer: 'critical-task-monitor', correlationId: taskId });
        
        await emitEvent('task.escalated', {
          taskId,
          escalationLevel: 'SLA_VIOLATION',
          reason: `CRITICAL task overdue by ${Math.round(hoursOverdue * 10) / 10} hours`,
          autoEscalated: true,
          hoursOverdue: Math.round(hoursOverdue * 10) / 10
        }, { producer: 'critical-task-monitor', correlationId: taskId });
        
        escalatedTasks.push({
          taskId,
          title: task.title,
          hoursOverdue: Math.round(hoursOverdue * 10) / 10,
          affectedObligations: task.affectedObligations || []
        });
        
        console.log(`Escalated overdue CRITICAL task ${taskId} (${Math.round(hoursOverdue * 10) / 10}h overdue)`);
        
      } catch (error) {
        console.error(`Failed to escalate task ${taskId}:`, error);
        
        await emitEvent('task.escalation.failed', {
          taskId,
          error: error instanceof Error ? error.message : String(error),
          hoursOverdue: Math.round(hoursOverdue * 10) / 10
        }, { producer: 'critical-task-monitor', correlationId: taskId });
      }
    }
    
    // Emit summary event
    await emitEvent('critical.task.monitor.completed', {
      totalOverdueTasks: overdueQuery.size,
      escalatedTasks: escalatedTasks.length,
      escalatedTaskIds: escalatedTasks.map(t => t.taskId),
      runTime: now.toISOString()
    }, { producer: 'critical-task-monitor' });
    
    console.log(`Critical task monitor completed: ${escalatedTasks.length}/${overdueQuery.size} tasks escalated`);
    
  } catch (error) {
    console.error('Critical task monitor failed:', error);
    
    await emitEvent('critical.task.monitor.failed', {
      error: error instanceof Error ? error.message : String(error),
      runTime: now.toISOString()
    }, { producer: 'critical-task-monitor' });
  }
});

/**
 * Get Critical Task Summary
 * HTTP endpoint to retrieve current status of critical tasks
 */
export const getCriticalTaskSummary = onSchedule('0 */4 * * *', async (_event) => {
  try {
    const now = new Date();
    
    // Get all CRITICAL tasks
    const criticalTasks = await db.collection(TASKS_COLLECTION)
      .where('priority', '==', 'CRITICAL')
      .get();
    
    const summary = {
      total: criticalTasks.size,
      open: 0,
      inProgress: 0,
      escalated: 0,
      closed: 0,
      overdue: 0,
      avgHoursToClose: 0,
      oldestOpenTask: null as any
    };
    
    let totalCloseTime = 0;
    let closedCount = 0;
    let oldestOpenDate = null;
    
    for (const doc of criticalTasks.docs) {
      const task = doc.data();
      const status = task.status;
      
      summary[status.toLowerCase() as keyof typeof summary]++;
      
      if (task.dueDate && task.dueDate.toDate() < now && !['CLOSED'].includes(status)) {
        summary.overdue++;
      }
      
      if (status === 'CLOSED' && task.createdAt && task.updatedAt) {
        const timeToClose = task.updatedAt.toDate().getTime() - task.createdAt.toDate().getTime();
        totalCloseTime += timeToClose;
        closedCount++;
      }
      
      if (['OPEN', 'IN_PROGRESS', 'ESCALATED'].includes(status)) {
        if (!oldestOpenDate || task.createdAt.toDate() < oldestOpenDate) {
          oldestOpenDate = task.createdAt.toDate();
          summary.oldestOpenTask = {
            taskId: task.taskId,
            title: task.title,
            createdAt: task.createdAt.toDate().toISOString(),
            hoursOpen: Math.round((now.getTime() - task.createdAt.toDate().getTime()) / (1000 * 60 * 60) * 10) / 10
          };
        }
      }
    }
    
    if (closedCount > 0) {
      summary.avgHoursToClose = Math.round((totalCloseTime / closedCount) / (1000 * 60 * 60) * 10) / 10;
    }
    
    // Emit summary event
    await emitEvent('critical.task.summary', summary, { producer: 'critical-task-monitor' });
    
    console.log('Critical task summary:', summary);
    
  } catch (error) {
    console.error('Failed to generate critical task summary:', error);
  }
});
