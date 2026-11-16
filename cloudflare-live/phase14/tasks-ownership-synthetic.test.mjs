// Synthetic-only ownership regression tests. No network, Worker deployment, or real D1.
import test from 'node:test';
import assert from 'node:assert/strict';
import {handleTasks} from '../tasks-api.mjs';

const own='11111111-1111-4111-8111-111111111111';
const foreign='22222222-2222-4222-8222-222222222222';
const actor={id:'1001',name:'Synthetic A',username:'synthetic_a'};
function fakeD1(){
  const rows=[{id:own,telegram_id:actor.id,title:'Own task',status:'open'},
              {id:foreign,telegram_id:'2002',title:'Private task',status:'open'}];
  const queries=[];
  const db={prepare(sql){
    const q={sql,args:[],bind(...args){this.args=args;return this;},
      async all(){
        queries.push({sql,args:this.args});
        if(!/WHERE telegram_id=\?/.test(sql))throw Error('unscoped list');
        return {results:rows.filter(r=>r.telegram_id===this.args[0])};
      },
      async run(){
        queries.push({sql,args:this.args});
        if(!/WHERE id=\? AND telegram_id=\?/.test(sql))throw Error('unscoped mutation');
        const id=this.args.at(-2),uid=this.args.at(-1);
        const row=rows.find(r=>r.id===id&&r.telegram_id===uid);
        if(!row)return {meta:{changes:0}};
        if(sql.startsWith('DELETE'))rows.splice(rows.indexOf(row),1);
        else if(sql.includes('SET status='))row.status=this.args[0];
        else row.title=this.args[0];
        return {meta:{changes:1}};
      }};
    return q;
  }};
  return {db,rows,queries};
}
test('list returns only authenticated owner tasks',async()=>{
  const f=fakeD1();
  const res=await handleTasks(f.db,actor,{action:'list'});
  assert.equal(res.status,200);
  const data=await res.json();
  assert.deepEqual(data.tasks.map(t=>t.id),[own]);
  assert.ok(!JSON.stringify(data).includes('Private task'));
});
for(const action of ['update','status','delete']){
  test(action+' rejects another owner task without mutation',async()=>{
    const f=fakeD1();
    const payload={action,id:foreign,status:'done',title:'Changed task',details:'',priority:'normal',due_date:null,telegram_id:'2002',owner_id:'2002'};
    const res=await handleTasks(f.db,actor,payload);
    assert.equal(res.status,404);
    assert.deepEqual(await res.json(),{error:'TASK_NOT_FOUND'});
    assert.equal(f.rows.find(r=>r.id===foreign).title,'Private task');
    assert.equal(f.rows.find(r=>r.id===foreign).status,'open');
    assert.equal(f.queries.length,1);
    assert.equal(f.queries[0].args.at(-1),actor.id);
  });
}
test('client-supplied owner does not override authenticated actor',async()=>{
  const f=fakeD1();
  const res=await handleTasks(f.db,actor,{action:'status',id:own,status:'done',telegram_id:'2002',owner_id:'2002'});
  assert.equal(res.status,200);
  assert.equal(f.rows.find(r=>r.id===own).status,'done');
  assert.equal(f.queries[0].args.at(-1),actor.id);
});

test('summary is scoped to authenticated user and never accepts client owner',async()=>{
 const calls=[];
 const db={prepare(sql){return {sql,bind(...args){calls.push({sql,args});return this;},async first(){
  if(sql.includes('candidate_subscriptions_v2'))return null;
  return {total:1,open:1,doing:0,done:0,overdue:0};
 }};}};
 const res=await handleTasks(db,actor,{action:'summary',telegram_id:'2002',owner_id:'2002'});
 assert.equal(res.status,200);
 const body=await res.json();
 assert.equal(body.summary.total,1);
 assert.equal(body.remaining,9);
 assert.equal(calls.length,2);
 assert.ok(calls.every(q=>q.sql.includes('telegram_id=?')&&q.args[0]===actor.id));
});
test('invalid status is rejected before database access',async()=>{
 const db={prepare(){throw Error('unexpected DB access')}};
 const res=await handleTasks(db,actor,{action:'status',id:own,status:'admin'});
 assert.equal(res.status,400);
 assert.deepEqual(await res.json(),{error:'INVALID_TASK_STATUS'});
});
test('malformed task id is rejected before database access',async()=>{
 const db={prepare(){throw Error('unexpected DB access')}};
 const res=await handleTasks(db,actor,{action:'delete',id:'../../other-user'});
 assert.equal(res.status,400);
 assert.deepEqual(await res.json(),{error:'INVALID_TASK_ID'});
});
