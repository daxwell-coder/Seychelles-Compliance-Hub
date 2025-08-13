import { onRequest } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';
import { emitEvent } from './events';
import { validateTransition } from './workflow';

const db = getFirestore();
const TASKS_COLLECTION = 'tasks';


export const taskHandler = onRequest(async (req, res) => {
  const method = req.method;
  if (method === 'POST') {
    const { title, originType, originId, impactLevel, owner, correlationId } = req.body || {};
    if (!title || !originType) { res.status(400).json({ status: 'error', message: 'title & originType required' }); return; }
    const taskId = randomUUID();
    const doc = { taskId, title, originType, originId: originId || null, impactLevel: impactLevel || null, owner: owner || null, status: 'OPEN', createdAt: new Date(), updatedAt: new Date() };
    await db.collection(TASKS_COLLECTION).doc(taskId).set(doc);
    await emitEvent('task.created', { taskId, title, status: 'OPEN', originType, originId: originId || null, impactLevel: impactLevel || null, owner: owner || null, correlationId: correlationId || null }, { producer: 'task-engine', correlationId: correlationId || taskId });
    res.json({ status: 'ok', taskId });
    return;
  }
  if (method === 'PATCH') {
    const { taskId, toStatus, owner } = req.body || {};
    if (!taskId || !toStatus) { res.status(400).json({ status: 'error', message: 'taskId & toStatus required' }); return; }
    const ref = db.collection(TASKS_COLLECTION).doc(taskId);
    const snap = await ref.get();
    if (!snap.exists) { res.status(404).json({ status: 'error', message: 'not found' }); return; }
    const data: any = snap.data();
    if (!validateTransition(data.status, toStatus)) { res.status(400).json({ status: 'error', message: 'invalid transition' }); return; }
    await ref.update({ status: toStatus, owner: owner || data.owner, updatedAt: new Date() });
    await emitEvent('task.status.changed', { taskId, fromStatus: data.status, toStatus, owner: owner || data.owner }, { producer: 'task-engine', correlationId: taskId });
  res.json({ status: 'ok', taskId, newStatus: toStatus });
    return;
  }
  res.status(405).json({ status: 'error', message: 'Unsupported method' });
});

export const escalateTask = onRequest(async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ status: 'error' }); return; }
  const { taskId, escalationLevel, reason, owner } = req.body || {};
  if (!taskId || !escalationLevel || !reason) { res.status(400).json({ status: 'error', message: 'taskId, escalationLevel, reason required' }); return; }
  const ref = db.collection(TASKS_COLLECTION).doc(taskId);
  const snap = await ref.get();
  if (!snap.exists) { res.status(404).json({ status: 'error', message: 'not found' }); return; }
  const data: any = snap.data();
  if (data.status === 'CLOSED') { res.status(400).json({ status: 'error', message: 'already closed' }); return; }
  await ref.update({ status: 'ESCALATED', updatedAt: new Date(), owner: owner || data.owner });
  await emitEvent('task.escalated', { taskId, escalationLevel, reason, owner: owner || data.owner }, { producer: 'task-engine', correlationId: taskId });
  res.json({ status: 'ok', taskId, newStatus: 'ESCALATED' });
});

export const closeTask = onRequest(async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ status: 'error' }); return; }
  const { taskId, resolution, owner } = req.body || {};
  if (!taskId || !resolution) { res.status(400).json({ status: 'error', message: 'taskId & resolution required' }); return; }
  const ref = db.collection(TASKS_COLLECTION).doc(taskId);
  const snap = await ref.get();
  if (!snap.exists) { res.status(404).json({ status: 'error', message: 'not found' }); return; }
  const data: any = snap.data();
  await ref.update({ status: 'CLOSED', resolution, updatedAt: new Date(), owner: owner || data.owner });
  await emitEvent('task.closed', { taskId, resolution, owner: owner || data.owner }, { producer: 'task-engine', correlationId: taskId });
  res.json({ status: 'ok', taskId, newStatus: 'CLOSED' });
});

export { validateTransition };
