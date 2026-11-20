import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.mjs';

// Real handler, synthetic Telegram signatures and a strict in-memory D1 spy.
// No deployed Worker, network, or production database is contacted.
const token = 'synthetic-ownership-only';
const enc = new TextEncoder();
async function signed(userId) {
  const fields = new URLSearchParams({ auth_date: String(Math.floor(Date.now()/1000)), user: JSON.stringify({ id: userId, first_name: 'Synthetic' }) });
  const check = [...fields].sort(([a],[b])=>a.localeCompare(b,'en')).map(([k,v])=>k+'='+v).join('\n');
  const key = async bytes => crypto.subtle.importKey('raw',bytes,{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const secret = await crypto.subtle.sign('HMAC',await key(enc.encode('WebAppData')),enc.encode(token));
  const hash = await crypto.subtle.sign('HMAC',await key(secret),enc.encode(check));
  fields.set('hash',[...new Uint8Array(hash)].map(v=>v.toString(16).padStart(2,'0')).join(''));
  return fields.toString();
}
function fakeDb() {
  const calls = [];
  const DB = { prepare(sql) {
    const entry = { sql, args: [] }; calls.push(entry);
    const statement = {
      bind(...args) { entry.args = args; return statement; },
      async run() { return { meta: { changes: sql.startsWith('UPDATE tasks') ? 0 : 1 } }; },
      async first() { return null; },
      async all() { return { results: [] }; }
    };
    return statement;
  } };
  return { DB, calls };
}
test('task update cannot modify another owner task', async () => {
  const f = fakeDb(), userId = 101, otherTask = 'other-owner-task';
  const res = await worker.fetch(new Request('https://synthetic.invalid/api/tasks/'+otherTask,{
    method:'PATCH', headers:{'X-Telegram-Init-Data':await signed(userId),'content-type':'application/json'},
    body:JSON.stringify({status:'done'})
  }), {DB:f.DB,TELEGRAM_BOT_TOKEN:token});
  assert.equal(res.status,404);
  const update = f.calls.find(c=>c.sql.startsWith('UPDATE tasks'));
  assert.ok(update);
  assert.match(update.sql,/WHERE id=\? AND telegram_id=\?/);
  assert.deepEqual(update.args,['done',otherTask,String(userId)]);
});
test('overview selects are scoped to signed user, never caller supplied identity', async () => {
  const f = fakeDb(), userId = 202;
  const res = await worker.fetch(new Request('https://synthetic.invalid/api/overview?telegram_id=999',{
    headers:{'X-Telegram-Init-Data':await signed(userId),'X-Telegram-User-Id':'999'}
  }), {DB:f.DB,TELEGRAM_BOT_TOKEN:token});
  assert.equal(res.status,200);
  const selects = f.calls.filter(c=>c.sql.startsWith('SELECT'));
  assert.equal(selects.length,3);
  for(const c of selects) {
    assert.match(c.sql,/WHERE telegram_id=\?/);
    assert.deepEqual(c.args,[String(userId)]);
  }
});
