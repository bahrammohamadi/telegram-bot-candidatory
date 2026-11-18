// Offline regression tests for the production evidence gate; no deployment or network.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const gate = new URL('../../tools/check-production-evidence.mjs', import.meta.url).pathname;
const valid = {
  repositorySha:'a'.repeat(40), ciRunUrl:'https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/123',
  ciConclusion:'success', workerName:'candidatory-miniapp-api', productionVersionId:'version',
  productionDeploymentId:'deployment', moduleManifestSha256:'b'.repeat(64),
  bindingsReviewed:true,d1SchemaReviewed:true,secretsNamesReviewed:true,routesReviewed:true,
  rbacHandlerTestsPassed:true,securityChecksPassed:true,rollbackArtifactSha256:'c'.repeat(64),
  rollbackProcedureReviewed:true,productionSmokePlanReviewed:true
};
function run(value){const dir=mkdtempSync(join(tmpdir(),'candidate-evidence-'));try{const file=join(dir,'evidence.json');writeFileSync(file,JSON.stringify(value));return spawnSync(process.execPath,[gate,file],{encoding:'utf8'});}finally{rmSync(dir,{recursive:true,force:true});}}
test('complete synthetic evidence passes syntax gate only',()=>{const r=run(valid);assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/not authorization to deploy/);});
test('missing evidence fails closed',()=>{const r=run({...valid,rollbackArtifactSha256:undefined});assert.notEqual(r.status,0);assert.match(r.stderr,/rollbackArtifactSha256/);});
test('false RBAC handler review fails closed',()=>{assert.notEqual(run({...valid,rbacHandlerTestsPassed:false}).status,0);});
test('wrong worker fails closed',()=>{assert.notEqual(run({...valid,workerName:'candidatory-news-bot'}).status,0);});
test('failed CI fails closed',()=>{assert.notEqual(run({...valid,ciConclusion:'failure'}).status,0);});
test('invalid hashes fail closed',()=>{assert.notEqual(run({...valid,moduleManifestSha256:'fake'}).status,0);});
test('untrusted CI URL fails closed',()=>{assert.notEqual(run({...valid,ciRunUrl:'https://example.com/actions/runs/123'}).status,0);});
