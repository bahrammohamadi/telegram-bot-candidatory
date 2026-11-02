import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {seedQuizzes} from '../phase6/quiz-seed.mjs';
import worker from './dist/integration-entitlements-worker.mjs';

const sqlite=new DatabaseSync(':memory:');
for(const sqlPath of ['../integration-schema.sql','../phase5/practice-migration.sql','../phase6/quiz-migration.sql','../phase9/studio-migration.sql','../phase10/membership-migration.sql','./demo-quotas-migration.sql'])sqlite.exec(readFileSync(new URL(sqlPath,import.meta.url),'utf8'));
const DB={
 prepare(sql){const statement=sqlite.prepare(sql);return {
   bind(...params){return {async first(){return statement.get(...params)||null},async all(){return {results:statement.all(...params)}},async run(){const r=statement.run(...params);return {meta:{changes:r.changes}}}}},
   async first(){return statement.get()||null},
   async all(){return {results:statement.all()}},
   async run(){const r=statement.run();return {meta:{changes:r.changes}}
   }
 }},
 async batch(statements){sqlite.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());sqlite.exec('COMMIT');return result}catch(e){sqlite.exec('ROLLBACK');throw e}}
};
await seedQuizzes(DB);
const token='123456789:SYNTHETIC_SIGNING_ONLY_NOT_A_REAL_BOT';
const freeId=9100110101,proId=9100110102,otherId=9100110103;
function signed(id){
 const p=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id,first_name:'Synthetic'}),signature:'synthetic_signature'});
 const txt=[...p.entries()].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>k+'='+v).join('\n');
 const key=createHmac('sha256','WebAppData').update(token).digest();
 p.set('hash',createHmac('sha256',key).update(txt).digest('hex'));
 return p.toString();
}
const env={DB,TELEGRAM_BOT_TOKEN:token};
async function call(id,path,action,fields={}){
 const initData=id==='invalid'?'invalid':signed(id);
 const response=await worker.fetch(new Request('https://quota.synthetic/api/'+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData,action,...fields})}),env);
 return {status:response.status,data:await response.json()};
}
function assertLimited(r,resource){
 assert.equal(r.status,429,JSON.stringify(r));
 assert.equal(r.data.code,'PLAN_LIMIT_REACHED');
 assert.equal(r.data.resource,resource);
 assert.equal(r.data.real_payments_enabled,false);
}
assert.equal((await call('invalid','entitlements','status')).status,401);
let free=await call(freeId,'entitlements','status');
assert.equal(free.status,200);assert.equal(free.data.plan,'free');
assert.deepEqual(free.data.limits,{goals:5,calendar:10,practice:10,studio:3,quiz_daily:2});
assert.equal(free.data.remaining.goals,5);
assert.equal(free.data.real_payments_enabled,false);

const goal={title:'Synthetic sample goal',details:'Only synthetic data',target_date:''};
for(let i=0;i<5;i++)assert.equal((await call(freeId,'goals','create',{...goal,title:'Synthetic goal '+i})).status,201);
assertLimited(await call(freeId,'goals','create',goal),'goals');
assert.equal((await call(freeId,'goals','list')).data.goals.length,5);
assert.throws(()=>sqlite.prepare("INSERT INTO personal_goals_v2(id,telegram_id,title,status) VALUES(?,?,'Direct bypass attempt','open')").run('00000000-0000-4000-8000-000000001111',freeId),/DEMO_QUOTA_GOALS/,'database trigger prevents concurrent bypass');
let freeStatus=(await call(freeId,'entitlements','status')).data;
assert.equal(freeStatus.usage.goals,5);assert.equal(freeStatus.remaining.goals,0);
const goalId=(await call(freeId,'goals','list')).data.goals[0].id;
assert.equal((await call(freeId,'goals','delete',{id:goalId})).status,200,'delete still allowed');
assert.equal((await call(freeId,'goals','create',goal)).status,201,'slot available after deletion');

const event={title:'Synthetic calendar event',starts_at:'2026-11-03T10:00',notes:''};
for(let i=0;i<10;i++)assert.equal((await call(freeId,'calendar','create',{...event,title:'Synthetic calendar event '+i})).status,201);
assertLimited(await call(freeId,'calendar','create',event),'calendar');

