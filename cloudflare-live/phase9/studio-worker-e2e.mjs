import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import worker from './dist/integration-studio-worker.mjs';

const db=new DatabaseSync(':memory:');
db.exec(readFileSync(new URL('../integration-schema.sql',import.meta.url),'utf8'));
db.exec(readFileSync(new URL('./studio-migration.sql',import.meta.url),'utf8'));
const DB={
  prepare(sql){const statement=db.prepare(sql);return {
    bind(...args){return {async first(){return statement.get(...args)||null},async all(){return {results:statement.all(...args)}},async run(){const r=statement.run(...args);return {meta:{changes:r.changes}}}}},
    async first(){return statement.get()||null},async all(){return {results:statement.all()}},async run(){const r=statement.run();return {meta:{changes:r.changes}}}
  }},
  async batch(statements){db.exec('BEGIN');try{const results=[];for(const stmt of statements)results.push(await stmt.run());db.exec('COMMIT');return results}catch(e){db.exec('ROLLBACK');throw e}}
};
const token='123456789:SYNTHETIC_TEST_TOKEN_NEVER_REAL';
function signed(id){
 const p=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id,first_name:'Synthetic'}),signature:'synthetic_field'});
 const message=[...p.entries()].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>k+'='+v).join('\n');
 const key=createHmac('sha256','WebAppData').update(token).digest();
 p.set('hash',createHmac('sha256',key).update(message).digest('hex'));return p.toString();
}
const A=signed(9101000001),B=signed(9101000002);
async function call(initData,action,fields={}){
 const response=await worker.fetch(new Request('https://studio.synthetic/api/studio',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData,action,...fields})}),{DB,TELEGRAM_BOT_TOKEN:token});
 return {status:response.status,data:await response.json()};
}
assert.equal((await call('invalid','list')).status,401);
assert.deepEqual((await call(A,'list')).data.drafts,[]);
const basic={kind:'service_update',title:'Synthetic public project update',body:'A factual synthetic public service update with source checks.',source_url:'https://example.org/source',status:'draft'};
assert.equal((await call(A,'create',{...basic,body:'tiny'})).status,400);
assert.equal((await call(A,'create',{...basic,source_url:'javascript:alert(1)'})).status,400);
assert.equal((await call(A,'create',{...basic,kind:'voter_targeting'})).status,400);
const created=await call(A,'create',basic);
assert.equal(created.status,201,JSON.stringify(created));
const id=created.data.id;
assert.match(id,/^[0-9a-f-]{36}$/i);
let list=(await call(A,'list')).data.drafts;
assert.equal(list.length,1);assert.equal(list[0].title,basic.title);
assert.deepEqual((await call(B,'list')).data.drafts,[]);
assert.equal((await call(B,'update',{...basic,id,title:'Unauthorized change'})).status,404);
assert.equal((await call(B,'delete',{id})).status,404);
assert.equal((await call(A,'update',{...basic,id,title:'Reviewed synthetic notice',status:'reviewed'})).status,200);
list=(await call(A,'list')).data.drafts;
assert.equal(list[0].status,'reviewed');
assert.equal(list[0].title,'Reviewed synthetic notice');
assert.equal((await call(A,'delete',{id})).status,200);
assert.deepEqual((await call(A,'list')).data.drafts,[]);
const tampered=new URLSearchParams(A);tampered.set('signature','changed');
assert.equal((await call(tampered.toString(),'list')).status,401);
assert.equal(db.prepare('SELECT COUNT(*) AS n FROM public_content_drafts_v1').get().n,0);
db.close();
console.log('PASS studio: real Worker, signed Telegram auth, input validation, owner-only CRUD, cross-user denial and cleanup');
