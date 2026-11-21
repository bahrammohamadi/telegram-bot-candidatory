import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.mjs';

// Synthetic HMAC fixtures exercise the real handler without network, real D1 or credentials.
const enc = new TextEncoder();
async function signedInitData(token) {
  const auth_date = String(Math.floor(Date.now() / 1000));
  const user = JSON.stringify({ id: 424242, first_name: 'Offline' });
  const check = 'auth_date=' + auth_date + '\nuser=' + user;
  const key = await crypto.subtle.importKey('raw', enc.encode('WebAppData'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const secret = await crypto.subtle.sign('HMAC', key, enc.encode(token));
  const derived = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', derived, enc.encode(check));
  const hash = [...new Uint8Array(signature)].map(b => b.toString(16).padStart(2, '0')).join('');
  return new URLSearchParams({ auth_date, user, hash }).toString();
}
function fakeDB() {
  let writes = 0;
  return {
    db: { prepare() { return { bind() { return { async run() { writes++; return { success: true }; } }; } }; } },
    writes: () => writes
  };
}
test('production binding takes precedence over legacy BOT_TOKEN for valid signed initData', async () => {
  const db = fakeDB();
  const token = 'synthetic-production-token';
  const initData = await signedInitData(token);
  const response = await worker.fetch(new Request('https://synthetic.invalid/api/assessment-v2', {
    headers: { 'X-Telegram-Init-Data': initData }
  }), { DB: db.db, TELEGRAM_BOT_TOKEN: token, BOT_TOKEN: 'different-legacy-token' });
  assert.equal(response.status, 200);
  // Authenticated GET must be read-only; account upsert belongs to write paths.
  assert.equal(db.writes(), 0);
  assert.equal((await response.json()).version, 'v2');
});
test('legacy-only signature is rejected when production binding exists', async () => {
  const db = fakeDB();
  const initData = await signedInitData('legacy-token');
  const response = await worker.fetch(new Request('https://synthetic.invalid/api/assessment-v2', {
    headers: { 'X-Telegram-Init-Data': initData }
  }), { DB: db.db, TELEGRAM_BOT_TOKEN: 'production-token', BOT_TOKEN: 'legacy-token' });
  assert.equal(response.status, 401);
  assert.equal(db.writes(), 0);
});
