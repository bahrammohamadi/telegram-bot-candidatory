// Offline regression tests for the existing production evidence gate.
// Uses only temporary local JSON fixtures; never calls Cloudflare or production.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const gate = new URL('../../tools/check-production-evidence.mjs', import.meta.url).pathname;
const valid = {
 repositorySha:'a'.repeat(40),ciRunUrl:'https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/123',
 ciConclusion:'success',workerName:'candidatory-miniapp-api',
 productionVersionId:'3c35231f-36f0-4bad-b786-9a4309d8e868',productionDeploymentId:'860f813c-baf4-4cff-bfc7-bb4120b910ed',
 moduleManifestSha256:'b'.repeat(64),bindingsReviewed:true,d1SchemaReviewed:true,
 secretsNamesReviewed:true,routesReviewed:true,rbacHandlerTestsPassed:true,
 securityChecksPassed:true,rollbackArtifactSha256:'c'.repeat(64),
 rollbackProcedureReviewed:true,productionSmokePlanReviewed:true
};
function run(evidence) {
 const dir=mkdtempSync(join(tmpdir(),'candidatory-gate-'));
 try {
  const file=join(dir,'evidence.json');writeFileSync(file,JSON.stringify(evidence));
  return spawnSync(process.execPath,[gate,file],{encoding:'utf8'});
 } finally {rmSync(dir,{recursive:true,force:true});}
}
test('complete fixture passes structural gate (not deploy authorization)',()=>assert.equal(run(valid).status,0));
for(const [name,patch] of [
 ['wrong worker',{workerName:'candidatory-news-bot'}],
 ['malformed production version',{productionVersionId:'version-fixture'}],
 ['malformed deployment ID',{productionDeploymentId:'deployment-fixture'}],
 ['failed CI',{ciConclusion:'failure'}],
 ['false RBAC',{rbacHandlerTestsPassed:false}],
 ['string security boolean',{securityChecksPassed:'true'}],
 ['missing rollback hash',{rollbackArtifactSha256:''}],
 ['short module hash',{moduleManifestSha256:'abc'}],
 ['invalid repository SHA',{repositorySha:'123'}],
 ['wrong CI host',{ciRunUrl:'https://example.com/actions/runs/123'}],
 ['missing D1 review',{d1SchemaReviewed:undefined}]
]) test('blocks '+name,()=>{const r=run({...valid,...patch});assert.notEqual(r.status,0);assert.match(r.stderr,/BLOCKED/);});
test('blocks absent evidence argument',()=>{
 const r=spawnSync(process.execPath,[gate],{encoding:'utf8'});
 assert.notEqual(r.status,0);assert.match(r.stderr,/BLOCKED/);
});
