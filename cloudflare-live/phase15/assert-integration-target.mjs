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
  // Fail closed: unknown non-empty opt-in values must not silently pass.
  // Only explicit false/off/0/no (or an unset variable) are safe.
  const disabled = value => value == null || /^(?:|0|false|no|off)$/i.test(String(value).trim());
  for (const key of ['ALLOW_PRODUCTION','PRODUCTION_DEPLOY','DEPLOY_PRODUCTION']) {
    assert.equal(disabled(env[key]), true, 'Production authorization cannot be supplied: ' + key);
  }
  for (const key of ['TARGET_ENV','CLOUDFLARE_ENV','WRANGLER_ENV']) {
    const selected = String(env[key] ?? '').trim().toLowerCase();
    assert.ok(['', 'integration', 'staging', 'test', 'testing', 'development', 'dev'].includes(selected), 'Unknown or production environment forbidden: ' + key);
  }
  return true;
}
if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) {
  try { validateTarget(process.env); console.log('PASS integration-only target guard'); }
  catch { console.error('BLOCKED: integration target mismatch or production flag'); process.exitCode = 1; }
}
