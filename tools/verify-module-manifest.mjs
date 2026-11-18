// Offline integrity verifier for a manifest produced by build-module-manifest.mjs.
// Usage: node tools/verify-module-manifest.mjs <source-directory> <manifest.json>
// Does not contact Cloudflare, GitHub, or any production service.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const [rootArg, manifestArg] = process.argv.slice(2);
if (process.argv.length !== 4 || !rootArg || !manifestArg) throw Error('Usage: node tools/verify-module-manifest.mjs <source-directory> <manifest.json>');
const expected = JSON.parse(readFileSync(manifestArg, 'utf8'));
if (expected.schemaVersion !== 1 || expected.workerName !== 'candidatory-miniapp-api' || !Array.isArray(expected.modules) || !expected.modules.length) throw Error('Invalid manifest metadata');
const names = new Set();
let previousName = null;
for (const m of expected.modules) {
  if (typeof m.name !== 'string' || !/^[a-zA-Z0-9_./-]+$/.test(m.name) || m.name.startsWith('/') || m.name.split('/').some(part => part === '..' || part === '.' || part === '') || names.has(m.name) || (previousName !== null && previousName.localeCompare(m.name, 'en') >= 0) || !Number.isSafeInteger(m.bytes) || m.bytes < 0 || !/^[a-f0-9]{64}$/.test(m.sha256)) throw Error('Invalid module entry');
  names.add(m.name);
  previousName = m.name;
}
const canonical = JSON.stringify(expected.modules);
const digest = createHash('sha256').update(canonical).digest('hex');
if (digest !== expected.manifestSha256) throw Error('Manifest digest mismatch');
const script = resolve('tools/build-module-manifest.mjs');
const run = spawnSync(process.execPath, [script, rootArg], {encoding:'utf8', maxBuffer:10*1024*1024});
if (run.status !== 0) throw Error('Cannot regenerate manifest: '+(run.stderr || run.error?.message || 'unknown error'));
const actual = JSON.parse(run.stdout);
if (JSON.stringify(actual.modules) !== canonical || actual.manifestSha256 !== expected.manifestSha256) throw Error('Source bundle does not match manifest');
console.log('Verified '+actual.modules.length+' modules against SHA-256 manifest');
