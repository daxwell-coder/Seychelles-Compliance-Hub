// Test for Obligation Pack Loader
import { installObligationPack } from '../lib/obligationPackLoader.mjs';
import path from 'path';

const manifestPath = path.join(process.cwd(), 'data', 'schemas', 'obligation_pack_sample.json');

try {
  const result = installObligationPack(manifestPath);
  console.log('Obligation pack install result:', result);
} catch (e) {
  console.error('Obligation pack install error:', e.message);
}
