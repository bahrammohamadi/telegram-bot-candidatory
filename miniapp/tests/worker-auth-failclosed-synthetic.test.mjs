import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.mjs';

// Imports the actual miniapp handler. Synthetic-only fixtures; no external calls,
// real credentials, D1 database, Telegram API, or deployed environment.
const token = 'synthetic:offline-only';
function fixture() {
  let reads = 0, writes = 0;
  const DB = {
    prepare() {
      reads++;
      return {
        bind() {
          return {
            run() { writes++; throw new Error('Unexpected DB write'); },
            all() { throw new Error('Unexpected DB read'); },
            first() { throw new Error('Unexpected DB read'); }
          };
        }
      };
    }
  };
  return { env: { BOT_TOKEN: token, DB }, counts: () => ({ reads, writes }) };
}
for (const [label, headers] of [
  ['missing Telegram initData', {}],
  ['malformed Telegram initData', { 'X-Telegram-Init-Data': 'user=%7B%22id%22%3A1%7D&auth_date=1794180000&hash=bad' }],
  ['client-supplied identity without signature', { 'X-Telegram-Init-Data': 'user=%7B%22id%22%3A999%7D&auth_date=1794180000' }]
]) {
  test(`actual miniapp worker denies ${label} before any D1 access`, async () => {
    const f = fixture();
    const res = await worker.fetch(new Request('https://synthetic.invalid/api/overview', { headers }), f.env);
    assert.equal(res.status, 401);
    assert.deepEqual(f.counts(), { reads: 0, writes: 0 });
    assert.equal(res.headers.get('cache-control'), 'no-store');
  });
}
test('actual miniapp worker fails closed when auth binding is missing', async () => {
  const f = fixture();
  const res = await worker.fetch(new Request('https://synthetic.invalid/api/overview'), { DB: f.env.DB });
  assert.equal(res.status, 503);
  assert.deepEqual(f.counts(), { reads: 0, writes: 0 });
});
