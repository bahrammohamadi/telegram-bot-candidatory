// Offline-only negative contract tests; never connects to Cloudflare or D1.
import test from 'node:test';
import assert from 'node:assert/strict';
import {handleTasks} from '../tasks-api.mjs';
const actor={id:'1001',name:'Synthetic',username:'synthetic'};
const id='11111111-1111-4111-8111-111111111111';
const noDb={prepare(){throw Error('unexpected database access')},batch(){throw Error('unexpected database write')}};
test('create rejects missing details without database access',async()=>{
 const r=await handleTasks(noDb,actor,{action:'create',title:'Valid title',priority:'normal'});
 assert.equal(r.status,400);
 assert.deepEqual(await r.json(),{error:'INVALID_TASK'});
});
test('create rejects invalid calendar date without database access',async()=>{
 const r=await handleTasks(noDb,actor,{action:'create',title:'Valid title',details:'',priority:'normal',due_date:'2026-02-30'});
 assert.equal(r.status,400);
 assert.deepEqual(await r.json(),{error:'INVALID_TASK'});
});
test('update rejects invalid priority without database access',async()=>{
 const r=await handleTasks(noDb,actor,{action:'update',id,title:'Valid title',details:'',priority:'superadmin'});
 assert.equal(r.status,400);
 assert.deepEqual(await r.json(),{error:'INVALID_TASK'});
});
test('unknown action with valid id is rejected without database access',async()=>{
 const r=await handleTasks(noDb,actor,{action:'transferOwnership',id,owner_id:'2002'});
 assert.equal(r.status,400);
 assert.deepEqual(await r.json(),{error:'UNKNOWN_ACTION'});
});
