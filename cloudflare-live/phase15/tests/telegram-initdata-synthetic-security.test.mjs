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
test('rejects tampered user identity', () => assert.equal(verify(valid.replace(encodeURIComponent(userA), encodeURIComponent(userB)), token, now), false));
test('rejects incorrect token', () => assert.equal(verify(valid, token + '-wrong', now), false));
test('rejects expired auth_date', () => assert.equal(verify(valid, token, now + 301), false));
test('rejects future auth_date', () => assert.equal(verify(valid, token, now - 31), false));
test('rejects duplicate hash', () => assert.equal(verify(valid + '&hash=' + '0'.repeat(64), token, now), false));
test('rejects duplicate user parameter', () => assert.equal(verify(valid + '&user=' + encodeURIComponent(userB), token, now), false));
test('rejects malformed hash', () => assert.equal(verify(valid.replace(/hash=[^&]+/, 'hash=xyz'), token, now), false));
