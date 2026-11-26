import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import worker from './dist/integration-membership-worker.mjs';

const sql=new DatabaseSync(':memory:');
sql.exec(readFileSync(new URL('../integration-schema.sql',import.meta.url),'utf8'));
sql.exec(readFileSync(new URL('./membership-migration.sql',import.meta.url),'utf8'));
const DB={
 prepare(query){const st=sql.prepare(query);return {
  bind(...params){return {async first(){return st.get(...params)||null},async all(){return {results:st.all(...params)}},async run(){const r=st.run(...params);return {meta:{changes:r.changes}}}}},
  async first(){return st.get()||null},
  async all(){return {results:st.all()}},
  async run(){const r=st.run();return {meta:{changes:r.changes}}}
 }},
 async batch(stmts){
  sql.exec('BEGIN');
  try{const results=[];for(const statement of stmts)results.push(await statement.run());sql.exec('COMMIT');return results}
  catch(e){sql.exec('ROLLBACK');throw e}
 }
};
const token='123456789:ONLY_SYNTHETIC_TEST_TOKEN';
const adminIds=[9102001001,9102001002],userId=9102001003,otherId=9102001004;
const env={DB,TELEGRAM_BOT_TOKEN:token,CANDIDATORY_TEST_ADMIN_IDS:adminIds.join(',')};
function signed(id){
 const p=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id,first_name:'Synthetic'}),signature:'synthetic-ed25519-data'});
 const txt=[...p.entries()].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>k+'='+v).join('\n');
 const key=createHmac('sha256','WebAppData').update(token).digest();
 p.set('hash',createHmac('sha256',key).update(txt).digest('hex'));
 return p.toString();
}
async function call(id,action,data={},override=env){
 const initData=id==='invalid'?'bad':signed(id);
 const response=await worker.fetch(new Request('https://synthetic.test/api/membership',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData,action,...data})}),override);
 return {status:response.status,body:await response.json()};
}
assert.equal((await call('invalid','status')).status,401);
const anon=await call(userId,'status');
assert.equal(anon.status,200);assert.equal(anon.body.plan,'free');assert.equal(anon.body.is_admin,false);
assert.equal(anon.body.real_payments_enabled,false);
assert.equal(anon.body.receipt_upload_available,false);
assert.equal(anon.body.duration_days,30);
assert.equal(anon.body.price_toman,6900000);
assert.equal((await call(userId,'admin_queue')).status,403);
assert.equal((await call(adminIds[0],'status',{}, {...env,CANDIDATORY_TEST_ADMIN_IDS:undefined})).body.is_admin,false,'unset secret fails closed');
assert.equal((await call(adminIds[0],'admin_queue',{}, {...env,CANDIDATORY_TEST_ADMIN_IDS:adminIds.join(',')+','+userId})).status,403,'exactly two admin IDs required');
const req=await call(userId,'demo_request');
assert.equal(req.status,201,JSON.stringify(req));
assert.match(req.body.reference,/^DEMO-/);
assert.equal((await call(userId,'demo_request')).status,409,'one pending demo request per user');
assert.equal((await call(otherId,'status')).body.requests.length,0,'other user cannot view request');
assert.equal((await call(userId,'admin_decide',{id:req.body.id,decision:'approved'})).status,403,'cannot self-approve');
const queue=await call(adminIds[0],'admin_queue');
assert.equal(queue.status,200);assert.equal(queue.body.requests.length,1);
assert.equal((await call(adminIds[0],'admin_decide',{id:req.body.id,decision:'approved'})).status,200);
const after=await call(userId,'status');
assert.equal(after.body.plan,'professional','demo subscription granted only after admin decision');
assert.equal(after.body.subscription.source,'admin');
assert.equal(after.body.requests[0].status,'approved');
assert.equal((await call(adminIds[0],'admin_decide',{id:req.body.id,decision:'approved'})).status,409,'approval must not be repeated');
assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM admin_audit WHERE record_type='demo_request'").get().n,1,'one audit event');
const another=await call(otherId,'demo_request');
assert.equal(another.status,201);
assert.equal((await call(adminIds[1],'admin_queue')).body.requests.length,1,'second admin can see pending');
assert.equal((await call(adminIds[1],'admin_decide',{id:another.body.id,decision:'rejected'})).status,200);
assert.equal((await call(otherId,'status')).body.plan,'free','rejected request must not enable subscription');
assert.equal((await call(userId,'admin_queue')).status,403);
sql.prepare("UPDATE candidate_subscriptions_v2 SET expires_at='2000-01-01 00:00:00' WHERE telegram_id=?").run(userId);
assert.equal((await call(userId,'status')).body.plan,'free','expired plan downgraded on read');
const forged=new URLSearchParams(signed(adminIds[0]));forged.set('signature','forged');
const response=await worker.fetch(new Request('https://synthetic.test/api/membership',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData:forged.toString(),action:'admin_queue'})}),env);
assert.equal(response.status,401,'tampered admin HMAC rejected');
assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM manual_payment_requests_v2 WHERE receipt_file_id='SIMULATED_NO_FILE'").get().n,2);
sql.close();
console.log('PASS membership: simulated requests, exact-two-admin fail closed, manual decisions, audit, expiration, HMAC, owner isolation, no payments or receipts');
