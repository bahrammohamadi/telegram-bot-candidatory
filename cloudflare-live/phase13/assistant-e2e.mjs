import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import worker from './dist/integration-assistant-worker.mjs';

const sqlite=new DatabaseSync(':memory:');
for(const path of ['../integration-schema.sql','./assistant-migration.sql'])sqlite.exec(readFileSync(new URL(path,import.meta.url),'utf8'));
const DB={
 prepare(sql){const stmt=sqlite.prepare(sql);return {
  bind(...args){return {async first(){return stmt.get(...args)||null},async all(){return {results:stmt.all(...args)}},async run(){const r=stmt.run(...args);return {meta:{changes:r.changes}}}}},
  async first(){return stmt.get()||null},async all(){return {results:stmt.all()}},async run(){const r=stmt.run();return {meta:{changes:r.changes}}}
 }},
 async batch(statements){sqlite.exec('BEGIN');try{const res=[];for(const stmt of statements)res.push(await stmt.run());sqlite.exec('COMMIT');return res}catch(e){sqlite.exec('ROLLBACK');throw e}}
};
const token='123456789:THIS_IS_A_SYNTHETIC_TEST_TOKEN';
const free=9107500001,pro=9107500002,other=9107500003;
const noop={DB,TELEGRAM_BOT_TOKEN:token};
let modelInvocations=0;
const mockAi={async run(model,payload){
 modelInvocations++;
 assert.equal(model,'@cf/meta/llama-3.1-8b-instruct-fp8-fast');
 assert.ok(payload.messages.length===2);
 assert.equal(payload.max_tokens,360);
 assert.ok(!JSON.stringify(payload).includes('telegram_id'));
 return {response:'این یک پاسخ آموزشی ساختگی برای آزمون است. منابع رسمی را بررسی کنید.'};
}};
const aiEnv={...noop,AI_ENABLED:'true',AI:mockAi};
function signed(id){
 const p=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id,first_name:'Synthetic'}),signature:'synthetic'});
 const msg=[...p.entries()].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>k+'='+v).join('\n');
 const secret=createHmac('sha256','WebAppData').update(token).digest();
 p.set('hash',createHmac('sha256',secret).update(msg).digest('hex'));
 return p.toString();
}
async function call(id,action,fields={},env=noop){
 const r=await worker.fetch(new Request('https://assistant.synthetic/api/assistant',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData:id==='invalid'?'invalid':signed(id),action,...fields})}),env);
 return {status:r.status,body:await r.json()};
}
assert.equal((await call('invalid','status')).status,401);
let status=await call(free,'status');
assert.equal(status.status,200);assert.equal(status.body.ai_available,false);assert.equal(status.body.mode,'guided_only');
assert.equal(status.body.daily_user_limit,2);
assert.equal(status.body.storing_messages,false);
const guide=await call(free,'guide',{task:'agenda',topic:'جلسه آموزشی آزمایشی'});
assert.equal(guide.status,200);assert.equal(guide.body.engine,'static_guidance_no_ai');assert.equal(guide.body.steps.length,4);
assert.equal((await call(free,'guide',{task:'voter_targeting'})).status,400);
assert.equal((await call(free,'ask',{task:'agenda',question:'یک جلسه عمومی را چگونه برنامه‌ریزی کنیم؟'})).status,503,'AI disabled by default');
assert.equal((await call(free,'status',{}, {...noop,AI_ENABLED:'true'})).body.ai_available,false,'enabled flag without binding must fail closed');
assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM assistant_usage_v1').get().n,0,'guide and disabled AI must be free');
assert.equal((await call(free,'ask',{task:'agenda',question:'contact test@example.org to book a meeting'},aiEnv)).status,400,'email must be rejected');
assert.equal((await call(free,'ask',{task:'agenda',question:'call +989123456789 for details'},aiEnv)).status,400,'phone must be rejected');
assert.equal((await call(free,'ask',{task:'agenda',question:'short'},aiEnv)).status,400,'short question rejected');
const req={task:'agenda',question:'چگونه نتیجه جلسه عمومی را شفاف و کوتاه ثبت کنیم؟'};
for(let i=0;i<2;i++){
 const r=await call(free,'ask',req,aiEnv);
 assert.equal(r.status,200,JSON.stringify(r));
 assert.equal(r.body.engine,'cloudflare_workers_ai');
 assert.match(r.body.answer,/پاسخ آموزشی/);
}
assert.equal(modelInvocations,2);
const third=await call(free,'ask',req,aiEnv);
assert.equal(third.status,429);
assert.equal(third.body.error,'AI_DAILY_LIMIT');
assert.equal(modelInvocations,2,'denied request never invokes AI');
assert.equal((await call(free,'status',{},aiEnv)).body.remaining_today,0);
assert.equal((await call(other,'status',{},aiEnv)).body.used_today,0);
assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM assistant_usage_v1').get().n,2);
assert.equal(sqlite.prepare("SELECT count(*) AS n FROM sqlite_master WHERE type='table' AND name='assistant_messages_v1'").get().n,0);
sqlite.prepare("INSERT INTO candidate_users(telegram_id,display_name) VALUES(?,'Synthetic Pro')").run(pro);
sqlite.prepare("INSERT INTO candidate_subscriptions_v2(telegram_id,plan_id,status,expires_at,source) VALUES(?,'professional','active',datetime('now','+30 days'),'admin')").run(pro);
assert.equal((await call(pro,'status',{},aiEnv)).body.daily_user_limit,6);
for(let i=0;i<6;i++)assert.equal((await call(pro,'ask',req,aiEnv)).status,200);
assert.equal((await call(pro,'ask',req,aiEnv)).status,429,'pro cap six');
sqlite.prepare("UPDATE candidate_subscriptions_v2 SET expires_at='2000-01-01 00:00:00' WHERE telegram_id=?").run(pro);
const expired=await call(pro,'status',{},aiEnv);
assert.equal(expired.body.plan,'free');assert.equal(expired.body.remaining_today,0,'expired pro falls back to free quota');
assert.equal((await call(pro,'ask',req,aiEnv)).status,429);
assert.throws(()=>sqlite.prepare("INSERT INTO assistant_usage_v1(id,telegram_id,day_utc,mode) VALUES(?,?,?,'ai')").run('00000000-0000-4000-8000-000000000100',free,new Date().toISOString().slice(0,10)),/ASSISTANT_USER_DAILY_LIMIT/,'SQL trigger cannot be bypassed');
const altered=new URLSearchParams(signed(free));altered.set('signature','forged');
const forged=await worker.fetch(new Request('https://assistant.synthetic/api/assistant',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData:altered.toString(),action:'status'})}),aiEnv);
assert.equal(forged.status,401);
sqlite.close();
console.log('PASS assistant: signed Telegram, free guide without AI, explicit activation, PII checks, real mock inference, per-plan caps, expired plan, SQL trigger and no message storage');
