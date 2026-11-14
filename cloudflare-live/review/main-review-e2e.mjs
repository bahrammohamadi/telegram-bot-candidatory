import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import router from './dist/entrypoint.mjs';
import legacy from './dist/legacy.mjs';

const sql=new DatabaseSync(':memory:');
sql.exec(readFileSync(new URL('../integration-schema.sql',import.meta.url),'utf8'));
sql.exec(readFileSync(new URL('../phase13/assistant-migration.sql',import.meta.url),'utf8'));
sql.exec(readFileSync(new URL('../phase14/tasks-migration.sql',import.meta.url),'utf8'));
const REVIEW_DB={
 prepare(query){const s=sql.prepare(query);return {
  bind(...p){return {
   async first(){return s.get(...p)||null},
   async all(){return {results:s.all(...p)}},
   async run(){const r=s.run(...p);return {meta:{changes:r.changes}}}
  }},
  async first(){return s.get()||null},
  async all(){return {results:s.all()}},
  async run(){const r=s.run();return {meta:{changes:r.changes}}}
 }},
 async batch(stmts){sql.exec('BEGIN');try{const results=[];for(const stmt of stmts)results.push(await stmt.run());sql.exec('COMMIT');return results}catch(e){sql.exec('ROLLBACK');throw e}}
};
let productionTouched=0;
const DB=new Proxy({}, {get(){productionTouched++;throw Error('PRODUCTION_DB_MUST_NOT_BE_USED_IN_REVIEW')}});
const token='123456789:SYNTHETIC_MAIN_BOT_TOKEN';
const env={DB,REVIEW_DB,TELEGRAM_BOT_TOKEN:token,AI:{run(){throw Error('NO_PAID_AI_IN_REVIEW')}},AI_ENABLED:'true',ADMIN_TELEGRAM_IDS:'1,2'};
const origin='https://main-bot.synthetic';
const req=(path,body)=>new Request(origin+path,body===undefined?{method:'GET'}:{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
const signed=id=>{
 const p=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id,first_name:'Synthetic'}),signature:'test'});
 const check=[...p.entries()].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>k+'='+v).join('\n');
 const secret=createHmac('sha256','WebAppData').update(token).digest();
 p.set('hash',createHmac('sha256',secret).update(check).digest('hex'));
 return p.toString();
};
const main=await router.fetch(req('/'),env);
assert.equal(main.status,200);
const mainHtml=await main.text();
assert.match(mainHtml,/پیش‌نمایش امکانات جدید — برای دریافت نظر/);
assert.match(mainHtml,/href="\/review"/);
assert.match(mainHtml,/<title>کاندیداتوری هوشمند<\/title>/);
assert.ok(!mainHtml.includes('main-review-notice'),'main home remains legacy');
const oldScript=await legacy.fetch(req('/app.js'),env);
const routedScript=await router.fetch(req('/app.js'),env);
assert.equal(await routedScript.text(),await oldScript.text(),'production app JS byte-identical');
const originalCss=await legacy.fetch(req('/style.css'),env);
const routedCss=await router.fetch(req('/style.css'),env);
const css=await routedCss.text();
assert.ok(css.startsWith(await originalCss.text()),'production CSS prefix byte-identical');
assert.ok(css.includes('.candidatory-review-entry'));
const previewPage=await router.fetch(req('/review'),env);
assert.equal(previewPage.status,200);
assert.match(previewPage.headers.get('x-robots-tag'),/noindex/);
const previewHtml=await previewPage.text();
for(const marker of ['id="tasks-panel"','id="assistant-panel"','id="studio-panel"','id="membership-panel"','id="progress-panel"'])assert.ok(previewHtml.includes(marker),marker);
assert.match(previewHtml,/پیش‌نمایش امکانات جدید کاندیداتوری/);
assert.match(previewHtml,/دیتابیس آزمایشی/);
assert.ok(previewHtml.includes("fetch('/review/api/tasks'"));
assert.ok(!previewHtml.includes("fetch('/api/tasks'"));
assert.equal((await router.fetch(req('/review/api/tasks',{action:'list',initData:'invalid'}),env)).status,401);
assert.equal((await router.fetch(req('/review/api/assistant',{action:'status',initData:'invalid'}),env)).status,401);
const initData=signed(9107123001);
const status=await router.fetch(req('/review/api/assistant',{action:'status',initData}),env);
assert.equal(status.status,200);
const model=await status.json();
assert.equal(model.ai_available,false);
assert.equal(model.mode,'guided_only');
assert.equal((await router.fetch(req('/review/api/assistant',{action:'ask',initData,task:'agenda',question:'یک جلسه عمومی را چگونه تنظیم کنیم؟'}),env)).status,503);
const details={title:'Synthetic private review task',details:'Not real user data',priority:'normal',due_date:'2026-12-01'};
const created=await router.fetch(req('/review/api/tasks',{action:'create',initData,...details}),env);
assert.equal(created.status,201,await created.clone().text());
const list=await router.fetch(req('/review/api/tasks',{action:'list',initData}),env);
assert.equal(list.status,200);
assert.equal((await list.json()).tasks.length,1);
const other=await router.fetch(req('/review/api/tasks',{action:'list',initData:signed(9107123002)}),env);
assert.equal((await other.json()).tasks.length,0,'separate main-bot signed users do not share tasks');
const forged=new URLSearchParams(signed(9107123001));forged.set('signature','forged');
assert.equal((await router.fetch(req('/review/api/tasks',{action:'list',initData:forged.toString()}),env)).status,401);
assert.equal(productionTouched,0,'review path must not query production database');
assert.equal((await router.fetch(req('/review/not-a-route'),env)).status,404);
sql.close();
console.log('PASS: original main bot untouched on legacy APIs, review link available, main-bot HMAC accepted, isolated D1, AI forcibly off, owner privacy and spoof rejection');
