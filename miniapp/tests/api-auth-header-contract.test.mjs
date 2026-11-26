import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

// Synthetic request only: never contacts Telegram or Production.
const source = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const apiFunction = source.match(/^async function api\(path,options=\{\}\)\{[^\n]+\}/m);
assert.ok(apiFunction, 'api helper must exist');

test('Telegram init data cannot be overridden by caller headers', async () => {
  let captured;
  const api = runInNewContext(apiFunction[0] + ';api', {
    initData: 'trusted-synthetic-init-data',
    fetch: async (url, options) => {
      captured = { url, options };
      return { ok: true, json: async () => ({ ok: true }) };
    },
    Error,
  });
  await api('overview', { headers: { 'X-Telegram-Init-Data': 'forged', 'content-type': 'text/plain', 'X-Trace': 'fixture' } });
  assert.equal(captured.url, '/api/overview');
  assert.equal(captured.options.headers['X-Telegram-Init-Data'], 'trusted-synthetic-init-data');
  assert.equal(captured.options.headers['content-type'], 'application/json');
  assert.equal(captured.options.headers['X-Trace'], 'fixture');
});
