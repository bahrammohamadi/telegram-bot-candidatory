// Synthetic, offline contract tests for the fail-closed production release evidence gate.
// Run: node --test tests/production-release-gate.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEvidence } from '../scripts/production-release-gate.mjs';

const keys = [
  'architecture_18_chapters_versioned',
  'github_head_verified',
  'ci_passed_for_exact_head',
  'production_modules_manifest_verified',
  'production_bindings_d1_routes_metadata_verified',
  'rbac_handler_tests_passed',
  'security_tests_passed',
  'rollback_artifact_verified',
  'rollback_procedure_verified',
  'production_readonly_smoke_passed',
];
const valid = () => ({
  target_worker: 'candidatory-miniapp-api',
  target_branch: 'feature/cloudflare-parity-audit-2026-10-29',
  creates_secondary_environment: false,
  ...Object.fromEntries(keys.map(k => [k, {
    status: 'passed',
    evidence_url: 'https://example.invalid/synthetic/' + k,
    verified_at: '2026-11-19T00:00:00Z',
  }])),
});
test('complete synthetic evidence passes schema gate only', () => {
  assert.deepEqual(validateEvidence(valid()), []);
});
test('missing evidence object fails closed', () => {
  assert.ok(validateEvidence(undefined).length >= keys.length);
});
for (const key of keys) {
  test('rejects missing or failed evidence: ' + key, () => {
    for (const alteration of [undefined, { status: 'failed', evidence_url: 'x', verified_at: 'x' }, { status: 'passed', evidence_url: '', verified_at: 'x' }, { status: 'passed', evidence_url: 'x', verified_at: '' }]) {
      const e = valid();
      e[key] = alteration;
      assert.ok(validateEvidence(e).includes(key));
    }
  });
}
test('rejects alternate worker, branch and any secondary environment', () => {
  const e = valid();
  e.target_worker = 'candidatory-news-bot';
  e.target_branch = 'main';
  e.creates_secondary_environment = true;
  const failures = validateEvidence(e);
  assert.ok(failures.includes('target_worker'));
  assert.ok(failures.includes('target_branch'));
  assert.ok(failures.includes('creates_secondary_environment'));
});
test('rejects missing secondary-environment declaration', () => {
  const e = valid();
  delete e.creates_secondary_environment;
  assert.ok(validateEvidence(e).includes('creates_secondary_environment'));
});

test('rejects non-HTTPS, credential-bearing and malformed evidence URLs', () => {
  for (const url of [
    'http://github.com/example/run',
    'https://user:password@github.com/example/run',
    'javascript:alert(1)',
    'not-a-url',
    '',
  ]) {
    const e = valid();
    e.ci_passed_for_exact_head.evidence_url = url;
    assert.ok(validateEvidence(e).includes('ci_passed_for_exact_head'), url);
  }
});
test('rejects malformed or non-UTC evidence timestamps', () => {
  for (const timestamp of [
    '2026-11-19T00:00:00+02:00',
    '2026-11-19',
    '2026-99-99T00:00:00Z',
    'not-a-date',
    '',
  ]) {
    const e = valid();
    e.rollback_artifact_verified.verified_at = timestamp;
    assert.ok(validateEvidence(e).includes('rollback_artifact_verified'), timestamp);
  }
});
