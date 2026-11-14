#!/usr/bin/env node
// Offline production-only release evidence gate. No network, secrets, or deployment.
'use strict';
const fs = require('node:fs');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const file = process.argv[2];
if (!file) { console.error('Usage: node scripts/check-production-release-evidence.cjs evidence.json'); process.exit(2); }
let e;
try { e = JSON.parse(fs.readFileSync(file,'utf8')); } catch(err) { console.error('FAIL: invalid evidence file:',err.message); process.exit(2); }
const failures=[];
const check=(condition,why)=>{if(!condition) failures.push(why)};
const hex64=x=>typeof x==='string'&&/^[a-f0-9]{64}$/i.test(x);
const uuid=x=>typeof x==='string'&&/^[a-f0-9-]{36}$/i.test(x);
check(e.worker==='candidatory-miniapp-api','worker must be the existing production worker');
check(e.environment==='production','only production environment is allowed');
check(e.secondaryEnvironmentCreated===false,'no secondary environment may be created');
check(hex64(e.commitSha),'exact candidate commit SHA required');
check(e.ci?.commitSha===e.commitSha && e.ci?.conclusion==='success' && typeof e.ci?.url==='string' && e.ci.url.startsWith('https://github.com/'),'successful CI for exact candidate commit required');
check(uuid(e.active?.versionId)&&uuid(e.active?.deploymentId),'fresh active version and deployment required');
check(typeof e.active?.observedAt==='string' && !Number.isNaN(Date.parse(e.active.observedAt)),'timestamped live deployment observation required');
const parts=e.modules;
check(Array.isArray(parts)&&parts.length>=2,'multi-module artifact must list all parts');
if(Array.isArray(parts)){
  const names=parts.map(p=>p.name);
  check(new Set(names).size===names.length,'module names must be unique');
  for(const p of parts) check(typeof p.name==='string' && hex64(p.productionSha256)&&hex64(p.candidateSha256)&&p.productionSha256===p.candidateSha256,'module parity must be independently evidenced: '+String(p.name));
}
check(e.bindings?.matched===true && e.bindings?.secretsValuesRead===false,'binding names/types and secret confidentiality must be verified');
check(e.d1?.schemaReadOnly===true && e.d1?.compatible===true && e.d1?.migrationPerformed===false,'read-only D1 schema compatibility required');
check(e.security?.rbacNegativeTestsPassed===true && e.security?.syntheticOnly===true,'offline synthetic RBAC negative tests required');
check(e.smoke?.method==='GET' && e.smoke?.status===200 && /^https:\/\//.test(e.smoke?.url||''),'read-only canonical URL smoke required');
check(e.rollback?.completeMultipartArtifact===true && e.rollback?.metadataBindingsCompatible===true && e.rollback?.verified===true,'verified complete rollback required');
check(e.approval?.productionOnly===true && e.approval?.authorized===true,'explicit release approval required');
if(failures.length){for(const f of failures) console.error('BLOCK:',f);process.exit(1)}
console.log('Evidence schema passes; this is NOT independent verification of evidence truth or permission to deploy.');
