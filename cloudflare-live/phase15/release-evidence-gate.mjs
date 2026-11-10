#!/usr/bin/env node
// Fail-closed release evidence gate. No API calls, credentials, or deployment.
import {readFileSync} from 'node:fs';
const required=['phase15_ci','integration_http','staging_http','mobile_qa','telegram_two_accounts','owner_isolation','admin_permissions','receipt_privacy','payment_sandbox','ai_consent_budget','accessibility','security_review','backup_restore','rollback_rehearsal','production_approval'];
// Reject placeholder, local, and credential-bearing evidence links.
function isNonPublicIpHost(host){
 const h=host.replace(/^\\[|\\]$/g,'');
 if(h.includes(':'))return true; // reject IPv6 literals, including loopback and private ranges
 if(!/^\\d+\\.\\d+\\.\\d+\\.\\d+$/.test(h))return false;
 const a=h.split('.').map(Number);
 return a[0]===0||a[0]===10||a[0]===127||a[0]>=224||
  (a[0]===100&&a[1]>=64&&a[1]<=127)||
  (a[0]===169&&a[1]===254)||
  (a[0]===172&&a[1]>=16&&a[1]<=31)||
  (a[0]===192&&a[1]===168)||
  (a[0]===192&&a[1]===0&&a[2]===0)||
  (a[0]===198&&a[1]>=18&&a[1]<=19)||
  (a[0]===198&&a[1]===51&&a[2]===100)||
  (a[0]===203&&a[1]===0&&a[2]===113);
}
export function isReviewableEvidence(value){
 if(typeof value!=='string'||value.length>2048)return false;
 try{
  const url=new URL(value);
  const host=url.hostname.toLowerCase();
  return url.protocol==='https:'&&!url.username&&!url.password&&!url.hash&&
   !['localhost','127.0.0.1','::1'].includes(host)&&!isNonPublicIpHost(host)&&
   !host.endsWith('.localhost')&&!host.endsWith('.test')&&!host.endsWith('.invalid')&&!host.endsWith('.example')&&
   !['example.com','example.org','example.net'].includes(host);
 }catch{return false;}
}
export function check(e){
 if(!e||typeof e!=='object'||Array.isArray(e))return ['invalid evidence'];
 const errors=[];
 if(e.target!=='production')errors.push('target must be production');
 if(typeof e.commit!=='string'||!/^[a-f0-9]{40}$/.test(e.commit))errors.push('missing pinned 40-character commit');
 for(const k of required){
  const v=e.gates?.[k];
  if(!v||v.passed!==true||!isReviewableEvidence(v.evidence))errors.push('missing verified gate: '+k);
 }
 if(e.gates?.production_approval?.approval_scope!=='deploy this exact commit')errors.push('specific production approval missing');
 if(e.gates?.production_approval?.approved_commit!==e.commit)errors.push('approval does not match pinned commit');
 return errors;
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 try{
  const e=JSON.parse(readFileSync(process.argv[2],'utf8'));
  const errors=check(e);
  if(errors.length){console.error('NO-GO: '+errors.join('; '));process.exitCode=1;}
  else console.log('GO evidence complete; manual deployment approval and operator verification still required');
 }catch{console.error('NO-GO: unreadable or invalid evidence');process.exitCode=1;}
}
