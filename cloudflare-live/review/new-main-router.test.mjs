// No network, no production credentials, no production DB access.
// Run: node --test cloudflare-live/review/new-main-router.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('./new-main-entrypoint.mjs',import.meta.url),'utf8');
const seen=[];
const legacy={fetch(){throw Error('Legacy app was dispatched!')}};
const preview={async fetch(req,env){
 seen.push({url:req.url,env});
 if(new URL(req.url).pathname==='/')return new Response('<html><body><section class="main-review-notice">old review banner</section><h1>پیش‌نمایش امکانات جدید کاندیداتوری</h1><main>NEW_DASHBOARD</main></body></html>',{headers:{'content-type':'text/html'}});
 return new Response(JSON.stringify({ok:true}),{headers:{'content-type':'application/json'}});
}};
const compiled=source.replace("import legacy from './legacy.mjs';",'').replace("import preview from './preview.mjs';",'').replace('export default','return');
const worker=new Function('legacy','preview',compiled)(legacy,preview);
const env={REVIEW_DB:{test:true},TELEGRAM_BOT_TOKEN:'test-only-token',DB:{old:true},AI:{danger:true}};
test('new dashboard is the only default root, with no legacy or preview banner',async()=>{
 const r=await worker.fetch(new Request('https://example.test/'),env,{});
 assert.equal(r.status,200);
 const html=await r.text();
 assert.match(html,/NEW_DASHBOARD/);
 assert.doesNotMatch(html,/main-review-notice|پیش‌نمایش امکانات جدید/);
 assert.equal(r.headers.get('cache-control'),'no-store');
 assert.equal(seen.at(-1).env.DB,env.REVIEW_DB);
 assert.equal(seen.at(-1).env.AI,undefined);
 assert.equal(seen.at(-1).env.AI_ENABLED,'false');
});
test('legacy cannot be opened through public route',async()=>{
 assert.equal((await worker.fetch(new Request('https://example.test/legacy'),env,{})).status,410);
});
test('old review entry redirects to the new default',async()=>{
 const r=await worker.fetch(new Request('https://example.test/review'),env,{});
 assert.equal(r.status,302);
 assert.equal(r.headers.get('location'),'https://example.test/');
});
test('signed API paths go to the new isolated module, never legacy',async()=>{
 const r=await worker.fetch(new Request('https://example.test/review/api/tasks',{method:'POST',body:'{}'}),env,{});
 assert.equal(r.status,200);
 assert.equal(new URL(seen.at(-1).url).pathname,'/api/tasks');
 assert.equal(seen.at(-1).env.DB,env.REVIEW_DB);
});
test('missing new database is fail-closed',async()=>{
 const r=await worker.fetch(new Request('https://example.test/'),{TELEGRAM_BOT_TOKEN:'x'},{});
 assert.equal(r.status,503);
});
