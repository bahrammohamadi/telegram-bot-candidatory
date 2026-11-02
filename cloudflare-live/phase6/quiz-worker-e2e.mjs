import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHmac} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {seedQuizzes} from './quiz-seed.mjs';
import worker from './dist/integration-quiz-worker.mjs';

const sqlite=new DatabaseSync(':memory:');
sqlite.exec(readFileSync(new URL('../integration-schema.sql',import.meta.url),'utf8'));
sqlite.exec(readFileSync(new URL('./quiz-migration.sql',import.meta.url),'utf8'));
const DB={
  prepare(sql){
    const statement=sqlite.prepare(sql);
    return {
      bind(...args){return {async first(){return statement.get(...args)||null},async all(){return {results:statement.all(...args)}},async run(){const r=statement.run(...args);return {meta:{changes:r.changes}}}} },
      async first(){return statement.get()||null},
      async all(){return {results:statement.all()}},
      async run(){const r=statement.run();return {meta:{changes:r.changes}}}
    };
  },
  async batch(statements){
    sqlite.exec('BEGIN');
    try{const result=[];for(const statement of statements)result.push(await statement.run());sqlite.exec('COMMIT');return result}
    catch(e){sqlite.exec('ROLLBACK');throw e}
  }
};
const seed=await seedQuizzes(DB);
assert.equal(seed.quizzes,2);assert.equal(seed.questions,10);
const token='123456789:SYNTHETIC_FAKE_TOKEN_FOR_TESTS_ONLY';
const env={DB,TELEGRAM_BOT_TOKEN:token};
function signed(id){
  const p=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id,first_name:'Synthetic'}),signature:'synthetic-signature-field'});
  const check=[...p.entries()].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>k+'='+v).join('\n');
  const secret=createHmac('sha256','WebAppData').update(token).digest();
  p.set('hash',createHmac('sha256',secret).update(check).digest('hex'));
  return p.toString();
}
async function call(auth,action,payload={}){
  const response=await worker.fetch(new Request('https://quiz.synthetic/api/quiz',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData:auth,action,...payload})}),env);
  return {status:response.status,body:await response.json()};
}
const userA=signed(9100998881),userB=signed(9100998882);
assert.equal((await call('bad','catalog')).status,401,'signed identity required');
let catalog=await call(userA,'catalog');
assert.equal(catalog.status,200);assert.equal(catalog.body.quizzes.length,2);
assert.equal(catalog.body.quizzes[0].question_count,5);
const started=await call(userA,'start',{quiz_id:91001});
assert.equal(started.status,200);assert.equal(started.body.questions.length,5);
const questions=started.body.questions;
for(const q of questions){
  assert.equal(q.options.length,4);
  assert.equal(Object.hasOwn(q,'correct_index'),false,'answers must not leak before submit');
  assert.equal(Object.hasOwn(q,'rationale'),false,'explanations withheld until submitted');
}
assert.equal((await call(userA,'start',{quiz_id:999999})).status,404);
assert.equal((await call(userA,'submit',{quiz_id:91001,answers:{}})).status,400);
const answers=Object.fromEntries(questions.map(q=>[String(q.id),0]));
assert.equal((await call(userA,'submit',{quiz_id:91001,answers:{...answers,'123':0}})).status,400,'additional answer forbidden');
assert.equal((await call(userA,'submit',{quiz_id:91001,answers:{...answers,[questions[0].id]:99}})).status,400,'out-of-range choice denied');
const grade=await call(userA,'submit',{quiz_id:91001,answers});
assert.equal(grade.status,201,JSON.stringify(grade));
assert.equal(grade.body.question_count,5);assert.equal(grade.body.feedback.length,5);
assert.equal(grade.body.feedback.every(f=>typeof f.rationale==='string'&&f.rationale.length>5),true);
assert.equal(grade.body.feedback.every(f=>f.source_url.startsWith('https://www.unesco.org')),true);
const historyA=await call(userA,'history');assert.equal(historyA.body.attempts.length,1);
const historyB=await call(userB,'history');assert.deepEqual(historyB.body.attempts,[],'history private');
const attemptId=grade.body.attempt_id;
assert.equal((await call(userB,'review',{attempt_id:attemptId})).status,404,'review owner-scoped');
assert.equal((await call(userA,'review',{attempt_id:attemptId})).body.feedback.length,5);
const forged=new URLSearchParams(userA);forged.set('signature','changed');
assert.equal((await call(forged.toString(),'history')).status,401);
sqlite.close();
console.log('PASS quiz: 2 catalogs, 10 questions, hidden answer keys before submit, server grading, provenance, history, owner isolation, tamper rejection');
