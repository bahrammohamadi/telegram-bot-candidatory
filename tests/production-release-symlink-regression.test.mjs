#!/usr/bin/env node
// Regression checks for production release validator. No network or deployment.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const validator = resolve('scripts/validate-production-release.mjs');
const hash = s => 'sha256:' + createHash('sha256').update(s).digest('hex');
function fixture() {
 const root=mkdtempSync(join(tmpdir(),'candidatory-policy-'));
 const outside=mkdtempSync(join(tmpdir(),'candidatory-outside-'));
 mkdirSync(join(root,'src'));
 writeFileSync(join(root,'src','main.js'),'export default {}');
 writeFileSync(join(outside,'external.js'),'export default {}');
 const bindings={DB:'d1',REVIEW_DB:'d1',AI:'ai',ADMIN_TELEGRAM_IDS:'secret_text',ADMIN_TELEGRAM_IDS_MAHDI:'secret_text',AVALAI_API_KEY:'secret_text',TELEGRAM_BOT_TOKEN:'secret_text'};
 const gates=Object.fromEntries(['ciPassed','rbacPassed','securityPassed','rollbackVerified','productionMetadataMatched','routesVerified','d1SchemaMatched','readOnlySmokePlanReady'].map(x=>[x,true]));
 const manifest={worker:'candidatory-miniapp-api',environment:'production',deployTarget:'existing-only',modules:[{name:'main.js',path:'src/main.js',sha256:hash('export default {}')},{name:'second.js',path:'src/second.js',sha256:hash('export default {}')}],bindings,gates,productionVersion:'fixture',productionDeployment:'fixture',rollback:{verifiedBundle:true,artifactSha256:hash('fixture')}};
 writeFileSync(join(root,'src','second.js'),'export default {}');
 return {root,outside,manifest,cleanup:()=>{rmSync(root,{recursive:true,force:true});rmSync(outside,{recursive:true,force:true});}};
}
function run(f) { const p=join(f.root,'manifest.json');writeFileSync(p,JSON.stringify(f.manifest));return spawnSync(process.execPath,[validator,p],{cwd:f.root,encoding:'utf8'}); }
test('valid synthetic manifest passes offline validation',()=>{const f=fixture();try{assert.equal(run(f).status,0);}finally{f.cleanup();}});
test('symlink outside repository is rejected even with matching hash',()=>{const f=fixture();try{symlinkSync(join(f.outside,'external.js'),join(f.root,'src','link.js'));f.manifest.modules[1]={name:'second.js',path:'src/link.js',sha256:hash('export default {}')};const r=run(f);assert.equal(r.status,1);assert.match(r.stderr,/unsafe module path/);}finally{f.cleanup();}});
test('traversal outside repository is rejected',()=>{const f=fixture();try{f.manifest.modules[1].path='../outside.js';assert.equal(run(f).status,1);}finally{f.cleanup();}});
test('RBAC failure blocks release',()=>{const f=fixture();try{f.manifest.gates.rbacPassed=false;assert.equal(run(f).status,1);}finally{f.cleanup();}});
