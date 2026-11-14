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
// Regression: alternating signed accounts must never reuse the previous owner's
// cached metrics or query parameters across requests in one Worker isolate.
const alternatingOwners=[uid2,uid1,uid2,uid1];
for(const id of alternatingOwners){
 const result=await progress(signed(id));
 assert.equal(result.status,200,'alternating owner request must succeed');
 assert.deepEqual(result.data.tasks,data.get(id),'cross-account task metrics leaked');
}
const alternatingQueries=queries.filter(q=>q.sql.includes('FROM candidate_tasks_v1'));
assert.deepEqual(alternatingQueries.map(q=>q.bound[0]),[uid1,uid2,...alternatingOwners],
 'task queries must bind the currently authenticated owner on every request');
console.log('PASS phase15 alternating accounts: no stale owner metrics across sequential signed requests');

const forged=new URLSearchParams(signed(uid1));forged.set('user',JSON.stringify({id:uid2,first_name:'Synthetic'}));
assert.equal((await progress(forged.toString())).status,401);
const taskQueries=queries.filter(q=>q.sql.includes('FROM candidate_tasks_v1'));
assert.equal(taskQueries.length,6);
assert.ok(taskQueries.every(q=>q.sql.includes('WHERE telegram_id=?')),'task metrics must be owner-scoped');
assert.deepEqual(taskQueries.map(q=>q.bound[0]),[uid1,uid2,...alternatingOwners]);
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


// Regression: a payload signed with a different bot token must never authenticate.
// Also reject malformed user JSON even if its hash is cryptographically valid.
const wrongToken='987654321:OTHER_SYNTHETIC_BOT_TOKEN';
function signFields(fields, signingToken){
 const params=new URLSearchParams(fields);
 const check=[...params.entries()].filter(([key])=>key!=='hash').sort(([a],[b])=>a.localeCompare(b)).map(([key,value])=>key+'='+value).join('\n');
 const secret=createHmac('sha256','WebAppData').update(signingToken).digest();
 params.set('hash',createHmac('sha256',secret).update(check).digest('hex'));
 return params.toString();
}
const wrongBotData=signFields([
 ['auth_date',String(nowSeconds)],['user',JSON.stringify({id:uid1,first_name:'Synthetic'})]
],wrongToken);
const malformedUserData=signFields([
 ['auth_date',String(nowSeconds)],['user','{not-json']
],token);
for(const [label,initData] of [['wrong-bot-token',wrongBotData],['malformed-user-json',malformedUserData]]){
 const before=outageReads;
 const response=await outageProbe(initData);
 assert.equal(response.status,401,label+' must fail authentication');
 assert.equal(outageReads,before,label+' must fail before D1 access');
}
console.log('PASS phase15 negative auth: wrong bot token and malformed signed user JSON fail before D1');

// Missing hash is an unauthenticated request even when user/auth_date look valid.
// The check must execute before attempting any D1 query.
const missingHash=new URLSearchParams(signed(uid1));
missingHash.delete('hash');
const readsBeforeMissingHash=outageReads;
const missingHashResult=await outageProbe(missingHash.toString());
assert.equal(missingHashResult.status,401,'missing Telegram hash must fail authentication');
assert.equal(outageReads,readsBeforeMissingHash,'missing hash must be rejected before D1');
console.log('PASS phase15 missing hash: rejected before D1 access');

// Regression: missing user identity must be rejected before any database read,
// even when the remaining Telegram fields carry a valid HMAC.
const missingUserData=signFields([['auth_date',String(nowSeconds)]],token);
const readsBeforeMissingUser=outageReads;
const missingUserResult=await outageProbe(missingUserData);
assert.equal(missingUserResult.status,401,'signed initData without user must fail authentication');
assert.equal(outageReads,readsBeforeMissingUser,'missing user must not access D1');
console.log('PASS phase15 missing user: signed payload rejected before D1');

// Security regression: a correctly signed but non-numeric Telegram user id
// must not be treated as a trusted owner or reach the D1 query layer.
const invalidOwnerData=signFields([
 ['auth_date',String(nowSeconds)],
 ['user',JSON.stringify({id:'1 OR 1=1',first_name:'Synthetic'})]
],token);
const readsBeforeInvalidOwner=outageReads;
const invalidOwnerResult=await outageProbe(invalidOwnerData);
assert.equal(invalidOwnerResult.status,401,'non-numeric signed Telegram owner must be rejected');
assert.equal(outageReads,readsBeforeInvalidOwner,'invalid owner must be rejected before D1');
console.log('PASS phase15 invalid owner: signed non-numeric user id rejected before D1');


