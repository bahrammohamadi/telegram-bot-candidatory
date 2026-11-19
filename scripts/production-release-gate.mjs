// Offline release preflight: explicitly fail closed unless every independent gate has evidence.
// Usage: node scripts/production-release-gate.mjs path/to/evidence.json
// Never calls Cloudflare, GitHub, D1, Telegram, or a deployment endpoint.
import { readFileSync } from 'node:fs';
const required = [
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
function validEvidenceRecord(record) {
  if (record?.status !== 'passed') return false;
  try {
    const url = new URL(record.evidence_url);
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) return false;
  } catch { return false; }
  if (typeof record.verified_at !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(record.verified_at) ||
      !Number.isFinite(Date.parse(record.verified_at))) return false;
  return true;
}
export function validateEvidence(e) {
  const missing = required.filter(k => !validEvidenceRecord(e?.[k]));
  if (e?.target_worker !== 'candidatory-miniapp-api') missing.push('target_worker');
  if (e?.target_branch !== 'feature/cloudflare-parity-audit-2026-10-29') missing.push('target_branch');
  if (e?.creates_secondary_environment !== false) missing.push('creates_secondary_environment');
  return [...new Set(missing)];
}
if (process.argv[1]?.endsWith('production-release-gate.mjs')) {
  try {
    const input = JSON.parse(readFileSync(process.argv[2], 'utf8'));
    const missing = validateEvidence(input);
    if (missing.length) { console.error('BLOCKED: ' + missing.join(', ')); process.exitCode = 1; }
    else console.log('Evidence gate passed; this does NOT deploy or authorize deployment.');
  } catch (err) { console.error('BLOCKED: missing or invalid evidence file'); process.exitCode = 1; }
}
