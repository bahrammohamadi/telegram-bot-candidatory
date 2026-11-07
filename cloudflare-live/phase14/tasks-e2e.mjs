import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import worker from './dist/integration-tasks-worker.mjs';

const sqlite=new DatabaseSync(':memory:');
sqlite.exec(readFileSync(new URL('../integration-schema.sql',import.meta.url),'utf8'));
sqlite.exec(readFileSync(new URL('./tasks-migration.sql',import.meta.url),'utf8'));
const DB={
 prepare(sql){
  const statement=sqlite.prepare(sql);
  return {
   bind(...params){return {
    async first(){return statement.get(...params)||null},
    async all(){return {results:statement.all(...params)}},
    async run(){const r=statement.run(...params);return {meta:{changes:r.changes}}}
   }},
   async first(){return statement.get()||null},
   async all(){return {results:statement.all()}},
   async run(){const r=statement.run();return {meta:{changes:r.changes}}}
  };
 },
 async batch(statements){
  sqlite.exec('BEGIN');
  try{const results=[];for(const st of statements)results.push(await st.run());sqlite.exec('COMMIT');return results}
  catch(e){sqlite.exec('ROLLBACK');throw e}
 }
};
const token='123456789:SYNTHETIC_TASKS_TOKEN';
const user=9106140001,pro=9106140002,other=9106140003;
function signed(id){
 const p=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id,first_name:'Synthetic'}),signature:'synthetic'});
 const msg=[...p.entries()].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>k+'='+v).join('\n');
 const key=createHmac('sha256','WebAppData').update(token).digest();
 p.set('hash',createHmac('sha256',key).update(msg).digest('hex'));
 return p.toString();
}
const env={DB,TELEGRAM_BOT_TOKEN:token};
async function call(identity,action,data={}){
 const initData=identity==='invalid'?'invalid':signed(identity);
 const r=await worker.fetch(new Request('https://tasks.synthetic/api/tasks',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData,action,...data})}),env);
 return {status:r.status,data:await r.json()};
}
const sample={title:'Synthetic meeting follow-up',details:'This is fictional training data',priority:'high',due_date:'2020-01-01'};
assert.equal((await call('invalid','list')).status,401);
assert.equal((await call('invalid','create',sample)).status,401);
assert.equal((await call(user,'list')).data.tasks.length,0);
const base=(await call(user,'summary')).data;
assert.equal(base.plan,'free');assert.equal(base.limit,10);assert.equal(base.remaining,10);
assert.equal((await call(user,'create',{...sample,title:'x'})).status,400);
assert.equal((await call(user,'create',{...sample,priority:'critical'})).status,400);
assert.equal((await call(user,'create',{...sample,due_date:'2026-02-30'})).status,400);
assert.equal((await call(user,'create',{...sample,due_date:'2026-13-01'})).status,400);
const created=await call(user,'create',sample);
assert.equal(created.status,201,JSON.stringify(created));
assert.match(created.data.id,/^[0-9a-f-]{36}$/);
let list=(await call(user,'list')).data.tasks;
assert.equal(list.length,1);assert.equal(list[0].is_overdue,1);
assert.equal(list[0].priority,'high');
const taskId=created.data.id;
const summary=(await call(user,'summary')).data;
assert.equal(summary.summary.total,1);assert.equal(summary.summary.overdue,1);
assert.equal((await call(other,'list')).data.tasks.length,0,'isolate task lists');
assert.equal((await call(other,'summary')).data.summary.total,0,'isolate summaries');
assert.equal((await call(other,'update',{...sample,id:taskId,title:'Unauthorized edit'})).status,404);
assert.equal((await call(other,'status',{id:taskId,status:'done'})).status,404);
assert.equal((await call(other,'delete',{id:taskId})).status,404);
assert.equal((await call(user,'status',{id:taskId,status:'bogus'})).status,400);
assert.equal((await call(user,'status',{id:taskId,status:'doing'})).status,200);
assert.equal((await call(user,'status',{id:taskId,status:'done'})).status,200);
list=(await call(user,'list')).data.tasks;
assert.equal(list[0].status,'done');assert.equal(list[0].is_overdue,0);assert.ok(list[0].done_at);
assert.equal((await call(user,'status',{id:taskId,status:'open'})).status,200);
assert.equal((await call(user,'list')).data.tasks[0].done_at,null);
const newFields={...sample,id:taskId,title:'Updated synthetic follow-up',due_date:'',priority:'low'};
assert.equal((await call(user,'update',newFields)).status,200);
list=(await call(user,'list')).data.tasks;
assert.equal(list[0].title,newFields.title);
assert.equal(list[0].priority,'low');assert.equal(list[0].due_date,null);
for(let i=1;i<10;i++)assert.equal((await call(user,'create',{...sample,title:'Free synthetic task '+i})).status,201);
assert.equal((await call(user,'summary')).data.summary.total,10);
const denied=await call(user,'create',sample);
assert.equal(denied.status,429);assert.equal(denied.data.error,'TASK_QUOTA_LIMIT');
assert.throws(()=>sqlite.prepare("INSERT INTO candidate_tasks_v1(id,telegram_id,title,details,priority,status) VALUES(?,?,'Direct bypass','', 'normal','open')").run('00000000-0000-4000-8000-000000001401',user),/TASK_QUOTA_LIMIT/,'direct SQL insert bypass blocked');
assert.equal((await call(user,'update',{...newFields,title:'Editing after limit'})).status,200,'editing allowed at limit');
assert.equal((await call(user,'delete',{id:taskId})).status,200);
assert.equal((await call(user,'create',sample)).status,201,'deletion frees a slot');
sqlite.prepare("INSERT INTO candidate_users(telegram_id,display_name) VALUES(?,'Synthetic Professional')").run(pro);
sqlite.prepare("INSERT INTO candidate_subscriptions_v2(telegram_id,plan_id,status,expires_at,source) VALUES(?,'professional','active',datetime('now','+30 days'),'admin')").run(pro);
assert.equal((await call(pro,'summary')).data.limit,100);
for(let i=0;i<11;i++)assert.equal((await call(pro,'create',{...sample,title:'Pro test task '+i})).status,201);
assert.equal((await call(pro,'summary')).data.summary.total,11);
sqlite.prepare("UPDATE candidate_subscriptions_v2 SET expires_at='2000-01-01 00:00:00' WHERE telegram_id=?").run(pro);
assert.equal((await call(pro,'summary')).data.limit,10);
assert.equal((await call(pro,'summary')).data.remaining,0);
assert.equal((await call(pro,'create',sample)).status,429,'expired pro cannot insert');
assert.equal((await call(pro,'list')).data.tasks.length,11,'existing tasks remain visible');
const forged=new URLSearchParams(signed(pro));forged.set('signature','forged');
const r=await worker.fetch(new Request('https://tasks.synthetic/api/tasks',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData:forged.toString(),action:'summary'})}),env);
assert.equal(r.status,401,'forged Telegram identity rejected');
sqlite.close();
console.log('PASS tasks: signed identity, full CRUD, overdue Tehran date, strict date checks, owner isolation, DB quota, expiry, read access after downgrade');
