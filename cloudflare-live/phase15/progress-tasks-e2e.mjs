import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {readFileSync} from 'node:fs';
import worker from './dist/integration-progress-tasks-worker.mjs';
const token='123456789:SYNTHETIC_PROGRESS_TOKEN';
function signed(id,authDate=Math.floor(Date.now()/1000)){
 const p=new URLSearchParams({auth_date:String(authDate),user:JSON.stringify({id,first_name:'Synthetic'}),signature:'synthetic'});
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
// A valid-looking payload with a corrupted HMAC must never query D1.
// This guards the fail-before-database boundary separately from user-field forgery.
const badHash=new URLSearchParams(signed(uid2));
const validHash=badHash.get('hash');
badHash.set('hash',(validHash[0]==='a'?'b':'a')+validHash.slice(1));
const tamperedHashOutage=await outageProbe(badHash.toString());
assert.equal(tamperedHashOutage.status,401,'tampered Telegram HMAC must be rejected');
assert.equal(outageReads,0,'anonymous, forged and tampered identities must not touch unavailable D1');
const signedOutage=await outageProbe(signed(uid1));
assert.ok(outageReads>0,'valid identity must reach D1 before an outage is reported');
assert.ok(signedOutage.status>=500 && signedOutage.status<=599,
 'D1 failure must fail closed, not return fabricated progress or HTTP 200');
assert.ok(!signedOutage.body.includes('SYNTHETIC_D1_READ_LIMIT_PRIVATE_MARKER'),
 'database exception details must not leak into the API response');
console.log('PASS phase15 outage: anonymous/forged auth rejected before D1, signed D1 failure fails closed without leaking driver error');

// Replay-window regression: even a cryptographically valid Telegram payload
// must be rejected when auth_date is too old or too far in the future.
// A rejected identity must not cause any D1 query, including during outages.
const nowSeconds=Math.floor(Date.now()/1000);
for(const [label,authDate] of [
 ['expired',nowSeconds-3601],
 ['future',nowSeconds+61],
 ['invalid-zero',0]
]){
 const before=outageReads;
 const result=await outageProbe(signed(uid1,authDate));
 assert.equal(result.status,401,label+' signed initData must be rejected');
 assert.equal(outageReads,before,label+' signed initData must not reach D1');
}
// An identity well inside the allowed one-hour window remains valid.
const fresh=await progress(signed(uid1,nowSeconds-30));
assert.equal(fresh.status,200,'fresh signed Telegram identity should pass');
assert.deepEqual(fresh.data.tasks,data.get(uid1));
console.log('PASS phase15 replay window: expired/future/zero auth_date fail before D1; fresh signed identity succeeds');
