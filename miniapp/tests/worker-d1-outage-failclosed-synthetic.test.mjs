import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.mjs';

// Offline only: synthetic Telegram signature and deliberately failing D1.
// Verifies fail-closed responses without contacting Cloudflare or Production.
const token='offline-d1-failure-contract';
const enc=new TextEncoder();
async function signed(){
 const params=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id:8123401,first_name:'Synthetic'})});
 const check=[...params].sort(([a],[b])=>a.localeCompare(b,'en')).map(([k,v])=>k+'='+v).join('\n');
 const key=async b=>crypto.subtle.importKey('raw',b,{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const secret=await crypto.subtle.sign('HMAC',await key(enc.encode('WebAppData')),enc.encode(token));
 const hash=await crypto.subtle.sign('HMAC',await key(secret),enc.encode(check));
 params.set('hash',[...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join(''));
 return params.toString();
}
const cases=[
 ['GET','/api/overview',undefined],
 ['POST','/api/profile',{full_name:'Synthetic',election_type:'test',constituency:'test',occupation:'test'}],
 ['POST','/api/tasks',{title:'Synthetic task'}],
 ['PATCH','/api/tasks/synthetic-id',{status:'done'}]
];
for(const [method,path,payload] of cases){
 test(`D1 outage fails closed: ${method} ${path}`,async()=>{
  let calls=0;
  const DB={prepare(){calls++;throw new Error('SYNTHETIC_DB_SECRET_MARKER');}};
  const res=await worker.fetch(new Request('https://synthetic.invalid'+path,{
   method,headers:{'X-Telegram-Init-Data':await signed(),'content-type':'application/json'},
   ...(payload?{body:JSON.stringify(payload)}:{})
  }),{DB,TELEGRAM_BOT_TOKEN:token});
  assert.equal(res.status,500);
  const body=await res.text();
  assert.doesNotMatch(body,/SYNTHETIC_DB_SECRET_MARKER/);
  assert.doesNotMatch(body,/stack|INSERT INTO|UPDATE tasks/i);
  assert.ok(calls>=1,'expected a D1 access attempt');
 });
}
