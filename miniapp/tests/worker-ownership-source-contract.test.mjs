import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Offline source contract: no Worker deployment, credentials, or production D1.
// This is a regression tripwire, NOT a substitute for runtime authorization tests.
const source=readFileSync(new URL('../src/worker.mjs',import.meta.url),'utf8');
test('task updates are scoped to authenticated Telegram identity',()=>{
 assert.match(source,/UPDATE tasks SET status=\? WHERE id=\? AND telegram_id=\?/);
 assert.match(source,/\.bind\(b\.status,taskId,id\)/);
 assert.match(source,/return r\.meta\.changes\?json\(\{ok:true\}\):fail\('Task not found',404\)/);
});
test('overview and assessment history select only own records',()=>{
 assert.match(source,/FROM tasks WHERE telegram_id=\?/);
 assert.match(source,/FROM profile WHERE telegram_id=\?/);
 assert.match(source,/FROM assessment_attempts_v2 WHERE telegram_id=\?/);
});
test('task creation uses server-validated identity rather than client owner',()=>{
 assert.match(source,/INSERT INTO tasks\(id,telegram_id,title\) VALUES\(\?,\?,\?\)/);
 assert.match(source,/\.bind\(taskId,id,b\.title\.trim\(\)\)/);
 assert.match(source,/const id=String\(user\.id\)/);
});
