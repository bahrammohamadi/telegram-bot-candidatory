// Synthetic role matrix: no production handler, network, D1 or Telegram access.
import test from 'node:test';
import assert from 'node:assert/strict';
import {canAccessTask} from './task-access-policy.mjs';

const principal={id:'user-1'};
const membership={userId:'user-1',workspaceId:'workspace-A',active:true,role:'member'};
const task={id:'task-1',workspaceId:'workspace-A',ownerId:'user-1'};
const check=(role,action,overrides={})=>canAccessTask({
  principal,membership:{...membership,role},task,action,...overrides
});

test('explicit role/action matrix for an owned task',()=>{
  const matrix=[
    ['viewer',true,false],
    ['member',true,true],
    ['manager',true,true],
    ['admin',true,true],
    ['owner',false,false],
    ['system-admin',false,false],
    ['',false,false],
    [null,false,false]
  ];
  for(const [role,read,write] of matrix){
    assert.equal(check(role,'read'),read,`read role=${String(role)}`);
    assert.equal(check(role,'write'),write,`write role=${String(role)}`);
  }
});

test('cross-workspace task is denied for every recognized role and action',()=>{
  for(const role of ['viewer','member','manager','admin']){
    for(const action of ['read','write']){
      assert.equal(check(role,action,{task:{...task,workspaceId:'workspace-B'}}),false);
      assert.equal(check(role,action,{membership:{...membership,role,workspaceId:'workspace-B'}}),false);
    }
  }
});

test('inactive memberships are denied regardless of role or operation',()=>{
  for(const role of ['viewer','member','manager','admin']){
    for(const action of ['read','write']){
      assert.equal(check(role,action,{membership:{...membership,role,active:false}}),false);
      assert.equal(check(role,action,{membership:{...membership,role,active:1}}),false);
    }
  }
});

test('unowned or other-owned tasks cannot be written by ordinary members',()=>{
  for(const ownerId of [null,undefined,'user-2','',{},[]]){
    assert.equal(check('member','write',{task:{...task,ownerId}}),false);
  }
});

test('unrecognized operations and client-provided authority do not grant access',()=>{
  for(const action of ['delete','assign','approve','export','WRITE',null,undefined]){
    assert.equal(check('admin',action),false);
  }
  assert.equal(check('viewer','write',{clientRole:'admin',clientWorkspaceId:'workspace-A'}),false);
});
