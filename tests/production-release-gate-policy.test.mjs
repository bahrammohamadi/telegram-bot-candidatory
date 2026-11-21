// Offline regression tests for release gate. No network, deployment, or production data.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const script = resolve('scripts/validate-production-release.mjs');
const sha = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const bindings = {DB:'d1',REVIEW_DB:'d1',AI:'ai',ADMIN_TELEGRAM_IDS:'secret_text',ADMIN_TELEGRAM_IDS_MAHDI:'secret_text',AVALAI_API_KEY:'secret_text',TELEGRAM_BOT_TOKEN:'secret_text'};
const gates = Object.fromEntries(['ciPassed','rbacPassed','securityPassed','rollbackVerified','productionMetadataMatched','routesVerified','d1SchemaMatched','readOnlySmokePlanReady'].map(k=>[k,true]));
function fixture() {
 const dir=mkdtempSync(join(tmpdir(),'candidatory-release-'));
 const a=join(dir,'a.js'), b=join(dir,'b.js');
 writeFileSync(a,'export const a=1;');writeFileSync(b,'export const b=2;');
 const manifest={worker:'candidatory-miniapp-api',environment:'production',deployTarget:'existing-only',
 modules:[{name:'a.js',path:a,sha256:sha('export const a=1;')},{name:'b.js',path:b,sha256:sha('export const b=2;')}],
 bindings,gates,productionVersion:'fixture-version',productionDeployment:'fixture-deployment',
 rollback:{verifiedBundle:true,artifactSha256:sha('fixture-rollback')}};
 // Validator requires paths relative to repo working directory.
 const relativeA=join('tests','.offline-release-a.js'),relativeB=join('tests','.offline-release-b.js');
 return {dir,manifest,relativeA,relativeB};
}
function run(m) { const f=join(tmpdir(),'candidatory-manifest-'+process.pid+'-'+Math.random().toString(36).slice(2)+'.json');try{writeFileSync(f,JSON.stringify(m));return spawnSync(process.execPath,[script,f],{encoding:'utf8',timeout:5000});}finally{rmSync(f,{force:true});}}
test('rejects wrong worker and environment before any deployment',()=>{const {dir,manifest}=fixture();try{manifest.worker='candidatory-news-bot';manifest.environment='staging';const r=run(manifest);assert.equal(r.status,1);assert.match(r.stderr,/Only the existing production worker/);assert.match(r.stderr,/Environment must be production/);}finally{rmSync(dir,{recursive:true,force:true});}});
test('rejects missing RBAC evidence and missing rollback',()=>{const {dir,manifest}=fixture();try{manifest.gates.rbacPassed=false;manifest.rollback.verifiedBundle=false;const r=run(manifest);assert.equal(r.status,1);assert.match(r.stderr,/rbacPassed/);assert.match(r.stderr,/Verified rollback artifact/);}finally{rmSync(dir,{recursive:true,force:true});}});
test('rejects unexpected bindings and incomplete module inventory',()=>{const {dir,manifest}=fixture();try{manifest.modules=[];manifest.bindings.EXTRA='secret_text';const r=run(manifest);assert.equal(r.status,1);assert.match(r.stderr,/Complete multipart module inventory/);assert.match(r.stderr,/Unexpected bindings/);}finally{rmSync(dir,{recursive:true,force:true});}});
