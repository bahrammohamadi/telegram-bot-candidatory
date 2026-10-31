import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import assert from 'node:assert/strict';
const db=new DatabaseSync(':memory:');
db.exec(readFileSync(new URL('./integration-schema.sql',import.meta.url),'utf8'));
const source=readFileSync(new URL('./worker.js',import.meta.url),'utf8');
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
// D1-shaped adapter over isolated SQLite; never connects to Cloudflare or Telegram.
const DB={prepare(sql){
 const stmt=db.prepare(sql);let args=[];
 return {bind(...values){args=values;return this;},
   async first(){return stmt.get(...args)??null;},
   async all(){return {results:stmt.all(...args)};},
   async run(){const r=stmt.run(...args);return {success:true,meta:{changes:Number(r.changes)}};}};
}};
const token='local-integration-signing-key';
function sign(id){
 const p=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id,first_name:'Synthetic'})});
 const data=[...p].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${v}`).join('\n');
 const secret=createHmac('sha256','WebAppData').update(token).digest();
 p.set('hash',createHmac('sha256',secret).update(data).digest('hex'));return p.toString();
}
async function call(id,action,payload={},status=200){
 const response=await worker.fetch(new Request('https://test.invalid/api/action',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...payload,action,initData:sign(id)})}),{DB,TELEGRAM_BOT_TOKEN:token,ADMIN_TELEGRAM_IDS:'10003',ADMIN_TELEGRAM_IDS_MAHDI:'10004'});
 const result=await response.json();assert.equal(response.status,status,`${action}: ${JSON.stringify(result)}`);return result;
}
try{
 const profile={electionType:'council',district:'Synthetic district A',stage:'planning',professionalSummary:'Synthetic summary',details:{education:'Synthetic education',skills:'Synthetic skills'}};
 await call(10001,'saveCandidateProfile',profile);
 let first=await call(10001,'candidateProfile');
 assert.equal(first.profile.district,profile.district);assert.equal(first.details.education,profile.details.education);assert.equal(first.checklist.length,6);
 console.log('PASS profile save/read and checklist creation on real schema');
 assert.equal((await call(10002,'candidateProfile',{telegram_id:10001,userId:10001})).profile,null);
 await call(10002,'saveCandidateProfile',{...profile,district:'Synthetic district B',telegram_id:10001,userId:10001});
 assert.equal((await call(10001,'candidateProfile')).profile.district,profile.district);
 assert.equal((await call(10002,'candidateProfile')).profile.district,'Synthetic district B');
 console.log('PASS two-user profile isolation despite forged owner fields');
 await call(10001,'saveCandidateProfile',{...profile,details:{skills:'Updated skill'}});
 first=await call(10001,'candidateProfile');assert.equal(first.details.education,'Synthetic education');assert.equal(first.details.skills,'Updated skill');
 await call(10001,'saveCandidateProfile',{...profile,details:{unexpected:'blocked'}},400);
 assert.equal((await call(10001,'candidateProfile')).details.skills,'Updated skill');
 console.log('PASS partial details merge and invalid-input rejection');
 await call(10002,'updateCandidateChecklist',{itemKey:'profile',status:'done',telegram_id:10001});
 assert.equal((await call(10001,'candidateProfile')).checklist.find(x=>x.item_key==='profile').status,'todo');
 assert.equal((await call(10002,'candidateProfile')).checklist.find(x=>x.item_key==='profile').status,'done');
 console.log('PASS checklist write isolation');
 await call(10001,'adminSupportQueue',{},403);
 await call(10003,'adminSupportQueue');await call(10004,'adminSupportQueue');
 console.log('PASS ordinary user denied admin access; both configured admin ID lists accepted');
 assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
 console.log('PASS SQLite integrity; scope is local Worker + SQLite, not live D1 or Telegram WebView');
}finally{db.close();}
