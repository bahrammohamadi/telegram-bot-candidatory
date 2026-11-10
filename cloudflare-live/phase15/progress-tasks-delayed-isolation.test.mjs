// Synthetic concurrent owner isolation with genuinely interleaved asynchronous D1 reads.
// Run after: node cloudflare-live/phase15/build-progress-tasks.mjs
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import worker from './dist/integration-progress-tasks-worker.mjs';

const token='123456789:SYNTHETIC_DELAYED_ISOLATION';
const ids=[9106151001,9106151002];
const metrics=new Map([[ids[0],{total:3,completed:2,doing:1,overdue:0}],[ids[1],{total:7,completed:1,doing:2,overdue:4}]]);
const reads=[];
function sign(id){
 const p=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id,first_name:'Test'})});
 const data=[...p].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>k+'='+v).join('\n');
 const key=createHmac('sha256','WebAppData').update(token).digest();
 p.set('hash',createHmac('sha256',key).update(data).digest('hex'));
 return p.toString();
}
const env={TELEGRAM_BOT_TOKEN:token,DB:{prepare(sql){
 let args=[];
 return {bind(...a){args=a;return this},async first(){
  if(sql.includes('FROM candidate_tasks_v1')){
   assert.match(sql,/WHERE\s+telegram_id\s*=\s*\?/i,'task SQL must scope the authenticated owner');
   assert.equal(args.length,1,'task query must bind exactly one owner');
   const owner=args[0];
   assert.ok(ids.includes(owner),'task query must bind a signed synthetic owner');
   reads.push(owner);
   await new Promise(resolve=>setTimeout(resolve,owner===ids[0]?25:1));
   return metrics.get(owner)??null;
  }
  if(sql.includes('FROM candidate_profiles'))return null;
  if(sql.includes('FROM quizzes'))return {n:0};
  return {};
 }};
}}};
async function request(id){
 const r=await worker.fetch(new Request('https://synthetic.invalid/api/progress',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData:sign(id),action:'overview'})}),env);
 return {status:r.status,body:await r.json()};
}
const owners=[ids[0],ids[1],ids[0],ids[1],ids[1],ids[0]];
const results=await Promise.all(owners.map(request));
results.forEach((r,i)=>{
 assert.equal(r.status,200,'signed owner request should succeed');
 assert.deepEqual(r.body.tasks,metrics.get(owners[i]),'asynchronous D1 read crossed owner boundary');
});
assert.deepEqual([...reads].sort(),[...owners].sort(),'every owner must receive its own D1 query');
// Negative control: a tampered signed identity must fail before any D1 read,
// including while other valid owners are being processed concurrently.
const tampered=new URLSearchParams(sign(ids[0]));
tampered.set('user',JSON.stringify({id:ids[1],first_name:'Test'}));
const beforeRejected=reads.length;
const rejected=await worker.fetch(new Request('https://synthetic.invalid/api/progress',{
 method:'POST',headers:{'content-type':'application/json'},
 body:JSON.stringify({initData:tampered.toString(),action:'overview'})
}),env);
assert.equal(rejected.status,401,'tampered signed owner must be rejected');
assert.equal(reads.length,beforeRejected,'rejected owner must never query D1');
// Mixed-load regression: invalid identities must never borrow a valid request's
// authenticated owner while asynchronous D1 reads are in flight.
const mixedOwners=[ids[0],ids[1],ids[0],ids[1]];
const mixedPayloads=mixedOwners.map(sign);
const forgedMixed=new URLSearchParams(sign(ids[0]));
forgedMixed.set('user',JSON.stringify({id:ids[1],first_name:'Test'}));
const badHashMixed=new URLSearchParams(sign(ids[1]));
badHashMixed.set('hash','0'.repeat(64));
const mixedInputs=[mixedPayloads[0],forgedMixed.toString(),mixedPayloads[1],badHashMixed.toString(),mixedPayloads[2],mixedPayloads[3]];
const mixedBefore=reads.length;
const mixedResponses=await Promise.all(mixedInputs.map(async initData=>{
 const r=await worker.fetch(new Request('https://synthetic.invalid/api/progress',{
  method:'POST',headers:{'content-type':'application/json'},
  body:JSON.stringify({initData,action:'overview'})
 }),env);
 return {status:r.status,body:await r.json()};
}));
assert.deepEqual(mixedResponses.map(r=>r.status),[200,401,200,401,200,200],
 'forged and invalid HMAC must fail even during valid concurrent requests');
for(const [index,owner] of [[0,ids[0]],[2,ids[1]],[4,ids[0]],[5,ids[1]]]){
 assert.deepEqual(mixedResponses[index].body.tasks,metrics.get(owner),
  'mixed-load signed owner must not receive another user metrics');
}
assert.deepEqual([...reads.slice(mixedBefore)].sort(),[...mixedOwners].sort(),
 'invalid identities must never cause a D1 read under mixed concurrent load');
console.log('PASS mixed valid/invalid concurrent requests: forged and bad HMAC denied without D1 reads');

console.log('PASS delayed D1 concurrency: six interleaved signed requests isolated, owner-bound SQL and forged identity denied');
// Rollback: delete this test and remove its CI step. No Worker or D1 changes.
