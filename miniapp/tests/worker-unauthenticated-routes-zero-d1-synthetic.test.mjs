import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.mjs';

// Negative authentication regression against the real handler, entirely offline.
// Every route below is synthetic and must reject before even preparing a D1 query.
const routes = [
  ['GET', '/api/overview'],
  ['GET', '/api/courses'],
  ['GET', '/api/assessment-v2/history'],
  ['POST', '/api/profile'],
  ['POST', '/api/tasks'],
  ['PATCH', '/api/tasks/synthetic-other-owner'],
  ['POST', '/api/courses/complete'],
  ['POST', '/api/assessment-v2/submit']
];
for (const [method, path] of routes) {
  test(`unauthenticated ${method} ${path} never touches D1`, async () => {
    let preparations = 0;
    const DB = { prepare() { preparations++; throw Error('D1 MUST NOT BE CALLED'); } };
    const response = await worker.fetch(new Request('https://synthetic.invalid' + path, {
      method,
      headers: { 'content-type': 'application/json', 'X-Telegram-User-Id': '999999' },
      ...(method === 'GET' ? {} : { body: '{}' })
    }), { DB, TELEGRAM_BOT_TOKEN: 'synthetic-offline-token' });
    assert.equal(response.status, 401);
    assert.equal(preparations, 0);
    const payload = await response.json();
    assert.equal(payload.error, 'Telegram authentication required');
    assert.equal(response.headers.get('cache-control'), 'no-store');
  });
}
