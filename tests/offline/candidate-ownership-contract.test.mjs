// Synthetic RBAC contract harness; NOT a test of production handlers.
// Run: node --test tests/offline/candidate-ownership-contract.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

const cases = new Map([['case-A',{owner:'10001',name:'A'}],['case-B',{owner:'10002',name:'B'}]]);
const tasks = new Map([['task-A',{caseId:'case-A',status:'todo'}],['task-B',{caseId:'case-B',status:'todo'}]]);
function authorize(principal,caseId) {
  if (!principal?.verified) return {status:401};
  const record=cases.get(caseId);
  if (!record || record.owner!==principal.id) return {status:404};
  return {status:200,record};
}
function mutate(principal,taskId,patch) {
  const task=tasks.get(taskId);
  const auth=authorize(principal,task?.caseId);
  if(auth.status!==200) return {status:auth.status};
  if ('owner_id' in patch || 'candidate_id' in patch || 'caseId' in patch) return {status:400};
  if (!['todo','doing','done'].includes(patch.status)) return {status:400};
  if(task.status==='done' && patch.status!=='done') return {status:409};
  task.status=patch.status;
  return {status:200};
}
const A={id:'10001',verified:true}, B={id:'10002',verified:true};
test('AUTH-01 owner reads own case',()=>assert.equal(authorize(A,'case-A').status,200));
test('AUTH-02 cross-user case read denied',()=>assert.equal(authorize(A,'case-B').status,404));
test('AUTH-03 forged owner cannot modify another task',()=>assert.equal(mutate(A,'task-B',{owner_id:'case-A',status:'done'}).status,404));
test('AUTH-04 forged candidate cannot modify another task',()=>assert.equal(mutate(B,'task-A',{candidate_id:'case-B',status:'done'}).status,404));
test('AUTH-05 anonymous denied',()=>assert.equal(authorize(null,'case-A').status,401));
test('AUTH-06 unverified synthetic principal denied',()=>assert.equal(authorize({id:'10001',verified:false},'case-A').status,401));
test('AUTH-07 unsupported transition denied',()=>assert.equal(mutate(A,'task-A',{status:'invalid'}).status,400));
test('AUTH-08 duplicate state update has no extra effect',()=>{mutate(A,'task-A',{status:'doing'});mutate(A,'task-A',{status:'doing'});assert.equal(tasks.get('task-A').status,'doing')});
test('AUTH-09 case override cannot authorize cross-user read',()=>assert.equal(authorize(A,'case-B').status,404));
test('AUTH-10 denial has no sensitive payload',()=>assert.deepEqual(authorize(A,'case-B'),{status:404}));