const practice={exercise_key:'speech_clear',response_text:'Synthetic practice response for neutral education',reflection:'Clarity could improve',self_score:4,duration_seconds:80};
for(let i=0;i<10;i++)assert.equal((await call(freeId,'practice','create',practice)).status,201);
assertLimited(await call(freeId,'practice','create',practice),'practice');

const draft={kind:'service_update',title:'Synthetic factual notice',body:'Sample public information for verification only.',source_url:'',status:'draft'};
for(let i=0;i<3;i++)assert.equal((await call(freeId,'studio','create',{...draft,title:'Synthetic notice '+i})).status,201);
assertLimited(await call(freeId,'studio','create',draft),'studio');
const drafts=(await call(freeId,'studio','list')).data.drafts;
assert.equal(drafts.length,3);
assert.equal((await call(freeId,'studio','update',{...draft,id:drafts[0].id,title:'Revised synthetic notice'})).status,200,'editing remains accessible when free limit reached');

async function quizAnswers(quizId){
 const start=await call(freeId,'quiz','start',{quiz_id:quizId});
 assert.equal(start.status,200);
 return Object.fromEntries(start.data.questions.map(q=>[q.id,0]));
}
const quizA=await quizAnswers(91001),quizB=await quizAnswers(91002);
assert.equal((await call(freeId,'quiz','submit',{quiz_id:91001,answers:quizA})).status,201);
assert.equal((await call(freeId,'quiz','submit',{quiz_id:91002,answers:quizB})).status,201);
assertLimited(await call(freeId,'quiz','submit',{quiz_id:91001,answers:quizA}),'quiz_daily');
assert.equal((await call(freeId,'quiz','history')).data.attempts.length,2);
assert.equal((await call(otherId,'entitlements','status')).data.usage.goals,0,'cross-user stats private');
assert.equal((await call(otherId,'goals','list')).data.goals.length,0,'other user's data never listed');

sqlite.prepare("INSERT INTO candidate_users(telegram_id,display_name) VALUES(?,'Synthetic professional user')").run(proId);
sqlite.prepare("INSERT INTO candidate_subscriptions_v2(telegram_id,plan_id,status,expires_at,source) VALUES(?,'professional','active',datetime('now','+30 days'),'admin')").run(proId);
let pro=await call(proId,'entitlements','status');
assert.equal(pro.data.plan,'professional');
assert.equal(pro.data.limits.goals,100);
assert.equal(pro.data.remaining.practice,200);
for(let i=0;i<6;i++)assert.equal((await call(proId,'goals','create',{...goal,title:'Professional synthetic goal '+i})).status,201);
const proAnswers=Object.fromEntries((await call(proId,'quiz','start',{quiz_id:91001})).data.questions.map(q=>[q.id,0]));
for(let i=0;i<3;i++)assert.equal((await call(proId,'quiz','submit',{quiz_id:91001,answers:proAnswers})).status,201,'professional elevated daily quota');
sqlite.prepare("UPDATE candidate_subscriptions_v2 SET expires_at='2000-01-01 00:00:00' WHERE telegram_id=?").run(proId);
pro=await call(proId,'entitlements','status');
assert.equal(pro.data.plan,'free','expired plan has free limits');
assert.equal(pro.data.usage.goals,6);
assert.equal(pro.data.remaining.goals,0);
assertLimited(await call(proId,'goals','create',goal),'goals');
assertLimited(await call(proId,'quiz','submit',{quiz_id:91001,answers:proAnswers}),'quiz_daily');
const spoof=await call(freeId,'goals','create',{...goal,plan_id:'professional',is_admin:true});
assertLimited(spoof,'goals');
const altered=new URLSearchParams(signed(proId));altered.set('signature','forged');
const tampered=await worker.fetch(new Request('https://quota.synthetic/api/entitlements',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData:altered.toString(),action:'status'})}),env);
assert.equal(tampered.status,401);
assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM candidate_subscriptions_v2 WHERE plan_id='professional'").get().n,1);
sqlite.close();
console.log('PASS quotas: authenticated free/pro levels, expiry downgrade, DB trigger, independent limits, edits/deletes, daily quiz caps, cross-user privacy and tampering');
