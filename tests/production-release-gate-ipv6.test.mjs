import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEvidence } from '../scripts/production-release-gate.mjs';

const keys = [
  'architecture_18_chapters_versioned','github_head_verified','ci_passed_for_exact_head',
  'production_modules_manifest_verified','production_bindings_d1_routes_metadata_verified',
  'rbac_handler_tests_passed','security_tests_passed','rollback_artifact_verified',
  'rollback_procedure_verified','production_readonly_smoke_passed'
];
function evidence(host) {
  return {
    target_worker:'candidatory-miniapp-api',
    target_branch:'feature/cloudflare-parity-audit-2026-10-29',
    creates_secondary_environment:false,
    ...Object.fromEntries(keys.map(k => [k, {
      status:'passed',evidence_url:'https://' + host + '/proof',
      verified_at:'2026-11-01T00:00:00Z'
    }]))
  };
}
for (const host of ['[fc00::1]','[fd12::1]','[fe80::1]','[ff02::1]']) {
  test('reject IPv6 nonpublic evidence host '+host, () => {
    assert.ok(validateEvidence(evidence(host)).length > 0);
  });
}
test('allow syntactically valid public evidence host (not authenticity proof)', () => {
  assert.deepEqual(validateEvidence(evidence('github.com')), []);
});
