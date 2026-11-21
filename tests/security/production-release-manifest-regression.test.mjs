// Offline regression tests: no Cloudflare requests, no deployment, no real D1 data.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const validator = fileURLToPath(new URL('../../scripts/validate-production-release.mjs', import.meta.url));
const sha = 'sha256:' + '0'.repeat(64);
function run(m, setup) {
  const dir = mkdtempSync(join(tmpdir(), 'candidatory-manifest-'));
  try {
    setup?.(dir);
    const path = join(dir, 'manifest.json');
    writeFileSync(path, JSON.stringify(m));
    return spawnSync(process.execPath, [validator, path], { cwd: dir, encoding: 'utf8' });
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
const base = () => ({
  worker: 'candidatory-miniapp-api', environment: 'production', deployTarget: 'existing-only',
  modules: [{ name: 'main', path: 'main.js', sha256: sha }, { name: 'ui', path: 'ui.js', sha256: sha }],
  bindings: { DB:'d1', REVIEW_DB:'d1', AI:'ai', ADMIN_TELEGRAM_IDS:'secret_text', ADMIN_TELEGRAM_IDS_MAHDI:'secret_text', AVALAI_API_KEY:'secret_text', TELEGRAM_BOT_TOKEN:'secret_text' },
  gates: Object.fromEntries(['ciPassed','rbacPassed','securityPassed','rollbackVerified','productionMetadataMatched','routesVerified','d1SchemaMatched','readOnlySmokePlanReady'].map(x=>[x,true])),
  productionVersion:'historical-example', productionDeployment:'historical-example',
  rollback:{ verifiedBundle:true, artifactSha256:sha }
});
test('rejects array manifest without exception', () => {
  const r=run([]); assert.equal(r.status,1); assert.match(r.stderr,/manifest must be a JSON object/);
});
test('rejects null manifest without exception', () => {
  const r=run(null); assert.equal(r.status,1); assert.match(r.stderr,/manifest must be a JSON object/);
});
test('rejects directory as module', () => {
  const m=base(); m.modules[0].path='directory';
  const r=run(m, d=>mkdirSync(join(d,'directory')));
  assert.equal(r.status,1); assert.match(r.stderr,/Missing or unsafe module path/);
});
test('rejects symlink escaping repository root', () => {
  const m=base(); m.modules[0].path='escape.js';
  const r=run(m,d=>symlinkSync(resolve(process.execPath),join(d,'escape.js')));
  assert.equal(r.status,1); assert.match(r.stderr,/Missing or unsafe module path/);
});
test('rejects disabled RBAC gate', () => {
  const m=base(); m.gates.rbacPassed=false;
  const r=run(m); assert.equal(r.status,1); assert.match(r.stderr,/rbacPassed/);
});
test('rejects wrong worker target', () => {
  const m=base(); m.worker='candidatory-news-bot';
  const r=run(m); assert.equal(r.status,1); assert.match(r.stderr,/Only the existing production worker/);
});
