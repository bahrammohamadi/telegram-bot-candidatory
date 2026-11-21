// Additional offline release-gate regression coverage. No production calls or deployments.
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEvidence } from '../scripts/production-release-gate.mjs';

const fields = [
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
function fixture() {
  return {
    target_worker: 'candidatory-miniapp-api',
    target_branch: 'feature/cloudflare-parity-audit-2026-10-29',
    creates_secondary_environment: false,
    ...Object.fromEntries(fields.map(field => [field, {
      status: 'passed',
      evidence_url: 'https://example.invalid/synthetic/' + field,
      verified_at: '2026-11-19T00:00:00Z',
    }])),
  };
}
test('gate rejects absent, null, and non-object evidence', () => {
  for (const evidence of [null, undefined, false, '', 0, []]) {
    const failures = validateEvidence(evidence);
    assert.ok(fields.every(field => failures.includes(field)));
    assert.ok(failures.includes('target_worker'));
  }
});
test('gate rejects every missing prerequisite independently', () => {
  for (const field of fields) {
    const evidence = fixture();
    delete evidence[field];
    assert.ok(validateEvidence(evidence).includes(field), field);
  }
});
test('gate rejects any alternate worker, branch, or secondary-environment flag', () => {
  for (const [key, value] of [
    ['target_worker', 'candidatory-news-bot'],
    ['target_branch', 'main'],
    ['creates_secondary_environment', true],
    ['creates_secondary_environment', undefined],
  ]) {
    const evidence = fixture();
    evidence[key] = value;
    assert.ok(validateEvidence(evidence).includes(key), key);
  }
});
test('synthetic fully populated fixture is only a structural pass, never a deployment approval', () => {
  assert.deepEqual(validateEvidence(fixture()), []);
});
