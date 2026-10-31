import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const baseline = read('./worker.js');
const manifest = JSON.parse(read('./environment-manifest.json'));
if (createHash('sha256').update(baseline).digest('hex') !== manifest.production.sha256) {
  throw Error('Reconstruct the pinned production snapshot before building');
}
const start = baseline.indexOf(' if(action==="saveCandidateProfile"){');
const end = baseline.indexOf(' if(action==="updateCandidateChecklist"){', start);
if (start < 0 || end < start) throw Error('Missing profile action boundary');
const source = baseline.slice(0, start) + read('./phase3/profile-save.block.js') + baseline.slice(end);
mkdirSync(new URL('./dist/', import.meta.url), { recursive: true });
writeFileSync(new URL('./dist/integration-worker.mjs', import.meta.url), source);
console.log('Integration candidate SHA-256:', createHash('sha256').update(source).digest('hex'));
