
// Test for impact classifier and task workflow
import { classifyRegulatoryImpact } from '../lib/impactClassifier.js';
import { createTask, validateTransition, escalateTask, closeTask } from '../lib/taskWorkflow.js';
import { emitEvent } from '../lib/emitter.js';

// Test: classify regulatory text
const testText = 'New AML and beneficial ownership requirements for all IBCs.';
const impact = classifyRegulatoryImpact(testText);
console.log('Impact:', impact);

// Test: create task from impact
const task = createTask('impact_assessment', 'corr-123');
console.log('Task created:', task);

// Test: valid status transition
console.log('Transition OPEN -> IN_PROGRESS:', validateTransition('OPEN', 'IN_PROGRESS'));

// Test: escalate task
try {
  const escalated = escalateTask(task, 'CRITICAL', 'High risk detected');
  console.log('Escalated:', escalated);
} catch (e) {
  console.error('Escalation error:', e.message);
}

// Test: close task
const closed = closeTask(task, 'user-1');
console.log('Closed:', closed);

// Test: emit event
const event = emitEvent('regulatory.impact.assessed', impact, { producer: 'test' });
console.log('Event:', event);
