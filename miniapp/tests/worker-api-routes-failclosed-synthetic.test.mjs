import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.mjs';

// Offline contract tests against the real handler, with synthetic bindings only.
// Never send requests to the live Worker or access a real D1 database.
const routes = [
  ['GET', '/api/overview'],
  ['GET', '/api/courses'],
  ['GET', '/api/assessment-v2'],
  ['GET', '/api/assessment-v2/history'],
  ['POST', '/api/profile'],
  ['POST', '/api/tasks'],
  ['POST', '/api/assessment-v2/submit'],
  ['POST', '/api/courses/complete']
];

for (const [method, path] of routes) {
  test(`unsigned ${method} ${path} fails before D1 access`, async () => {
    let prepares = 0;
    const env = {
      TELEGRAM_BOT_TOKEN: 'synthetic-offline-secret',
      DB: { prepare() { prepares++; throw new Error('D1 must not be accessed'); } }
    };
    const req = new Request('https://synthetic.invalid' + path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(method === 'POST' ? { body: '{}' } : {})
    });
    const response = await worker.fetch(req, env);
    assert.equal(response.status, 401);
    assert.equal(prepares, 0);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  });
}
