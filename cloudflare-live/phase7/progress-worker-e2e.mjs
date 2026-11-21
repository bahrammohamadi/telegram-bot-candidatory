import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {seedQuizzes} from '../phase6/quiz-seed.mjs';
import worker from './dist/integration-progress-worker.mjs';

const sqlite=new DatabaseSync(':memory:');
sqlite.exec(readFileSync(new URL('../integration-schema.sql',import.meta.url),'utf8'));
sqlite.exec(readFileSync(new URL('../phase5/practice-migration.sql',import.meta.url),'utf8'));
sqlite.exec(readFileSync(new URL('../phase6/quiz-migration.sql',import.meta.url),'utf8'));
const DB={
  prepare(sql){const st=sqlite.prepare(sql);return {
    bind(...params){return {async first(){return st.get(...params)||null},async all(){return {results:st.all(...params)}},async run(){const r=st.run(...params);return {meta:{changes:r.changes}}}}},
    async first(){return st.get()||null},async all(){return {results:st.all()}},async run(){const r=st.run();return {meta:{changes:r.changes}}}
  }},
  async batch(statements){sqlite.exec('BEGIN');try{const out=[];for(const st of statements)out.push(await st.run());sqlite.exec('COMMIT');return out}catch(e){sqlite.exec('ROLLBACK');throw e}}
};
await seedQuizzes(DB);
const a=9100030101,b=9100030102;
sqlite.prepare("INSERT INTO candidate_users(telegram_id,display_name) VALUES(?,?)").run(a,'Synthetic A');
sqlite.prepare("INSERT INTO candidate_users(telegram_id,display_name) VALUES(?,?)").run(b,'Synthetic B');
sqlite.prepare("INSERT INTO candidate_profiles(telegram_id,election_type,district,stage,professional_summary) VALUES(?,'council','Test district','planning','')").run(a);
const goal=sqlite.prepare("INSERT INTO personal_goals_v2(id,telegram_id,title,details,target_date,status) VALUES(?,?,?,?,?,?)");
goal.run(crypto.randomUUID(),a,'Synthetic completed','',null,'done');
goal.run(crypto.randomUUID(),a,'Synthetic overdue','', '2020-01-01','open');
goal.run(crypto.randomUUID(),a,'Synthetic future','', '2099-01-01','open');
sqlite.prepare("INSERT INTO personal_goals_v2(id,telegram_id,title,status) VALUES(?,?,'Other user goal','done')").run(crypto.randomUUID(),b);
const calendar=sqlite.prepare("INSERT INTO personal_calendar_v1(id,telegram_id,title,starts_at,status) VALUES(?,?,?,?,?)");
calendar.run(crypto.randomUUID(),a,'Synthetic done','2026-11-02T10:00','done');
calendar.run(crypto.randomUUID(),a,'Synthetic planned','2026-11-02T13:00','scheduled');
const practice=sqlite.prepare("INSERT INTO practice_sessions_v1(id,telegram_id,exercise_key,kind,response_text,self_score,duration_seconds) VALUES(?,?,?,?,?,?,?)");
practice.run(crypto.randomUUID(),a,'speech_clear','speech','Synthetic speech text',5,90);
practice.run(crypto.randomUUID(),a,'qa_unknown','qa','Synthetic Q&A text',3,30);
const attempts=sqlite.prepare("INSERT INTO quiz_attempts(id,quiz_id,telegram_id,answers_json,score,question_count) VALUES(?,?,?,?,?,?)");
attempts.run(crypto.randomUUID(),91001,a,'{}',3,5);
attempts.run(crypto.randomUUID(),91002,a,'{}',4,5);
attempts.run(crypto.randomUUID(),91001,b,'{}',5,5);
const token='123456789:SYNTHETIC_ONLY_NEVER_REAL';
function signed(id){const p=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id,first_name:'Synthetic'}),signature:'synthetic-field'});const msg=[...p.entries()].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>k+'='+v).join('\n');const secret=createHmac('sha256','WebAppData').update(token).digest();p.set('hash',createHmac('sha256',secret).update(msg).digest('hex'));return p.toString()}
async function call(initData,action='overview'){const r=await worker.fetch(new Request('https://test.local/api/progress',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData,action})}),{DB,TELEGRAM_BOT_TOKEN:token});return {status:r.status,data:await r.json()}}
assert.equal((await call('bad')).status,401,'reject unsigned identity');
const first=await call(signed(a));
assert.equal(first.status,200,JSON.stringify(first));
assert.equal(first.data.profile.completed,true);
assert.deepEqual(first.data.goals,{total:3,completed:1,overdue:1});
assert.deepEqual(first.data.calendar,{total:2,completed:1,scheduled:1});
assert.deepEqual(first.data.practice,{total:2,speech:1,qa:1,duration_seconds:120,self_rating:4});
assert.deepEqual(first.data.quizzes,{attempts:2,unique_quizzes:2,available_quizzes:2,correct_answers:7,answered_questions:10,correct_percentage:70});
assert.equal(first.data.scope,'authenticated_test_account');
const other=await call(signed(b));
assert.equal(other.status,200);
assert.equal(other.data.profile.completed,false);
assert.equal(other.data.goals.total,1);
assert.equal(other.data.goals.completed,1);
assert.equal(other.data.practice.total,0);
assert.equal(other.data.practice.self_rating,null);
assert.equal(other.data.quizzes.attempts,1);
assert.equal(other.data.quizzes.correct_percentage,100);
assert.equal((await call(signed(a),'delete')).status,400);
const forged=new URLSearchParams(signed(a));forged.set('signature','altered');
assert.equal((await call(forged.toString())).status,401,'tampered signature denied');
const count=sqlite.prepare('SELECT count(*) AS n FROM quiz_attempts').get().n;
assert.equal(count,3,'read-only progress API must not modify stored attempts');
sqlite.close();
console.log('PASS: real Worker, HMAC auth, aggregate arithmetic, no-data, cross-user isolation, tamper denial, read-only queries');
