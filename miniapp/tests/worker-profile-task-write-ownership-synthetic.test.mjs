import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.mjs';

// Offline-only regression against the real handler. No external network, D1 or deployment.
const token='synthetic-profile-task-ownership';
const enc=new TextEncoder();
async function signed(id){
 const data=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id,first_name:'Fixture'})});
 const check=[...data].sort(([a],[b])=>a.localeCompare(b,'en')).map(([k,v])=>k+'='+v).join('\n');
 const key=async bytes=>crypto.subtle.importKey('raw',bytes,{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const secret=await crypto.subtle.sign('HMAC',await key(enc.encode('WebAppData')),enc.encode(token));
 const hash=await crypto.subtle.sign('HMAC',await key(secret),enc.encode(check));
 data.set('hash',[...new Uint8Array(hash)].map(v=>v.toString(16).padStart(2,'0')).join(''));
 return data.toString();
}
function dbSpy(){
 const calls=[];
 return {calls,DB:{prepare(sql){
  const call={sql,args:[]};calls.push(call);
  const stmt={bind(...args){call.args=args;return stmt;},async run(){return {meta:{changes:1}};},async first(){return null;},async all(){return {results:[]}}};
  return stmt;
 }}};
}
async function post(path,id,payload,spy){
 return worker.fetch(new Request('https://synthetic.invalid'+path,{
  method:'POST',headers:{'X-Telegram-Init-Data':await signed(id),'content-type':'application/json','X-Telegram-User-Id':'999999'},
  body:JSON.stringify(payload)
 }),{DB:spy.DB,TELEGRAM_BOT_TOKEN:token});
}
test('profile upsert is bound to verified Telegram identity, not spoofed body/header',async()=>{
 const spy=dbSpy(),id=313;
 const response=await post('/api/profile',id,{full_name:'Fixture',election_type:'local',constituency:'demo',occupation:'tester',telegram_id:'999999'},spy);
 assert.equal(response.status,200);
 const q=spy.calls.find(c=>c.sql.startsWith('INSERT INTO profile'));
 assert.ok(q,'profile write must occur');
 assert.match(q.sql,/profile\(telegram_id,/);
 assert.equal(q.args[0],String(id));
 assert.ok(!q.args.includes('999999'));
});
test('new task owner is signed user despite client supplied telegram_id',async()=>{
 const spy=dbSpy(),id=414;
 const response=await post('/api/tasks',id,{title:'Synthetic task',telegram_id:'999999'},spy);
 assert.equal(response.status,201);
 const q=spy.calls.find(c=>c.sql.startsWith('INSERT INTO tasks'));
 assert.ok(q);
 assert.match(q.sql,/tasks\(id,telegram_id,title\)/);
 assert.equal(q.args[1],String(id));
 assert.equal(q.args[2],'Synthetic task');
});
test('invalid task input never reaches task INSERT',async()=>{
 const spy=dbSpy();
 const response=await post('/api/tasks',515,{title:'   ',telegram_id:'999999'},spy);
 assert.equal(response.status,400);
 assert.equal(spy.calls.some(c=>c.sql.startsWith('INSERT INTO tasks')),false);
});
