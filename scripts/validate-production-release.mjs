#!/usr/bin/env node
// Offline, fail-closed production release manifest validator. No network, credentials or deployment.
import { readFileSync, existsSync, realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, relative, isAbsolute } from 'node:path';

const [manifestPath] = process.argv.slice(2);
if (!manifestPath) { console.error('Usage: node scripts/validate-production-release.mjs <manifest.json>'); process.exit(2); }
const fail = [];
const requireTrue = (condition, message) => { if (!condition) fail.push(message); };
let m;
try { m = JSON.parse(readFileSync(manifestPath, 'utf8')); }
catch (e) { console.error('Manifest unavailable or invalid JSON:', e.message); process.exit(2); }
requireTrue(m.worker === 'candidatory-miniapp-api', 'Only the existing production worker is permitted');
requireTrue(m.environment === 'production', 'Environment must be production');
requireTrue(m.deployTarget === 'existing-only', 'Deployment target must be existing-only');
requireTrue(Array.isArray(m.modules) && m.modules.length > 1, 'Complete multipart module inventory required');
const names = new Set();
const rootReal = realpathSync(process.cwd());
const insideRoot = (path) => { try { const rel = relative(rootReal, realpathSync(path)); return rel === '' || (rel !== '..' && !rel.startsWith('../') && !isAbsolute(rel)); } catch { return false; } };
for (const mod of (Array.isArray(m.modules) ? m.modules : [])) {
  if (!mod || typeof mod !== 'object' || Array.isArray(mod)) { fail.push('Invalid module entry'); continue; }
  requireTrue(typeof mod.name === 'string' && !names.has(mod.name), 'Duplicate or missing module name');
  names.add(mod.name);
  const file = typeof mod?.path === 'string' ? mod.path : '';
  const root = resolve(process.cwd());
  const abs = typeof file === 'string' ? resolve(root, file) : '';
  requireTrue(!!file && !isAbsolute(file) && insideRoot(abs) && existsSync(abs), 'Missing or unsafe module path: ' + file);
  requireTrue(/^sha256:[a-f0-9]{64}$/.test(mod.sha256 || ''), 'Invalid SHA-256: ' + mod.name);
  if (file && existsSync(abs) && insideRoot(abs)) {
    const hash = 'sha256:' + createHash('sha256').update(readFileSync(abs)).digest('hex');
    requireTrue(hash === mod.sha256, 'Hash mismatch: ' + mod.name);
  }
}
const expected = {DB:'d1',REVIEW_DB:'d1',AI:'ai',ADMIN_TELEGRAM_IDS:'secret_text',ADMIN_TELEGRAM_IDS_MAHDI:'secret_text',AVALAI_API_KEY:'secret_text',TELEGRAM_BOT_TOKEN:'secret_text'};
const bindings = m.bindings || {};
for (const [name,type] of Object.entries(expected)) requireTrue(bindings[name] === type, 'Missing/mismatched binding: ' + name);
requireTrue(Object.keys(bindings).length === Object.keys(expected).length, 'Unexpected bindings: manual review required');
for (const key of ['ciPassed','rbacPassed','securityPassed','rollbackVerified','productionMetadataMatched','routesVerified','d1SchemaMatched','readOnlySmokePlanReady'])
  requireTrue(m.gates?.[key] === true, 'Release gate not verified: ' + key);
requireTrue(typeof m.productionVersion === 'string' && !!m.productionVersion, 'Current production version required');
requireTrue(typeof m.productionDeployment === 'string' && !!m.productionDeployment, 'Current production deployment required');
requireTrue(m.rollback?.verifiedBundle === true && typeof m.rollback?.artifactSha256 === 'string' && /^sha256:[a-f0-9]{64}$/.test(m.rollback.artifactSha256), 'Verified rollback artifact required');
if (fail.length) { console.error('RELEASE BLOCKED\n' + fail.map(x=>' - '+x).join('\n')); process.exit(1); }
console.log('Offline manifest checks passed. This does NOT deploy or independently verify Cloudflare state.');
