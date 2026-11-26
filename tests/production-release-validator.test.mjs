// Offline regression tests for the fail-closed production release validator.
// Uses synthetic files only. No Cloudflare, D1, credentials or deployment.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const validator = new URL('../scripts/validate-production-release.mjs', import.meta.url).pathname;
const sha = data => 'sha256:' + createHash('sha256').update(data).digest('hex');
const bindings = { DB:'d1', REVIEW_DB:'d1', AI:'ai', ADMIN_TELEGRAM_IDS:'secret_text', ADMIN_TELEGRAM_IDS_MAHDI:'secret_text', AVALAI_API_KEY:'secret_text', TELEGRAM_BOT_TOKEN:'secret_text' };
const gates = Object.fromEntries(['ciPassed','rbacPassed','securityPassed','rollbackVerified','productionMetadataMatched','routesVerified','d1SchemaMatched','readOnlySmokePlanReady'].map(k=>[k,true]));
function fixture(change = m=>m) {
  const dir = mkdtempSync(join(tmpdir(), 'candidatory-release-test-'));
  mkdirSync(join(dir,'src'));
  const a='export default 1;', b='export default 2;';
  writeFileSync(join(dir,'src/a.js'),a); writeFileSync(join(dir,'src/b.js'),b);
  const manifest = {worker:'candidatory-miniapp-api',environment:'production',deployTarget:'existing-only',
    modules:[{name:'a.js',path:'src/a.js',sha256:sha(a)},{name:'b.js',path:'src/b.js',sha256:sha(b)}],
    bindings:{...bindings},gates:{...gates},productionVersion:'synthetic-version',productionDeployment:'synthetic-deployment',
    rollback:{verifiedBundle:true,artifactSha256:sha('synthetic-rollback')}};
  change(manifest);
  const path=join(dir,'manifest.json'); writeFileSync(path,JSON.stringify(manifest));
  const result=spawnSync(process.execPath,[validator,path],{cwd:dir,encoding:'utf8'});
  rmSync(dir,{recursive:true,force:true});
  return result;
}
test('complete synthetic manifest passes offline checks only',()=>{
  const r=fixture(); assert.equal(r.status,0,r.stderr); assert.match(r.stdout,/does NOT deploy/);
});
test('blocks a second worker target',()=>{
  const r=fixture(m=>m.worker='candidatory-news-bot'); assert.equal(r.status,1); assert.match(r.stderr,/existing production worker/);
});
test('blocks incomplete multipart inventory',()=>{
  const r=fixture(m=>m.modules.pop()); assert.equal(r.status,1); assert.match(r.stderr,/multipart/);
});
test('blocks tampered module bytes or hash',()=>{
  const r=fixture(m=>m.modules[0].sha256=sha('tampered')); assert.equal(r.status,1); assert.match(r.stderr,/Hash mismatch/);
});
test('blocks missing RBAC approval',()=>{
  const r=fixture(m=>m.gates.rbacPassed=false); assert.equal(r.status,1); assert.match(r.stderr,/rbacPassed/);
});
test('blocks missing verified rollback bundle',()=>{
  const r=fixture(m=>m.rollback.verifiedBundle=false); assert.equal(r.status,1); assert.match(r.stderr,/rollback artifact/);
});
test('blocks altered binding types',()=>{
  const r=fixture(m=>m.bindings.DB='kv_namespace'); assert.equal(r.status,1); assert.match(r.stderr,/DB/);
});
test('blocks traversal paths',()=>{
  const r=fixture(m=>m.modules[0].path='../outside.js'); assert.equal(r.status,1); assert.match(r.stderr,/unsafe module path/);
});
