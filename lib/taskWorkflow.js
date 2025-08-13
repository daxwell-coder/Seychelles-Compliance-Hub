// Task workflow service for schv1 compliance platform
// Provides task creation, status transitions, escalation, and closure

const { v4: uuidv4 } = require('uuid');

const TASK_STATUSES = ['OPEN', 'IN_PROGRESS', 'REVIEW', 'CLOSED', 'ESCALATED'];

function createTask(origin, correlation_id) {
  return {
    task_id: uuidv4(),
    status: 'OPEN',
    origin,
    correlation_id
  };
}

function validateTransition(prev, next) {
  const allowed = {
    OPEN: ['IN_PROGRESS', 'ESCALATED', 'CLOSED'],
    IN_PROGRESS: ['REVIEW', 'CLOSED'],
    REVIEW: ['CLOSED'],
    ESCALATED: ['IN_PROGRESS'],
    CLOSED: []
  };
  return allowed[prev] && allowed[prev].includes(next);
}

function escalateTask(task, level, reason) {
  if (!reason) throw new Error('Escalation reason required');
  return {
    ...task,
    status: 'ESCALATED',
    escalation_level: level,
    escalation_reason: reason
  };
}

function closeTask(task, closed_by) {
  return {
    ...task,
    status: 'CLOSED',
    closed_by,
    closed_at: new Date().toISOString()
  };
}

module.exports = { createTask, validateTransition, escalateTask, closeTask, TASK_STATUSES };
