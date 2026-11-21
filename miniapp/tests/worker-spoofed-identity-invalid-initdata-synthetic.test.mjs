import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.mjs';

// Offline, real-router regression: a client-controlled user-id header must not
// upgrade a malformed Telegram initData payload into an authenticated session.
// No network, live account, or real D1 database is used.
const cases = [
  ['missing initData', undefined],
  ['empty initData', ''],
  ['unsigned initData', 'user=%7B%22id%22%3A999999%7D&auth_date=1700000000'],
  ['fabricated hash', 'user=%7B%22id%22%3A999999%7D&auth_date=1700000000&hash=' + '0'.repeat(64)]
];
for (const [label, initData] of cases) {
  for (const [method, route] of [['GET', '/api/overview'], ['POST', '/api/tasks']]) {
    test(`${label}: ${method} ${route} rejects spoofed identity before D1`, async () => {
      let d1Calls = 0;
      const headers = {
        'X-Telegram-User-Id': '999999',
        'X-User-Id': '999999',
        'content-type': 'application/json'
      };
      if (initData !== undefined) headers['X-Telegram-Init-Data'] = initData;
      const response = await worker.fetch(
        new Request('https://synthetic.invalid' + route, {
          method, headers, ...(method === 'GET' ? {} : { body: '{}' })
        }),
        {
          DB: { prepare() { d1Calls++; throw Error('unexpected D1 access'); } },
          TELEGRAM_BOT_TOKEN: 'synthetic-offline-token'
        }
      );
      assert.equal(response.status, 401);
      assert.equal(d1Calls, 0);
      assert.equal(response.headers.get('cache-control'), 'no-store');
    });
  }
}
