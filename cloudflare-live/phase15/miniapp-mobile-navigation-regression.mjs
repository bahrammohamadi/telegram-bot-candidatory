// Isolated Mini App mobile/navigation regression. No real Telegram account or network.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('./dist/integration-progress-tasks-worker.mjs',import.meta.url),'utf8');
const match=src.match(/^const TEST_PAGE=(.+);$/m);
assert.ok(match,'assembled Worker must contain one embedded Mini App document');
const page=JSON.parse(match[1]);
assert.match(page,/<html[^>]*lang="fa"[^>]*dir="rtl"/i,'Persian RTL document');
assert.match(page,/<meta name="viewport" content="[^"]*width=device-width[^\"]*"/i,'mobile viewport');
assert.match(page,/viewport-fit=cover/,'Telegram safe-area viewport');
assert.match(page,/:focus-visible/,'keyboard focus must remain visible');
assert.match(page,/min-height:46px/,'touch controls must retain 46px target height');
assert.match(page,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/,'mobile module grid');
const ids=[...page.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
const unique=new Set(ids);
assert.equal(unique.size,ids.length,'duplicate DOM IDs break Mini App navigation');
for(const id of ['dashboard','tasks-panel','tasks-list','tasks-close','progress-panel','progress-cards','progress-export','progress-close','goals-panel']){
 assert.ok(unique.has(id),'missing integrated navigation control: '+id);
}
for(const route of ['/api/tasks','/api/progress','/api/goals']){
 assert.ok(page.includes("fetch('"+route+"'"),'Mini App must call its own origin: '+route);
}
assert.ok(page.includes('وظایف شخصی'),'task metrics must appear inside progress view');
assert.ok(page.includes('وظایف: '),'task metrics must be included in progress export');
assert.ok(!/fetch\(['"]https?:\/\//i.test(page),'app API calls must not bypass isolated origin');
console.log('PASS: one Persian RTL mobile Mini App with unique navigation IDs, task/progress UI, focus/touch affordances and same-origin APIs');
console.log('BOUNDARY: static navigation checks do not replace real-device or two-account Telegram WebView testing');
