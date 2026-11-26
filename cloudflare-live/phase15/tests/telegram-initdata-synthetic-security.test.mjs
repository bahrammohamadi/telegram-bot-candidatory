// Offline Telegram WebApp initData signature regression tests.
// No real bot token, Telegram account, or production endpoint is used.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, timingSafeEqual } from 'node:crypto';

function sign(fields, token) {
  const data = new URLSearchParams(fields);
  const check = [...data.entries()].sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => `${k}=${v}`).join('\n');
  const secret = createHmac('sha256', 'WebAppData').update(token).digest();
  data.set('hash', createHmac('sha256', secret).update(check).digest('hex'));
  return data.toString();
}
function verify(raw, token, now, maxAge = 300) {
  const params = new URLSearchParams(raw);
  const hashes = params.getAll('hash');
  if (hashes.length !== 1 || !/^[a-f0-9]{64}$/i.test(hashes[0])) return false;
  const keys = [...params.keys()];
  if (new Set(keys).size !== keys.length) return false;
  const ts = Number(params.get('auth_date'));
  if (!Number.isSafeInteger(ts) || ts > now + 30 || now - ts > maxAge) return false;
  params.delete('hash');
  const check = [...params.entries()].sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => `${k}=${v}`).join('\n');
  const secret = createHmac('sha256', 'WebAppData').update(token).digest();
  const expected = createHmac('sha256', secret).update(check).digest();
  return timingSafeEqual(expected, Buffer.from(hashes[0], 'hex'));
}
const token = '000000:synthetic-test-token-not-valid';
const now = 1794225600;
const userA = JSON.stringify({ id: 101, first_name: 'Test A' });
const userB = JSON.stringify({ id: 202, first_name: 'Test B' });
const valid = sign({ auth_date: String(now), user: userA, query_id: 'synthetic' }, token);
test('accepts synthetic valid Telegram WebApp HMAC', () => assert.equal(verify(valid, token, now), true));
test('rejects tampered user identity', () => {
  // URLSearchParams encodes spaces as '+', unlike encodeURIComponent (%20).
  // Mutate the parsed signed field, preserving the original hash, so this
  // regression actually tests an identity change rather than a no-op.
  const forged = new URLSearchParams(valid);
  assert.equal(forged.get('user'), userA);
  forged.set('user', userB);
  assert.notEqual(forged.toString(), valid);
  assert.equal(verify(forged.toString(), token, now), false);
});
test('rejects incorrect token', () => assert.equal(verify(valid, token + '-wrong', now), false));
test('rejects expired auth_date', () => assert.equal(verify(valid, token, now + 301), false));
test('rejects future auth_date', () => assert.equal(verify(valid, token, now - 31), false));
test('rejects duplicate hash', () => assert.equal(verify(valid + '&hash=' + '0'.repeat(64), token, now), false));
test('rejects duplicate user parameter', () => assert.equal(verify(valid + '&user=' + encodeURIComponent(userB), token, now), false));
test('rejects malformed hash', () => assert.equal(verify(valid.replace(/hash=[^&]+/, 'hash=xyz'), token, now), false));

test('accepts signed UTF-8 user fields without changing canonical bytes', () => {
  const unicode = sign({ auth_date: String(now), user: JSON.stringify({ id: 303, first_name: 'آزمایش' }) }, token);
  assert.equal(verify(unicode, token, now), true);
});
test('rejects signed user after adding an unsigned parameter', () => {
  assert.equal(verify(valid + '&is_admin=true', token, now), false);
});
test('rejects tampered auth_date even inside freshness window', () => {
  assert.equal(verify(valid.replace('auth_date=' + now, 'auth_date=' + (now - 1)), token, now), false);
});
test('rejects duplicate auth_date even when both timestamps match', () => {
  assert.equal(verify(valid + '&auth_date=' + now, token, now), false);
});
test('rejects missing hash and empty hash', () => {
  assert.equal(verify(valid.replace(/&hash=[^&]+/, ''), token, now), false);
  assert.equal(verify(valid.replace(/hash=[^&]+/, 'hash='), token, now), false);
});
// These tests exercise a synthetic verifier, NOT the deployed Worker implementation.
// Production release gate: separately test real Worker auth, user isolation and signed Telegram accounts.