// Boundary regression: signed but invalid Telegram IDs must never reach D1.
// Avoid assuming that a valid HMAC implies a valid owner identity.
for (const [label, id] of [
 ['zero', 0], ['negative', -1], ['fractional', 1.5],
 ['null', null], ['boolean', true], ['empty-string', ''],
 ['array', [uid1]], ['object', {id: uid1}]
]) {
 const payload=signFields([
  ['auth_date',String(nowSeconds)],
  ['user',JSON.stringify({id,first_name:'Synthetic'})]
 ],token);
 const readsBefore=outageReads;
 const response=await outageProbe(payload);
 assert.equal(response.status,401,'signed invalid owner '+label+' must be rejected');
 assert.equal(outageReads,readsBefore,'signed invalid owner '+label+' must not query D1');
}
console.log('PASS phase15 signed owner boundaries: eight invalid ID shapes rejected before D1');

// Regression: an outage on a second valid signed account must not fall back
// to the first account's cached result or silently report success.
const readsBeforeSecondOwnerOutage=outageReads;
const secondOwnerOutage=await outageProbe(signed(uid2));
assert.ok(outageReads>readsBeforeSecondOwnerOutage,
 'second signed owner must attempt its own D1 read during outage');
assert.ok(secondOwnerOutage.status>=500 && secondOwnerOutage.status<=599,
 'second signed owner must fail closed during D1 outage');
assert.ok(!secondOwnerOutage.body.includes('SYNTHETIC_D1_READ_LIMIT_PRIVATE_MARKER'),
 'second owner outage must not expose database internals');
console.log('PASS phase15 second owner outage: fail-closed without stale cross-user response');

// A signed display name is untrusted text; it must never alter the owner binding.
// The ID is valid, while the display name contains SQL-like input.
const hostileDisplayName=signFields([
 ['auth_date',String(nowSeconds)],
 ['user',JSON.stringify({id:uid2,first_name:"' OR 1=1 --"})]
],token);
const beforeHostileName=queries.length;
const hostileNameResult=await progress(hostileDisplayName);
assert.equal(hostileNameResult.status,200,'signed owner with hostile display name should authenticate');
assert.deepEqual(hostileNameResult.data.tasks,data.get(uid2),
 'untrusted display name must not affect owner-scoped task metrics');
const hostileTaskQueries=queries.slice(beforeHostileName).filter(q=>q.sql.includes('FROM candidate_tasks_v1'));
assert.equal(hostileTaskQueries.length,1,'one task metrics read expected');
assert.equal(hostileTaskQueries[0].bound[0],uid2,'owner ID must remain parameter-bound');
assert.ok(hostileTaskQueries[0].sql.includes('WHERE telegram_id=?'));
console.log('PASS phase15 untrusted display name: SQL-like input cannot change task owner scope');


// Concurrent signed-owner isolation regression (synthetic identities only).
// Simultaneous requests must never share a mutable owner context across awaits.
const concurrentOwners=[uid1,uid2,uid2,uid1,uid1,uid2];
const concurrentStart=queries.length;
const concurrentResults=await Promise.all(concurrentOwners.map(id=>progress(signed(id))));
for(let i=0;i<concurrentOwners.length;i++){
 assert.equal(concurrentResults[i].status,200,'concurrent signed request must succeed');
 assert.deepEqual(concurrentResults[i].data.tasks,data.get(concurrentOwners[i]),
  'concurrent response must contain only its authenticated owner metrics');
}
const concurrentTaskQueries=queries.slice(concurrentStart).filter(q=>q.sql.includes('FROM candidate_tasks_v1'));
assert.equal(concurrentTaskQueries.length,concurrentOwners.length,
 'each concurrent request must perform a separate owner-scoped task query');
assert.deepEqual(concurrentTaskQueries.map(q=>q.bound[0]).sort(),
 [...concurrentOwners].sort(),'concurrent SQL owner bindings must match the signed requests');
assert.ok(concurrentTaskQueries.every(q=>q.sql.includes('WHERE telegram_id=?')),
 'concurrent task SQL must remain parameterized and owner-scoped');
console.log('PASS phase15 concurrent signed accounts: owner-bound task progress remains isolated');


// Zero-task owner regression (2026-11-11): the isolated D1 currently contains
// no task rows. A newly signed user must receive explicit zero metrics rather
// than a 500, undefined fields, or a previous owner's cached task totals.
const emptyOwner=9106150099;
const beforeEmptyOwner=queries.length;
const emptyResult=await progress(signed(emptyOwner));
assert.equal(emptyResult.status,200,'signed owner without tasks must get an overview');
assert.deepEqual(emptyResult.data.tasks,{total:0,completed:0,doing:0,overdue:0},
 'empty owner must receive numeric zero task metrics, never another owner metrics');
const emptyReads=queries.slice(beforeEmptyOwner).filter(q=>q.sql.includes('FROM candidate_tasks_v1'));
assert.equal(emptyReads.length,1,'empty owner must trigger one owner-scoped task read');
assert.equal(emptyReads[0].bound[0],emptyOwner,'empty task read must bind signed owner');
const afterEmpty=await progress(signed(uid1));
assert.deepEqual(afterEmpty.data.tasks,data.get(uid1),
 'empty-owner request must not overwrite next signed owner metrics');
console.log('PASS phase15 zero-task owner: explicit zero metrics and no stale cross-user result');
// Rollback: revert this test-only commit. No Worker/D1 changes.
