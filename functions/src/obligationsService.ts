import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';
import { emitEvent } from './events';

const db = getFirestore();
const OBLIGATION_COLLECTION = 'obligations';
const MATRIX_PATH = path.join(__dirname, '..', '..', 'docs', 'obligation_matrix.json');

interface ObligationMatrixDoc {
  version: number;
  jurisdiction: string;
  last_updated: string;
  obligations: any[];
}

// Loader endpoint: loads matrix file into Firestore, emitting events on new/updated obligations
export const loadObligations = onRequest(async (req, res) => {
  try {
    if (!fs.existsSync(MATRIX_PATH)) {
      res.status(500).json({ status: 'error', message: 'Matrix file missing' });
      return;
    }
    const raw = fs.readFileSync(MATRIX_PATH, 'utf-8');
    const parsed: ObligationMatrixDoc = JSON.parse(raw);
    const batch = db.batch();
    const colRef = db.collection(OBLIGATION_COLLECTION);
    for (const ob of parsed.obligations) {
      const docRef = colRef.doc(ob.id);
      const existing = await docRef.get();
      const existingData: any = existing.exists ? existing.data() : null;
      const newVersion = parsed.version;
      const toStore = { ...ob, version: newVersion, jurisdiction: parsed.jurisdiction, updatedAt: new Date() };
      batch.set(docRef, toStore, { merge: true });
      if (!existingData || existingData.version !== newVersion || existingData.status !== ob.status) {
        try {
          await emitEvent('obligation.schema.updated', {
            obligationId: ob.id,
            version: `v${newVersion}`,
            status: ob.status,
            appliesTo: ob.applies_to?.join(',') || null,
            frequency: ob.frequency || null,
            slaDays: ob.sla_days || null
          });
        } catch (e) {
          logger.error('obligation.event.emit.failed', { id: ob.id, e });
        }
      }
    }
    await batch.commit();
    res.json({ status: 'ok', loaded: parsed.obligations.length, version: parsed.version });
  } catch (e) {
    logger.error('obligations.load.error', { e });
    res.status(500).json({ status: 'error' });
  }
});

// Query endpoint: returns active obligations, optional filter by applies_to
export const listObligations = onRequest(async (req, res) => {
  try {
    const appliesTo = (req.query.applies_to as string) || null;
    let q: FirebaseFirestore.Query = db.collection(OBLIGATION_COLLECTION).where('status', '==', 'active');
    if (appliesTo) {
      q = db.collection(OBLIGATION_COLLECTION).where('status', '==', 'active').where('applies_to', 'array-contains', appliesTo);
    }
    const snap = await q.get();
    const results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ status: 'ok', count: results.length, obligations: results });
  } catch (e) {
    logger.error('obligations.list.error', { e });
    res.status(500).json({ status: 'error' });
  }
});
