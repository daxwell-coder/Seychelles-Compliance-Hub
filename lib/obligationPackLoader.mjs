// Obligation Pack Loader for schv1
// Loads and validates obligation pack manifests, prevents duplicates, and tracks versions

import fs from 'fs';
import path from 'path';

const PACKS_DIR = path.join(process.cwd(), 'data', 'schemas', 'packs');
const PACK_VERSIONS_FILE = path.join(PACKS_DIR, 'pack_versions.json');

function ensureDir() {
  if (!fs.existsSync(PACKS_DIR)) fs.mkdirSync(PACKS_DIR, { recursive: true });
}

function loadPackManifest(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function savePackVersion(pack) {
  let versions = {};
  if (fs.existsSync(PACK_VERSIONS_FILE)) {
    versions = JSON.parse(fs.readFileSync(PACK_VERSIONS_FILE, 'utf-8'));
  }
  versions[pack.id] = pack.version;
  fs.writeFileSync(PACK_VERSIONS_FILE, JSON.stringify(versions, null, 2));
}

function installObligationPack(manifestPath) {
  ensureDir();
  const pack = loadPackManifest(manifestPath);
  // Check for duplicate obligation IDs
  const ids = new Set();
  for (const ob of pack.obligations) {
    if (ids.has(ob.id)) throw new Error(`Duplicate obligation ID: ${ob.id}`);
    ids.add(ob.id);
  }
  // Save manifest to packs dir
  const dest = path.join(PACKS_DIR, `${pack.id}_v${pack.version}.json`);
  fs.copyFileSync(manifestPath, dest);
  savePackVersion(pack);
  return { status: 'installed', id: pack.id, version: pack.version };
}

export { installObligationPack };
