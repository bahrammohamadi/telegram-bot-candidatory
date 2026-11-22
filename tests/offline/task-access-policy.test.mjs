import test from 'node:test';
import assert from 'node:assert/strict';
import {canAccessTask} from './task-access-policy.mjs';
const principal={id:'a'};
const membership={userId:'a',workspaceId:'x',active:true,role:'member'};
const task={id:'t',workspaceId:'x',ownerId:'a'};
const allowed=(changes={})=>canAccessTask({principal,membership,task,action:'read',...changes});
test('owner reads and edits own workspace task',()=>{assert.equal(allowed(),true);assert.equal(allowed({action:'write'}),true)});
test('cross-workspace task is invisible and immutable',()=>{for(const action of ['read','write']) assert.equal(allowed({task:{...task,workspaceId:'y'},action}),false)});
test('another owner cannot be edited by member',()=>assert.equal(allowed({task:{...task,ownerId:'b'},action:'write'}),false));
test('revoked membership is denied',()=>assert.equal(allowed({membership:{...membership,active:false}}),false));
test('client role cannot override server membership',()=>assert.equal(allowed({membership:{...membership,role:'viewer'},action:'write',clientRole:'admin'}),false));
test('principal mismatch denied',()=>assert.equal(allowed({principal:{id:'b'}}),false));
test('missing context fails closed',()=>assert.equal(allowed({membership:null}),false));
test('unknown action fails closed',()=>assert.equal(allowed({action:'delete'}),false));
test('viewer reads but never writes',()=>{assert.equal(allowed({membership:{...membership,role:'viewer'}}),true);assert.equal(allowed({membership:{...membership,role:'viewer'},action:'write'}),false)});

test('missing task or principal fails closed for both actions',()=>{
  for(const action of ['read','write']){
    assert.equal(allowed({principal:null,action}),false);
    assert.equal(allowed({task:null,action}),false);
    assert.equal(allowed({membership:null,action}),false);
  }
});
test('missing or mismatched workspace identifiers deny access',()=>{
  for(const action of ['read','write']){
    assert.equal(allowed({task:{...task,workspaceId:null},action}),false);
    assert.equal(allowed({membership:{...membership,workspaceId:null},action}),false);
    assert.equal(allowed({membership:{...membership,workspaceId:'y'},action}),false);
  }
});
test('unknown and absent membership roles deny read and write',()=>{
  for(const role of [undefined,null,'','owner','ADMIN','superadmin']){
    for(const action of ['read','write']){
      assert.equal(allowed({membership:{...membership,role},action}),false);
    }
  }
});
test('member cannot edit unowned task, manager may edit only within workspace',()=>{
  assert.equal(allowed({task:{...task,ownerId:null},action:'write'}),false);
  assert.equal(allowed({membership:{...membership,role:'manager'},task:{...task,ownerId:'b'},action:'write'}),true);
  assert.equal(allowed({membership:{...membership,role:'manager'},task:{...task,workspaceId:'y'},action:'write'}),false);
});
test('inactive admin membership never bypasses workspace boundary',()=>{
  const admin={...membership,role:'admin'};
  assert.equal(allowed({membership:{...admin,active:false},action:'write'}),false);
  assert.equal(allowed({membership:admin,task:{...task,workspaceId:'y'},action:'write'}),false);
});
