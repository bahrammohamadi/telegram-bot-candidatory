import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import worker from './dist/integration-admin-console-worker.mjs';

const sqlite=new DatabaseSync(':memory:');
for(const file of ['../integration-schema.sql','../phase10/membership-migration.sql'])sqlite.exec(readFileSync(new URL(file,import.meta.url),'utf8'));
const DB={
 prepare(sql){const statement=sqlite.prepare(sql);return {
   bind(...args){return {async first(){return statement.get(...args)||null},async all(){return {results:statement.all(...args)}},async run(){const v=statement.run(...args);return {meta:{changes:v.changes}}}}},
   async first(){return statement.get()||null},async all(){return {results:statement.all()}},async run(){const v=statement.run();return {meta:{changes:v.changes}}}
 }},
 async batch(statements){sqlite.exec('BEGIN');try{const out=[];for(const statement of statements)out.push(await statement.run());sqlite.exec('COMMIT');return out}catch(e){sqlite.exec('ROLLBACK');throw e}}
};
const token='123456789:ONLY_SYNTHETIC_TEST_SECRET';
const ids={admin1:9103400001,admin2:9103400002,user:9103400003,other:9103400004};
const env={DB,TELEGRAM_BOT_TOKEN:token,CANDIDATORY_TEST_ADMIN_IDS:ids.admin1+','+ids.admin2};
function signed(id){
 const p=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id,first_name:'Synthetic'}),signature:'synthetic-ed25519-field'});
 const msg=[...p.entries()].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>k+'='+v).join('\n');
 const key=createHmac('sha256','WebAppData').update(token).digest();
 p.set('hash',createHmac('sha256',key).update(msg).digest('hex'));return p.toString();
}
async function call(id,action,details={},override=env){
 const response=await worker.fetch(new Request('https://admin.synthetic/api/admin-console',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData:id==='invalid'?'invalid':signed(id),action,...details})}),override);
 return {status:response.status,body:await response.json()};
}
for(const i of Object.values(ids))sqlite.prepare('INSERT INTO candidate_users(telegram_id,display_name) VALUES(?,?)').run(i,'Synthetic account');
function makeRequest(id,user,status,created,admin=null){
 sqlite.prepare('INSERT INTO manual_payment_requests_v2(id,telegram_id,plan_id,reference,receipt_file_id,status,admin_id,reviewed_at,created_at) VALUES(?,?,"professional",?,"SIMULATED_NO_FILE",?,?,?,?)').run(id,user,'DEMO-'+id.slice(-6),status,admin,status==='pending'?null:created,created);
}
const r1='00000000-0000-4000-8000-000000002201',r2='00000000-0000-4000-8000-000000002202',r3='00000000-0000-4000-8000-000000002203';
makeRequest(r1,ids.user,'pending','2026-11-02 09:00:00');
makeRequest(r2,ids.other,'approved','2026-11-02 10:00:00',ids.admin1);
makeRequest(r3,ids.user,'rejected','2026-11-02 11:00:00',ids.admin2);
sqlite.prepare("INSERT INTO admin_audit(id,actor_id,action,record_type,record_id,detail,created_at) VALUES(?,?,?,?,?,?,?)").run(r2,ids.admin1,'demo_approve','demo_request',r2,'ISOLATED_TEST_NO_REAL_PAYMENT','2026-11-02 10:00:00');
sqlite.prepare("INSERT INTO admin_audit(id,actor_id,action,record_type,record_id,detail,created_at) VALUES(?,?,?,?,?,?,?)").run(r3,ids.admin2,'demo_reject','demo_request',r3,'ISOLATED_TEST_NO_REAL_PAYMENT','2026-11-02 11:00:00');
sqlite.prepare("INSERT INTO candidate_subscriptions_v2(telegram_id,plan_id,status,expires_at,source) VALUES(?,'professional','active',datetime('now','+30 days'),'admin')").run(ids.other);
assert.equal((await call('invalid','overview')).status,401);
assert.equal((await call(ids.user,'overview')).status,403);
assert.equal((await call(ids.user,'requests',{status:'all'})).status,403);
assert.equal((await call(ids.user,'audit')).status,403);
assert.equal((await call(ids.admin1,'overview',{}, {...env,CANDIDATORY_TEST_ADMIN_IDS:undefined})).status,403);
assert.equal((await call(ids.admin1,'overview',{}, {...env,CANDIDATORY_TEST_ADMIN_IDS:String(ids.admin1)})).status,403);
assert.equal((await call(ids.admin1,'overview',{}, {...env,CANDIDATORY_TEST_ADMIN_IDS:ids.admin1+','+ids.admin1})).status,403);
assert.equal((await call(ids.admin1,'overview',{}, {...env,CANDIDATORY_TEST_ADMIN_IDS:ids.admin1+','+ids.admin2+','+ids.user})).status,403);
const overview=await call(ids.admin1,'overview');
assert.equal(overview.status,200,JSON.stringify(overview));
assert.deepEqual(overview.body.requests,{total:3,pending:1,approved:1,rejected:1});
assert.equal(overview.body.decisions_logged,2);
assert.equal(overview.body.demo_professional_accounts,1);
assert.equal(overview.body.real_payments_enabled,false);
assert.equal(overview.body.receipt_upload_available,false);
assert.equal(overview.body.test_accounts,4);
assert.equal((await call(ids.admin2,'overview')).status,200,'second admin authorized');
const statuses=['all','pending','approved','rejected'];
for(const status of statuses){
 const result=await call(ids.admin2,'requests',{status});
 assert.equal(result.status,200,JSON.stringify(result));
 assert.equal(result.body.requests.length,status==='all'?3:1);
 assert.equal(result.body.requests.every(x=>x.status===status||status==='all'),true);
 assert.equal(result.body.requests.every(x=>x.receipt_file_id===undefined),true,'no receipt information exposed');
}
assert.equal((await call(ids.admin1,'requests',{status:'pending',limit:1,offset:0})).body.requests.length,1);
assert.equal((await call(ids.admin1,'requests',{status:'invalid'})).status,400);
const audit=(await call(ids.admin1,'audit',{limit:20})).body.entries;
assert.equal(audit.length,2);
assert.equal(audit.every(x=>x.record_id===r2||x.record_id===r3),true);
assert.equal((await call(ids.admin1,'verify')).body.reviewed_without_audit,0);
sqlite.prepare('DELETE FROM admin_audit WHERE id=?').run(r3);
assert.equal((await call(ids.admin2,'verify')).body.reviewed_without_audit,1);
assert.equal((await call(ids.admin1,'admin_decide',{id:r1,decision:'approved'})).status,400,'console is read-only');
assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM manual_payment_requests_v2').get().n,3,'console must not mutate data');
const forged=new URLSearchParams(signed(ids.admin1));forged.set('signature','tampered');
const forgedRes=await worker.fetch(new Request('https://admin.synthetic/api/admin-console',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData:forged.toString(),action:'overview'})}),env);
assert.equal(forgedRes.status,401);
sqlite.close();
console.log('PASS admin console: two admins only, no secret fail-open, overview, filters, audit, missing audit diagnostic, no real receipts, no mutation, tamper denial');
