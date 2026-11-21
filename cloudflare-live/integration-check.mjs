import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import assert from 'node:assert/strict';
const db=new DatabaseSync(':memory:');
db.exec(readFileSync(new URL('./integration-schema.sql',import.meta.url),'utf8'));
const source=readFileSync(new URL(process.argv[2]||'./worker.js',import.meta.url),'utf8');
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
// D1-shaped adapter over isolated SQLite; never connects to Cloudflare or Telegram.
const DB={prepare(sql){
 const stmt=db.prepare(sql);let args=[];
 return {bind(...values){args=values;return this;},
   async first(){return stmt.get(...args)??null;},
   async all(){return {results:stmt.all(...args)};},
   async run(){const r=stmt.run(...args);return {success:true,meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}};}};
},async batch(statements){
 db.exec('BEGIN');
 try{const results=[];for(const stmt of statements)results.push(await stmt.run());db.exec('COMMIT');return results;}
 catch(error){db.exec('ROLLBACK');throw error;}
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
 // Workspace records must remain scoped even when a valid ID is supplied by another user.
 const wsA=(await call(10001,'createWorkspace',{name:'Synthetic A'})).workspace.id;
 const wsB=(await call(10002,'createWorkspace',{name:'Synthetic B'})).workspace.id;
 const task=await call(10001,'createTask',{workspaceId:wsA,title:'Synthetic task'});
 const doc=await call(10001,'createDocument',{workspaceId:wsA,title:'Private document',sourceUrl:'https://example.com/synthetic',visibility:'managers'});
 await call(10002,'workspaceSummary',{workspaceId:wsA},403);
 await call(10002,'taskStatus',{workspaceId:wsB,id:task.id,status:'done'},404);
 await call(10002,'deleteDocument',{workspaceId:wsB,id:doc.id},404);
 let summary=await call(10001,'workspaceSummary',{workspaceId:wsA});
 assert.equal(summary.tasks[0].status,'todo');assert.equal(summary.documents[0].id,doc.id);
 await call(10001,'createDocument',{workspaceId:wsA,title:'Invalid link',sourceUrl:'javascript:alert(1)'},400);
 // Add a fixture member to test role-based visibility independently of invitations.
 db.prepare("INSERT INTO workspace_members(workspace_id,telegram_id,role) VALUES(?,?,'member')").run(wsA,10002);
 assert.equal((await call(10002,'workspaceSummary',{workspaceId:wsA})).documents.length,0);
 await call(10002,'deleteDocument',{workspaceId:wsA,id:doc.id},403);
 await call(10001,'taskStatus',{workspaceId:wsA,id:task.id,status:'done'});
 assert.equal((await call(10001,'workspaceSummary',{workspaceId:wsA})).tasks[0].status,'done');
 console.log('PASS workspace isolation, document visibility, role restrictions and task status round trip');
 const event=await call(10001,'createCalendarEventV1',{title:'Synthetic meeting',startsAt:'2026-11-02T10:00'});
 await call(10002,'updateCalendarEventV1',{id:event.id,status:'done'},404);
 assert.equal((await call(10002,'personalCalendarV1')).events.length,0);
 await call(10001,'updateCalendarEventV1',{id:event.id,status:'done'});
 assert.equal((await call(10001,'personalCalendarV1')).events[0].status,'done');
 const plan=await call(10001,'createActionPlanV1',{title:'Synthetic plan',objective:'Synthetic objective',steps:['First step','Second step']});
 const steps=(await call(10001,'actionPlansV1')).plans.find(p=>p.id===plan.id).steps;
 await call(10002,'updateActionStepV1',{planId:plan.id,stepId:steps[0].id,status:'done'},404);
 assert.equal((await call(10002,'actionPlansV1')).plans.length,0);
 await call(10001,'updateActionStepV1',{planId:plan.id,stepId:steps[0].id,status:'done'});
 assert.equal((await call(10001,'actionPlansV1')).plans[0].steps[0].status,'done');
 console.log('PASS personal calendar and action-plan round trips and cross-user isolation');
 if(process.argv.includes('--phase3')){
   // Fail the final checklist insert AFTER profile and details writes have executed.
   db.exec("CREATE TRIGGER fail_checklist BEFORE INSERT ON candidate_checklist_items WHEN NEW.item_key='activity_plan' BEGIN SELECT RAISE(ABORT,'injected failure'); END;");
   const before=await call(10001,'candidateProfile');
   await call(10001,'saveCandidateProfile',{...profile,district:'Must roll back',details:{education:'Must roll back'}},500);
   const after=await call(10001,'candidateProfile');
   assert.deepEqual(after,before,'A failed save must preserve the entire existing profile');
   await call(10005,'saveCandidateProfile',profile,500);
   const fresh=await call(10005,'candidateProfile');
   assert.equal(fresh.profile,null);assert.deepEqual(fresh.details,{});assert.equal(fresh.checklist.length,0);
   db.exec('DROP TRIGGER fail_checklist');
   await call(10005,'saveCandidateProfile',profile);
   assert.equal((await call(10005,'candidateProfile')).checklist.length,6);
   await call(10001,'saveCandidateProfile',{...profile,details:{education:''}});
   const cleared=await call(10001,'candidateProfile');
   assert.equal(cleared.details.education,'');assert.equal(cleared.details.skills,'Updated skill');
   console.log('PASS failed updates and first saves roll back entirely; retry and explicit field clearing work');
 }
 assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
 console.log('PASS SQLite integrity; scope is local Worker + SQLite, not live D1 or Telegram WebView');
}finally{db.close();}
