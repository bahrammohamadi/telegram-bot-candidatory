// Offline, fail-closed evidence gate. Does not deploy or contact production.
// Usage: node tools/check-production-evidence.mjs path/to/evidence.json
// A PASS is necessary but NEVER sufficient for deployment; human review is required.
import { readFileSync } from 'node:fs';
const required = [
  'repositorySha','ciRunUrl','ciConclusion','workerName','productionVersionId',
  'productionDeploymentId','moduleManifestSha256','bindingsReviewed',
  'd1SchemaReviewed','secretsNamesReviewed','routesReviewed',
  'rbacHandlerTestsPassed','securityChecksPassed','rollbackArtifactSha256',
  'rollbackProcedureReviewed','productionSmokePlanReviewed'
];
const fail = (message) => { console.error('BLOCKED: '+message); process.exitCode=1; };
if (process.argv.length !== 3) {
  fail('provide exactly one local evidence JSON path (no network or secrets)');
} else {
  try {
    const evidence=JSON.parse(readFileSync(process.argv[2],'utf8'));
    const missing=required.filter(k => evidence[k]===undefined || evidence[k]===null || evidence[k]==='');
    const requiredTrue=['bindingsReviewed','d1SchemaReviewed','secretsNamesReviewed','routesReviewed','rbacHandlerTestsPassed','securityChecksPassed','rollbackProcedureReviewed','productionSmokePlanReviewed'];
    const bad=requiredTrue.filter(k=>evidence[k]!==true);
    if(evidence.workerName!=='candidatory-miniapp-api') bad.push('workerName');
    if(evidence.ciConclusion!=='success') bad.push('ciConclusion');
    if(!/^https:\/\/github\.com\/bahrammohamadi\/telegram-bot-candidatory\/actions\/runs\/\d+$/.test(evidence.ciRunUrl||'')) bad.push('ciRunUrl');
    for(const k of ['moduleManifestSha256','rollbackArtifactSha256']) if(!/^[a-f0-9]{64}$/.test(evidence[k]||'')) bad.push(k);
    if(!/^[a-f0-9]{40}$/.test(evidence.repositorySha||'')) {
      // Git commit SHA-1 is 40 hex characters; no SHA-256 substitution.
      bad.push('repositorySha');
    }
    const errors=[...new Set([...missing,...bad])];
    if(errors.length) fail('missing/invalid evidence: '+errors.join(', '));
    else console.log('EVIDENCE COMPLETE (offline only; not authorization to deploy)');
  } catch(err) { fail('unreadable evidence JSON: '+err.message); }
}
