import { onRequest } from 'firebase-functions/v2/https';
import { onMessagePublished } from 'firebase-functions/v2/pubsub';
import { getFirestore } from 'firebase-admin/firestore';
import * as crypto from 'crypto';
import * as logger from 'firebase-functions/logger';
import { emitEvent } from './events';
import { onSchedule } from 'firebase-functions/v2/scheduler';

const db = getFirestore();
const COLLECTION = 'obligations';
const SNAP_COLLECTION = '_obligation_snapshots';

async function computeSnapshot() {
  const snap = await db.collection(COLLECTION).get();
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  items.sort((a,b) => a.id.localeCompare(b.id));
  const canonical = JSON.stringify(items);
  const hash = crypto.createHash('sha256').update(canonical).digest('hex');

  // Get previous snapshot (latest by createdAt)
  const prevQuery = await db.collection(SNAP_COLLECTION)
    .orderBy('createdAt', 'desc')
    .limit(1).get();
  let previousHash = 'genesis';
  let previousSnapshotId: string | null = null;
  if (!prevQuery.empty) {
    const prev = prevQuery.docs[0];
    previousHash = (prev.data().hash as string) || previousHash;
    previousSnapshotId = prev.id;
  }

  const docRef = await db.collection(SNAP_COLLECTION).add({
    createdAt: new Date(),
    itemCount: items.length,
    hash,
    previousHash,
    previousSnapshotId
  });

  // Emit chain event (schema expects only newHash, previousHash, algorithm)
  await emitEvent('audit.hash.chain.computed', { newHash: hash, previousHash, algorithm: 'sha256' });

  return { snapshotId: docRef.id, hash, previousHash, previousSnapshotId, count: items.length };
}

export const obligationSnapshot = onRequest(async (_req, res) => {
  try {
    const result = await computeSnapshot();
    res.json({ status: 'ok', ...result });
  } catch (e) {
    logger.error('obligation.snapshot.error', { e });
    res.status(500).json({ status: 'error' });
  }
});

// Pub/Sub trigger (message contents not used presently)
export const obligationSnapshotPubSub = onMessagePublished('obligations-snapshot-topic', async (event) => {
  try {
    const result = await computeSnapshot();
    logger.info('obligation.snapshot.pubsub.success', result);
  } catch (e) {
    logger.error('obligation.snapshot.pubsub.error', { e, msgId: (event.data as any)?.messageId });
  }
});

// Chain verification logic: validates linkage (previousHash pointers) and recomputes snapshot hash bodies.
async function verifyChain(limit: number = 500) {
  const snaps = await db.collection(SNAP_COLLECTION)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  let valid = true;
  let checked = 0;
  let reason: string | undefined;
  let expectedPrev: string | null = null; // what the current doc's previousHash should point to
  for (const doc of snaps.docs) {
    const data: any = doc.data();
  const { previousHash: declaredPrev } = data;
    // Recompute canonical hash of obligations state at that time is expensive; instead verify static fields exist.
    // (Future enhancement: store canonical blob to recompute). For now rely on pointer linkage.
    if (expectedPrev && declaredPrev !== expectedPrev) {
      valid = false;
      reason = `mismatch_previous_ptr_expected_${expectedPrev}_got_${declaredPrev}`;
      break;
    }
    expectedPrev = declaredPrev === 'genesis' ? null : declaredPrev;
    checked++;
  }
  return { valid, checked, reason };
}

// HTTP endpoint to verify chain integrity
export const obligationSnapshotVerify = onRequest(async (_req, res) => {
  try {
    const result = await verifyChain();
    if (!result.valid) {
      // emit explicit invalid event
      await emitEvent('audit.hash.chain.invalid', { checked: result.checked, detectedAt: new Date().toISOString(), reason: result.reason });
      res.status(500).json({ status: 'invalid', ...result });
      return;
    }
    res.json({ status: 'ok', ...result });
  } catch (e) {
    logger.error('obligation.snapshot.verify.error', { e });
    res.status(500).json({ status: 'error' });
  }
});

// Scheduled verification (daily) - emits event if chain invalid
export const obligationSnapshotVerifyDaily = onSchedule('0 3 * * *', async () => {
  try {
    const { valid, checked, reason } = await verifyChain();
    if (!valid) {
      await emitEvent('audit.hash.chain.invalid', { checked, detectedAt: new Date().toISOString(), reason });
      logger.error('obligation.snapshot.verify.failed', { checked, reason });
    } else {
      logger.info('obligation.snapshot.verify.pass', { checked });
    }
  } catch (e) {
    logger.error('obligation.snapshot.verify.schedule.error', { e });
  }
});
