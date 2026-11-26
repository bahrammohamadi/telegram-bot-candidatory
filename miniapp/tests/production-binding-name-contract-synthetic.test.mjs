import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.mjs';

// Offline regression for production binding names, never values or live services.
test('production Telegram binding is recognized; unsigned requests fail before D1 access', async () => {
  let touches = 0;
  const DB = { prepare() { touches++; throw new Error('Unexpected D1 access'); } };
  const env = { DB, REVIEW_DB: DB, TELEGRAM_BOT_TOKEN: 'synthetic:not-a-secret' };
  const res = await worker.fetch(new Request('https://synthetic.invalid/api/overview'), env);
  assert.equal(res.status, 401);
  assert.equal(touches, 0);
  assert.equal((await res.json()).error, 'Telegram authentication required');
});

test('missing Telegram token fails closed before D1 access', async () => {
  let touches = 0;
  const DB = { prepare() { touches++; throw new Error('Unexpected D1 access'); } };
  const res = await worker.fetch(new Request('https://synthetic.invalid/api/overview'), { DB });
  assert.equal(res.status, 503);
  assert.equal(touches, 0);
  assert.equal((await res.json()).error, 'Service not configured');
});

test('public health handler is read-only with synthetic production bindings', async () => {
  let touches = 0;
  const env = { DB: { prepare() { touches++; throw new Error('Unexpected D1 access'); } } };
  const res = await worker.fetch(new Request('https://synthetic.invalid/health'), env);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: 'ok', database: true });
  assert.equal(touches, 0);
});
