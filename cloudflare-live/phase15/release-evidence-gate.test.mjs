import assert from 'node:assert/strict';
import {check} from './release-evidence-gate.mjs';
const sha='a'.repeat(40);
const keys=['phase15_ci','integration_http','staging_http','mobile_qa','telegram_two_accounts','owner_isolation','admin_permissions','receipt_privacy','payment_sandbox','ai_consent_budget','accessibility','security_review','backup_restore','rollback_rehearsal','production_approval'];
const evidence={target:'production',commit:sha,gates:Object.fromEntries(keys.map(k=>[k,{passed:true,evidence:'https://github.com/example-org/release-evidence/issues/'+k}]))};
evidence.gates.production_approval.approval_scope='deploy this exact commit';
evidence.gates.production_approval.approved_commit=sha;
assert.deepEqual(check(evidence),[]);
assert.ok(check({}).length>0);
for(const k of keys){const bad=structuredClone(evidence);delete bad.gates[k];assert.ok(check(bad).length>0,k);}
for(const k of keys){const bad=structuredClone(evidence);bad.gates[k].passed=false;assert.ok(check(bad).length>0,k);}
for(const k of keys){const bad=structuredClone(evidence);bad.gates[k].evidence='';assert.ok(check(bad).length>0,k);}
for(const change of [e=>e.target='integration',e=>e.commit='latest',e=>e.gates.production_approval.approved_commit='b'.repeat(40),e=>e.gates.production_approval.approval_scope='general permission']){const bad=structuredClone(evidence);change(bad);assert.ok(check(bad).length>0);}
for(const invalid of ['https://example.test/evidence','http://github.com/evidence','https://localhost/evidence','https://user:pass@github.com/evidence','https://github.com/evidence#fragment','not-a-url']){
 const bad=structuredClone(evidence);bad.gates.phase15_ci.evidence=invalid;
 assert.ok(check(bad).length>0,'unsafe evidence URL: '+invalid);
}
for(const invalid of ['https://10.0.0.2/evidence','https://172.16.0.1/evidence','https://192.168.1.1/evidence','https://169.254.169.254/latest/meta-data','https://100.64.0.1/evidence','https://198.51.100.2/evidence','https://203.0.113.3/evidence','https://[::1]/evidence','https://[fd00::1]/evidence']){
 const bad=structuredClone(evidence);bad.gates.phase15_ci.evidence=invalid;
 assert.ok(check(bad).length>0,'nonpublic IP evidence URL: '+invalid);
}
console.log('PASS: fail-closed release evidence checks, 15 required gates and exact-commit approval');
