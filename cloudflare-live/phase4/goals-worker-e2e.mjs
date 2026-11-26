import {createHmac} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import worker from './dist/integration-goals-worker.mjs';

const token='123456789:ISOLATED_SYNTHETIC_TEST_TOKEN_NOT_A_REAL_BOT';
const sql=new DatabaseSync(':memory:');
sql.exec(readFileSync(new URL('../integration-schema.sql',import.meta.url),'utf8'));

function makeStatement(source) {
  const raw=sql.prepare(source);
  return {
    bind(...args){
      return {
        async first(){return raw.get(...args)||null},
        async all(){return {results:raw.all(...args)}},
        async run(){const r=raw.run(...args);return {meta:{changes:r.changes}}}
      };
    }
  };
}
const env={
  TELEGRAM_BOT_TOKEN:token,
  DB:{
    prepare:makeStatement,
    async batch(statements){
      sql.exec('BEGIN');
      try{const result=[];for(const stmt of statements)result.push(await stmt.run());sql.exec('COMMIT');return result}
      catch(e){sql.exec('ROLLBACK');throw e}
    }
  }
};
function signed(id){
  const p=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id,first_name:'Synthetic user'}),signature:'synthetic-ed25519-field'});
  const text=[...p.entries()].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>k+'='+v).join('\n');
  const key=createHmac('sha256','WebAppData').update(token).digest();
  p.set('hash',createHmac('sha256',key).update(text).digest('hex'));
  return p.toString();
}
async function call(initData,action,fields={}){
  const r=await worker.fetch(new Request('https://test.local/api/goals',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData,action,...fields})}),env);
  return {status:r.status,body:await r.json()};
}
const a=signed(9100011001),b=signed(9100011002);
assert.equal((await call('invalid','list')).status,401);
assert.deepEqual((await call(a,'list')).body.goals,[]);
let result=await call(a,'create',{title:'',details:'',target_date:''});
assert.equal(result.status,400);
result=await call(a,'create',{title:'Synthetic Goal',details:'Synthetic check only',target_date:'2026-11-15'});
assert.equal(result.status,201,JSON.stringify(result));
const id=result.body.id;
assert.equal((await call(a,'list')).body.goals[0].title,'Synthetic Goal');
assert.deepEqual((await call(b,'list')).body.goals,[]);
assert.equal((await call(b,'status',{id,status:'done'})).status,404);
assert.equal((await call(b,'delete',{id})).status,404);
assert.equal((await call(a,'status',{id,status:'done'})).status,200);
assert.equal((await call(a,'list')).body.goals[0].status,'done');
assert.equal((await call(a,'delete',{id})).status,200);
assert.deepEqual((await call(a,'list')).body.goals,[]);
const fake=new URLSearchParams(a);fake.set('signature','changed');
assert.equal((await call(fake.toString(),'list')).status,401);
sql.close();
console.log('PASS: real Worker handler with synthetic HMAC, SQLite D1 behavior, CRUD, isolation, and tampering checks');
