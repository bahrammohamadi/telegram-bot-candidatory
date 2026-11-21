import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.mjs';

// Offline behavioral regression: signed synthetic Telegram initData and an in-memory D1 spy.
// Never calls a live URL or a real database.
const token='offline-invalid-write-regression';
const enc=new TextEncoder();
async function signed(){
 const data=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id:732001,first_name:'Synthetic'})});
 const check=[...data].sort(([a],[b])=>a.localeCompare(b,'en')).map(([k,v])=>k+'='+v).join('\n');
 const key=async bytes=>crypto.subtle.importKey('raw',bytes,{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const secret=await crypto.subtle.sign('HMAC',await key(enc.encode('WebAppData')),enc.encode(token));
 const hash=await crypto.subtle.sign('HMAC',await key(secret),enc.encode(check));
 data.set('hash',[...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join(''));
 return data.toString();
}
function spy(){
 const statements=[];
 return {statements,DB:{prepare(sql){
  statements.push(sql);
  const stmt={bind(){return stmt;},async run(){return {meta:{changes:1}};},async all(){return {results:[]};},async first(){return null;}};
  return stmt;
 }}};
}
for(const [path,method,payload,status] of [
 ['/api/profile','POST',{full_name:123,election_type:'',constituency:'',occupation:''},400],
 ['/api/tasks','POST',{title:'  '},400],
 ['/api/courses/complete','POST',{courseId:'not-a-course',answer:0},400],
 ['/api/assessment-v2/submit','POST',{answers:[]},400],
 ['/api/tasks/synthetic-id','PATCH',{status:'invalid'},400],
 ['/api/unknown','POST',{anything:true},404]
]){
 test(`invalid ${method} ${path} never prepares D1 writes`,async()=>{
  const s=spy();
  const response=await worker.fetch(new Request('https://synthetic.invalid'+path,{
   method,headers:{'X-Telegram-Init-Data':await signed(),'content-type':'application/json'},
   body:JSON.stringify(payload)
  }),{DB:s.DB,TELEGRAM_BOT_TOKEN:token});
  assert.equal(response.status,status);
  assert.equal(s.statements.length,0,`unexpected D1 SQL: ${s.statements.join('; ')}`);
 });
}

for(const [path,method] of [
 ['/api/profile','POST'],
 ['/api/tasks','POST'],
 ['/api/courses/complete','POST'],
 ['/api/assessment-v2/submit','POST'],
 ['/api/tasks/synthetic-id','PATCH']
]){
 test(`malformed JSON ${method} ${path} must not prepare D1 SQL`,async()=>{
  const s=spy();
  const response=await worker.fetch(new Request('https://synthetic.invalid'+path,{
   method,headers:{'X-Telegram-Init-Data':await signed(),'content-type':'application/json'},
   body:'{"broken":'
  }),{DB:s.DB,TELEGRAM_BOT_TOKEN:token});
  assert.ok(response.status>=400,`malformed JSON unexpectedly accepted: ${response.status}`);
  assert.equal(s.statements.length,0,`unexpected D1 SQL: ${s.statements.join('; ')}`);
 });
}
