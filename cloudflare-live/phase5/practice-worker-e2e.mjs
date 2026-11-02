import {createHmac} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import worker from './dist/integration-practice-worker.mjs';

const token='123456789:ISOLATED_SYNTHETIC_TEST_NOT_REAL';
const db=new DatabaseSync(':memory:');
db.exec(readFileSync(new URL('../integration-schema.sql',import.meta.url),'utf8'));
db.exec(readFileSync(new URL('./practice-migration.sql',import.meta.url),'utf8'));
const store={
  prepare(sql){
    const raw=db.prepare(sql);
    return {bind(...params){
      return {
        async first(){return raw.get(...params)||null},
        async all(){return {results:raw.all(...params)}},
        async run(){const r=raw.run(...params);return {meta:{changes:r.changes}}}
      };
    }};
  },
  async batch(stmts){
    db.exec('BEGIN');
    try{const rows=[];for(const stmt of stmts)rows.push(await stmt.run());db.exec('COMMIT');return rows}
    catch(error){db.exec('ROLLBACK');throw error}
  }
};
const env={DB:store,TELEGRAM_BOT_TOKEN:token};
function initData(id){
  const p=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id,first_name:'Synthetic'}),signature:'synthetic_ed25519_field'});
  const check=[...p.entries()].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>k+'='+v).join('\n');
  const secret=createHmac('sha256','WebAppData').update(token).digest();
  p.set('hash',createHmac('sha256',secret).update(check).digest('hex'));
  return p.toString();
}
async function call(auth,action,data={}){
  const response=await worker.fetch(new Request('https://practice.test/api/practice',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData:auth,action,...data})}),env);
  return {status:response.status,body:await response.json()};
}
const a=initData(9100000801),b=initData(9100000802);
assert.equal((await call('bad','list')).status,401,'unsigned request');
assert.deepEqual((await call(a,'list')).body.sessions,[],'empty history');
const base={exercise_key:'speech_clear',response_text:'گزارش تمرین ساختگی برای بررسی ساختار.',reflection:'دفعه بعد متن را واضح‌تر می‌خوانم.',self_score:4,duration_seconds:91};
assert.equal((await call(a,'create',{...base,self_score:9})).status,400,'score invalid');
assert.equal((await call(a,'create',{...base,exercise_key:'secret_prompt'})).status,400,'unknown exercise');
assert.equal((await call(a,'create',{...base,response_text:'',reflection:''})).status,400,'empty session');
assert.equal((await call(a,'create',{...base,duration_seconds:901})).status,400,'duration invalid');
const result=await call(a,'create',base);
assert.equal(result.status,201,JSON.stringify(result));
const id=result.body.id;
assert.match(id,/^[0-9a-f-]{36}$/i);
let list=(await call(a,'list')).body.sessions;
assert.equal(list.length,1);assert.equal(list[0].self_score,4);assert.equal(list[0].duration_seconds,91);
assert.deepEqual((await call(b,'list')).body.sessions,[],'user B cannot read A');
assert.equal((await call(b,'delete',{id})).status,404,'user B cannot delete A');
assert.equal((await call(a,'delete',{id})).status,200,'user A deletes own session');
assert.deepEqual((await call(a,'list')).body.sessions,[],'deleted session not returned');
const forged=new URLSearchParams(a);forged.set('signature','tampered');
assert.equal((await call(forged.toString(),'list')).status,401,'tampered signature denied');
const table=db.prepare("SELECT COUNT(*) AS n FROM practice_sessions_v1").get();
assert.equal(table.n,0,'no fixture left in database');
db.close();
console.log('PASS: real practice Worker, synthetic signed Telegram auth, SQLite create/list/delete, validation, isolation, cleanup');
