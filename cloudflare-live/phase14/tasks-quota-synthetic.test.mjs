// Offline regression tests: no network, Cloudflare deployment, or production D1.
import test from 'node:test';
import assert from 'node:assert/strict';
import {handleTasks} from './tasks-api.mjs';

const actor={id:'1001',name:'Synthetic User',username:'synthetic_user'};
const task={action:'create',title:'Review meeting notes',details:'Synthetic only',priority:'normal',due_date:null};

function dbWithQuota({professional=false,count=0,failWrite=false}={}){
 const queries=[];
 const db={
  prepare(sql){
   const query={sql,args:[],bind(...args){this.args=args;return this;},
    async first(){
     queries.push({sql,args:this.args});
     if(sql.includes('candidate_subscriptions_v2'))return professional?{n:1}:null;
     if(sql.includes('COUNT(*)'))return {n:count};
     throw Error('Unexpected SELECT');
    }};
   return query;
  },
  async batch(statements){
   queries.push({batch:statements.map(s=>({sql:s.sql,args:s.args}))});
   if(failWrite)throw Error('Synthetic database failure');
   return [];
  }
 };
 return {db,queries};
}
test('free user at ten tasks is denied before any write',async()=>{
 const f=dbWithQuota({count:10});
 const res=await handleTasks(f.db,actor,task);
 assert.equal(res.status,429);
 assert.deepEqual(await res.json(),{error:'TASK_QUOTA_LIMIT',limit:10,remaining:0});
 assert.equal(f.queries.length,2);
 assert.ok(f.queries.every(q=>q.args[0]===actor.id));
});
test('professional user at one hundred tasks is denied before any write',async()=>{
 const f=dbWithQuota({professional:true,count:100});
 const res=await handleTasks(f.db,actor,task);
 assert.equal(res.status,429);
 assert.deepEqual(await res.json(),{error:'TASK_QUOTA_LIMIT',limit:100,remaining:0});
 assert.equal(f.queries.length,2);
});
test('database write failure does not report task creation success',async()=>{
 const f=dbWithQuota({count:0,failWrite:true});
 const res=await handleTasks(f.db,actor,task);
 assert.equal(res.status,503);
 assert.deepEqual(await res.json(),{error:'TASK_WRITE_FAILED'});
 assert.equal(f.queries.length,3);
 assert.equal(f.queries[2].batch.length,2);
 assert.equal(f.queries[2].batch[1].args[1],actor.id);
});
test('invalid calendar date is rejected without database access',async()=>{
 const db={prepare(){throw Error('Database must not be accessed')}};
 const res=await handleTasks(db,actor,{...task,due_date:'2026-02-30'});
 assert.equal(res.status,400);
 assert.deepEqual(await res.json(),{error:'INVALID_TASK'});
});
