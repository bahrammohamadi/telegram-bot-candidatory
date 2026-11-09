import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { validateInitData } from '../src/auth.mjs';

// Synthetic identities and token only. Never use real Telegram initData in CI.
globalThis.crypto = webcrypto;
const token = 'synthetic:ci-only';
const now = 1794180000;
const enc = new TextEncoder();
async function signed(fields) {
  const params = new URLSearchParams(fields);
  const check = [...params].filter(([key]) => key !== 'hash' && key !== 'signature')
    .sort(([a], [b]) => a.localeCompare(b, 'en'))
    .map(([key, value]) => key + '=' + value).join('\n');
  const key = await crypto.subtle.sign('HMAC',
    await crypto.subtle.importKey('raw', enc.encode('WebAppData'),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']), enc.encode(token));
  const digest = await crypto.subtle.sign('HMAC',
    await crypto.subtle.importKey('raw', key,
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']), enc.encode(check));
  params.set('hash', Buffer.from(digest).toString('hex'));
  return params.toString();
}
const user = JSON.stringify({ id: 321, first_name: 'Synthetic' });
test('signed initData accepts clock boundaries and rejects future/expired timestamps', async () => {
  for (const date of [now - 3600, now + 60])
    assert.equal((await validateInitData(await signed([['auth_date', String(date)], ['user', user]]), token, now))?.id, 321);
  for (const date of [now - 3601, now + 61])
    assert.equal(await validateInitData(await signed([['auth_date', String(date)], ['user', user]]), token, now), null);
});
test('signed malformed, non-positive and unsafe user ids are rejected', async () => {
  for (const value of ['not-json', 'null', '{}', '{"id":0}', '{"id":-1}', '{"id":"321"}', '{"id":9007199254740992}']) {
    const data = await signed([['auth_date', String(now)], ['user', value]]);
    assert.equal(await validateInitData(data, token, now), null, value);
  }
});
test('duplicate Telegram fields are rejected even when signed', async () => {
  for (const key of ['auth_date', 'user', 'query_id']) {
    const fields = [['auth_date', String(now)], ['user', user], ['query_id', 'test']];
    fields.push([key, fields.find(([k]) => k === key)[1]]);
    assert.equal(await validateInitData(await signed(fields), token, now), null, key);
  }
});
test('modified user, wrong bot token and malformed hashes are rejected', async () => {
  const data = await signed([['auth_date', String(now)], ['user', user]]);
  assert.equal(await validateInitData(data, 'different:token', now), null);
  assert.equal(await validateInitData(data.replace('Synthetic', 'Attacker'), token, now), null);
  for (const hash of ['0'.repeat(64), 'g'.repeat(64), 'abc']) {
    const modified = new URLSearchParams(data); modified.set('hash', hash);
    assert.equal(await validateInitData(modified.toString(), token, now), null);
  }
});
test('a signed signature field does not bypass hash verification', async () => {
  const data = await signed([['auth_date', String(now)], ['user', user], ['signature', 'synthetic-ed25519-placeholder']]);
  assert.equal((await validateInitData(data, token, now))?.id, 321);
  const modified = new URLSearchParams(data); modified.set('user', JSON.stringify({ id: 322 }));
  assert.equal(await validateInitData(modified.toString(), token, now), null);
});
