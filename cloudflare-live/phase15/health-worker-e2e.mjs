import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import worker from './dist/integration-progress-tasks-worker.mjs';

// This test executes the assembled integration candidate, not the production Worker.
const src=readFileSync(new URL('./dist/integration-progress-tasks-worker.mjs',import.meta.url),'utf8');
assert.ok(src.includes('SELECT 1 AS ready FROM candidate_users LIMIT 1'));
assert.ok(!src.includes("SELECT count(*) AS n FROM sqlite_master WHERE type='table' AND name='candidate_users'"));

async function probe(db) {
 const r=await worker.fetch(new Request('https://phase15.synthetic/health'),{
  DB:db,TELEGRAM_BOT_TOKEN:'SYNTHETIC_HEALTH_TOKEN'
 });
 return {status:r.status,body:await r.json()};
}
const queries=[];
const ready=await probe({prepare(sql){
 queries.push(sql);
 return {first:async()=>({ready:1})};
}});
assert.equal(ready.status,200);
assert.equal(ready.body.schemaReady,true);
assert.equal(ready.body.production,false);
assert.deepEqual(queries,['SELECT 1 AS ready FROM candidate_users LIMIT 1']);

const empty=await probe({prepare(sql){
 assert.equal(sql,queries[0]);
 return {first:async()=>null};
}});
assert.equal(empty.status,200,'empty existing table must be schema-ready');
assert.equal(empty.body.schemaReady,true);

const unavailable=await probe({prepare(){throw new Error('SYNTHETIC_PRIVATE_DB_FAILURE')}});
assert.equal(unavailable.status,503,'D1 failure must fail closed');
assert.deepEqual(unavailable.body,{error:'DB_UNAVAILABLE'});
console.log('PASS phase15 health: quota-light table probe, empty table, 503 fail closed, no exception disclosure');
