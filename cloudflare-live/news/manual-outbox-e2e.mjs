import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {runManualPublishOutbox} from './dist/manual-handler-test.mjs';

const migration=readFileSync(new URL('./manual-outbox-schema.sql',import.meta.url),'utf8');
const notice=readFileSync(new URL('./official-update-2026-11-03.txt',import.meta.url),'utf8');
const db=new DatabaseSync(':memory:');db.exec(migration);
const DB={
 prepare(sql){
  const st=db.prepare(sql);
  return {
   bind(...args){return {
    async first(){return st.get(...args)||null},
    async run(){const r=st.run(...args);return {meta:{changes:r.changes}}},
    async all(){return {results:st.all(...args)}}
   }},
   async first(){return st.get()||null},
   async run(){const r=st.run();return {meta:{changes:r.changes}}},
   async all(){return {results:st.all()}}
  }
 }
};
const token='123456789:SYNTHETIC_TOKEN_NOT_REAL';
const originalFetch=globalThis.fetch;
const requests=[];let fail=false;
globalThis.fetch=async(url,opts)=>{
 assert.match(String(url),/^https:\/\/api\.telegram\.org\/bot123456789:SYNTHETIC_TOKEN_NOT_REAL\/sendMessage$/);
 assert.equal(opts.method,'POST');
 const post=JSON.parse(opts.body);
 assert.equal(post.chat_id,'@candidatoryiran');
 assert.ok(post.text.includes('نسخه آزمایشی'));
 assert.equal(post.link_preview_options.is_disabled,true);
 assert.equal(Object.hasOwn(post,'parse_mode'),false);
 requests.push(post);
 return fail
 ?{ok:false,status:403,async json(){return {ok:false,description:'Synthetic forbidden'}}}
 :{ok:true,status:200,async json(){return {ok:true,result:{message_id:997111}}}};
};
try{
 const env={PUBLISH_ENABLED:'true',TELEGRAM_BOT_TOKEN:token,NEWS_DB:DB};
 const insert=db.prepare("INSERT INTO manual_publish_outbox(id,channel,content) VALUES(?, '@candidatoryiran', ?)");
 insert.run('news-announcement-2026-11-03',notice);
 await runManualPublishOutbox({...env,PUBLISH_ENABLED:'false'});
 assert.equal(requests.length,0,'no publishing while disabled');
 await Promise.all([runManualPublishOutbox(env),runManualPublishOutbox(env)]);
 assert.equal(requests.length,1,'concurrent runs must not publish twice');
 let row=db.prepare('SELECT status,attempts,message_id FROM manual_publish_outbox WHERE id=?').get('news-announcement-2026-11-03');
 assert.deepEqual(row,{status:'published',attempts:1,message_id:997111});
 await runManualPublishOutbox(env);
 assert.equal(requests.length,1,'published record must never replay');
 insert.run('news-announcement-second',notice+'\nنسخه دوم آزمایشی');
 fail=true;
 await runManualPublishOutbox(env);
 row=db.prepare('SELECT status,attempts,message_id FROM manual_publish_outbox WHERE id=?').get('news-announcement-second');
 assert.equal(row.status,'failed');
 assert.equal(row.attempts,1);
 await runManualPublishOutbox(env);
 assert.equal(requests.length,2,'known failed record must not auto-retry');
 const stuckId='news-announcement-uncertain';
 db.prepare("INSERT INTO manual_publish_outbox(id,channel,content,status,attempts) VALUES(?, '@candidatoryiran', ?, 'sending', 1)").run(stuckId,notice);
 await runManualPublishOutbox(env);
 assert.equal(requests.length,2,'ambiguous sending state must not auto-retry');
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM manual_publish_outbox WHERE status=?').get('published').n,1);
 const worker=readFileSync(new URL('./dist/news-worker-manual-outbox.mjs',import.meta.url),'utf8');
 assert.equal(worker.includes('runManualPublishOutbox(env)]))'),true);
 for(const key of ['runDailyContent(env,event.scheduledTime)','runSpecialContent(env,event.scheduledTime)','probeGeminiOnce(env)','run(env,event.scheduledTime)'])assert.equal(worker.includes(key),true,'existing news cron lost '+key);
 assert.equal(worker.includes("u.pathname==='/test-publish'"),true,'existing protected test endpoint lost');
 console.log('PASS manual outbox: one-shot success, concurrent claim, no replay, no retry after ambiguity, news cron unchanged');
}finally{globalThis.fetch=originalFetch;db.close()}
