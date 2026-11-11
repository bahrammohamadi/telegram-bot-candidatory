#!/usr/bin/env node
// Fail-closed guard for *experimental* deployment commands.
// Usage: node cloudflare-live/phase15/assert-integration-target.mjs
// Requires explicit TARGET_WORKER, TARGET_D1_NAME and TARGET_D1_ID.
// Does not print secrets, call Cloudflare, deploy, or mutate a database.
import assert from 'node:assert/strict';

const expected = Object.freeze({
  TARGET_WORKER: 'candidatory-miniapp-integration',
  TARGET_D1_NAME: 'candidatory-integration-test-20261101',
  TARGET_D1_ID: '2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0'
});
export function validateTarget(env) {
  for (const [key, value] of Object.entries(expected)) {
    assert.equal(env[key], value, 'Refusing non-integration target: ' + key);
  }
  assert.notEqual(env.TARGET_WORKER, 'candidatory-news-bot');
  // Production opt-in aliases must never silently bypass the isolated-target guard.
  const truthy = value => /^(?:1|true|yes|on)$/i.test(String(value ?? '').trim());
  for (const key of ['ALLOW_PRODUCTION','PRODUCTION_DEPLOY','DEPLOY_PRODUCTION']) {
    assert.equal(truthy(env[key]), false, 'Production authorization cannot be supplied: ' + key);
  }
  for (const key of ['TARGET_ENV','CLOUDFLARE_ENV','WRANGLER_ENV']) {
    assert.notEqual(String(env[key] ?? '').trim().toLowerCase(), 'production', 'Production environment forbidden: ' + key);
  }
  return true;
}
if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) {
  try { validateTarget(process.env); console.log('PASS integration-only target guard'); }
  catch { console.error('BLOCKED: integration target mismatch or production flag'); process.exitCode = 1; }
}
