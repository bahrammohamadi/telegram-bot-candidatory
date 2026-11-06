import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {readFileSync} from 'node:fs';
import worker from './dist/integration-progress-tasks-worker.mjs';
const token='123456789:SYNTHETIC_PROGRESS_TOKEN';
function signed(id){
 const p=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id,first_name:'Synthetic'}),signature:'synthetic'});
 const msg=[...p.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>k+'='+v).join('\n');
 const key=createHmac('sha256','WebAppData').update(token).digest();
 p.set('hash',createHmac('sha256',key).update(msg).digest('hex'));return p.toString();
}
const uid1=9106150001,uid2=9106150002;
const data=new Map([[uid1,{total:4,completed:2,doing:1,overdue:1}],[uid2,{total:1,completed:0,doing:0,overdue:0}]]);
const queries=[];
const DB={prepare(sql){let bound=[];return {bind(...args){bound=args;return this},async first(){
 queries.push({sql,bound});
 if(sql.includes('FROM candidate_tasks_v1'))return data.get(bound[0])||null;
 if(sql.includes('FROM candidate_profiles'))return null;
 if(sql.includes('FROM quizzes'))return {n:2};
 return {};
 }} }};
const env={DB,TELEGRAM_BOT_TOKEN:token};
async function progress(initData){
 const r=await worker.fetch(new Request('https://phase15.synthetic/api/progress',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData,action:'overview'})}),env);
 return {status:r.status,data:await r.json()};
}
assert.equal((await progress('invalid')).status,401);
for(const id of [uid1,uid2]){
 const r=await progress(signed(id));assert.equal(r.status,200,JSON.stringify(r));
 assert.deepEqual(r.data.tasks,data.get(id));
 assert.equal(r.data.scope,'authenticated_test_account');
}
const forged=new URLSearchParams(signed(uid1));forged.set('user',JSON.stringify({id:uid2,first_name:'Synthetic'}));
assert.equal((await progress(forged.toString())).status,401);
const taskQueries=queries.filter(q=>q.sql.includes('FROM candidate_tasks_v1'));
assert.equal(taskQueries.length,2);
assert.ok(taskQueries.every(q=>q.sql.includes('WHERE telegram_id=?')),'task metrics must be owner-scoped');
assert.deepEqual(taskQueries.map(q=>q.bound[0]),[uid1,uid2]);
assert.ok(taskQueries.every(q=>q.sql.includes("date('now','+210 minutes')")),'Tehran overdue cutoff');
const src=readFileSync(new URL('./dist/integration-progress-tasks-worker.mjs',import.meta.url),'utf8');
assert.ok(src.includes('وظایف شخصی'));
assert.ok(src.includes('وظایف: '));
assert.ok(src.includes('/api/tasks'));
assert.ok(src.includes('/api/assistant'));
console.log('PASS phase15: signed auth, forged identity rejection, owner-isolated task progress, Tehran overdue, UI/export integration');


// Outage regression: invalid Telegram identity must fail before any D1 access,
// even when the database is unavailable. Valid signed requests must not return
// a fabricated success or leak SQL/driver internals when D1 reads fail.
let outageReads=0;
const outageDB={prepare(){outageReads++;throw new Error('SYNTHETIC_D1_READ_LIMIT_PRIVATE_MARKER')}};
const outageEnv={DB:outageDB,TELEGRAM_BOT_TOKEN:token};
async function outageProbe(initData){
 const response=await worker.fetch(new Request('https://phase15.synthetic/api/progress',{
  method:'POST',headers:{'content-type':'application/json'},
  body:JSON.stringify({initData,action:'overview'})
 }),outageEnv);
 return {status:response.status,body:await response.text()};
}
const anonymousOutage=await outageProbe('');
assert.equal(anonymousOutage.status,401,'anonymous identity must be rejected independently of D1');
const forgedOutage=await outageProbe(forged.toString());
assert.equal(forgedOutage.status,401,'forged identity must be rejected independently of D1');
assert.equal(outageReads,0,'invalid identity must not touch unavailable D1');
const signedOutage=await outageProbe(signed(uid1));
assert.ok(outageReads>0,'valid identity must reach D1 before an outage is reported');
assert.ok(signedOutage.status>=500 && signedOutage.status<=599,
 'D1 failure must fail closed, not return fabricated progress or HTTP 200');
assert.ok(!signedOutage.body.includes('SYNTHETIC_D1_READ_LIMIT_PRIVATE_MARKER'),
 'database exception details must not leak into the API response');
console.log('PASS phase15 outage: anonymous/forged auth rejected before D1, signed D1 failure fails closed without leaking driver error');
