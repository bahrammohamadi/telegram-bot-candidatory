// Offline regression tests for the evidence gate; no network or production data.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const gate = new URL('../../tools/check-production-evidence.mjs', import.meta.url).pathname;
const valid = () => ({
 repositorySha:'a'.repeat(40), ciRunUrl:'https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/123', ciConclusion:'success',
 workerName:'candidatory-miniapp-api', productionVersionId:'version-example', productionDeploymentId:'deployment-example',
 moduleManifestSha256:'b'.repeat(64), bindingsReviewed:true, d1SchemaReviewed:true, secretsNamesReviewed:true,
 routesReviewed:true, rbacHandlerTestsPassed:true, securityChecksPassed:true, rollbackArtifactSha256:'c'.repeat(64),
 rollbackProcedureReviewed:true, productionSmokePlanReviewed:true
});
function run(payload) {
 const dir=mkdtempSync(join(tmpdir(),'candidate-gate-'));
 try { const file=join(dir,'evidence.json'); writeFileSync(file,JSON.stringify(payload));
   return spawnSync(process.execPath,[gate,file],{encoding:'utf8'});
 } finally { rmSync(dir,{recursive:true,force:true}); }
}
test('complete syntactic evidence is not deployment authorization',()=>{
 const r=run(valid()); assert.equal(r.status,0); assert.match(r.stdout,/not authorization to deploy/);
});
for(const key of ['bindingsReviewed','d1SchemaReviewed','secretsNamesReviewed','routesReviewed','rbacHandlerTestsPassed','securityChecksPassed','rollbackProcedureReviewed','productionSmokePlanReviewed']) {
 test('fail closed when '+key+' is false',()=>{const p=valid();p[key]=false;const r=run(p);assert.notEqual(r.status,0);assert.match(r.stderr,new RegExp(key));});
}
for(const [key,value] of [['workerName','candidatory-news-bot'],['ciConclusion','pending'],['ciRunUrl','https://example.org/run/1'],['repositorySha','bad'],['moduleManifestSha256','bad'],['rollbackArtifactSha256','bad']]) {
 test('reject invalid '+key,()=>{const p=valid();p[key]=value;assert.notEqual(run(p).status,0);});
}
test('reject missing required evidence',()=>{const p=valid();delete p.productionDeploymentId;assert.notEqual(run(p).status,0);});
test('reject non-JSON evidence',()=>{const dir=mkdtempSync(join(tmpdir(),'candidate-gate-'));try{const file=join(dir,'bad.json');writeFileSync(file,'{');const r=spawnSync(process.execPath,[gate,file],{encoding:'utf8'});assert.notEqual(r.status,0);}finally{rmSync(dir,{recursive:true,force:true});}});
