// Static CI policy guard: never deploy or contact a live Worker from task validation.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
test('tasks workflow is offline and cannot deploy', () => {
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/candidatory-tasks-validation.yml'), 'utf8');
  assert.match(workflow, /node --test cloudflare-live\/phase14\/\*synthetic\*\.test\.mjs/);
  assert.doesNotMatch(workflow, /\b(?:wrangler|cloudflare)\s+(?:deploy|publish|versions\s+deploy)\b/i);
  assert.doesNotMatch(workflow, /\b(?:curl|wget)\s+https?:\/\//i);
  assert.doesNotMatch(workflow, /(?:workers\.dev|pages\.dev|staging|preview|isolated.worker)/i);
  assert.doesNotMatch(workflow, /CLOUDFLARE_API_TOKEN|TELEGRAM_BOT_TOKEN|secrets\./i);
});
test('mobile browser test uses only intercepted synthetic host', () => {
  const script = fs.readFileSync(path.join(__dirname, 'tasks-mobile.cjs'), 'utf8');
  assert.match(script, /page\.route\('\*\*\/\*'/);
  assert.match(script, /page\.goto\('https:\/\/tasks\.synthetic\/'\)/);
  assert.doesNotMatch(script, /page\.goto\(['"]https:\/\/(?!tasks\.synthetic)/);
  assert.doesNotMatch(script, /workers\.dev|pages\.dev/i);
});

test('tasks workflow forbids indirect deployment and privileged tokens', () => {
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/candidatory-tasks-validation.yml'), 'utf8');
  assert.doesNotMatch(workflow, /(?:cloudflare\/wrangler-action|wrangler-action@|deploy-pages@|actions\/deploy-pages@)/i);
  assert.doesNotMatch(workflow, /(?:npm|pnpm|yarn)\s+(?:run\s+)?(?:deploy|publish)\b/i);
  assert.doesNotMatch(workflow, /(?:workflow_call|environment:\s*(?:production|staging|preview)|id-token:\s*write)/i);
  assert.doesNotMatch(workflow, /(?:CF_API_TOKEN|CLOUDFLARE_ACCOUNT_ID|GITHUB_TOKEN:\s*\$\{\{)/i);
  assert.match(workflow, /permissions:\s*\n\s*contents:\s*read/);
});
