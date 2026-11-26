import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const file = new URL('./worker.js', import.meta.url);
const source = readFileSync(file, 'utf8');
const errors = [];
function check(name, fn) {
  try { fn(); console.log('PASS', name); }
  catch (e) { errors.push(name + ': ' + e.message); console.error('FAIL', name, e.message); }
}
function constant(name) {
  const marker = 'const ' + name + '=';
  const start = source.indexOf(marker);
  assert.ok(start >= 0, name + ' missing');
  const from = start + marker.length;
  const end = source.indexOf(';\n', from);
  assert.ok(end > from, name + ' terminator missing');
  return JSON.parse(source.slice(from, end));
}
check('Complete source, never a placeholder', () => {
  assert.ok(source.length > 200_000, 'truncated source');
  assert.ok(source.includes('export default'), 'missing Worker export');
  assert.ok(!source.includes('--- TRUNCATED ---'));
  assert.ok(!source.includes('DO NOT DEPLOY'));
});
check('No common embedded secret patterns', () => {
  for (const pattern of [
    /sk-[A-Za-z0-9_-]{20,}/,
    /gh[pousr]_[A-Za-z0-9_]{20,}/,
    /AIza[A-Za-z0-9_-]{25,}/,
    /[0-9]{8,10}:[A-Za-z0-9_-]{30,}/,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  ]) assert.ok(!pattern.test(source), 'possible credential present');
});
check('Bundled HTML/CSS/JS sections are intact', () => {
  for (const n of ['SITE_HTML','SITE_CSS','SITE_APP','SITE_OPS']) {
    const value = constant(n);
    assert.ok(value.length > 1000, n + ' unexpectedly small');
  }
});
check('RTL and accessibility basics', () => {
  const html = constant('SITE_HTML'), css = constant('SITE_CSS');
  assert.match(html, /lang="fa"/);
  assert.match(html, /dir="rtl"/);
  assert.match(html, /href="#content"/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /:focus-visible/);
});
check('Every client API name has a server handler', () => {
  const app = constant('SITE_APP');
  const calls = [...new Set([...app.matchAll(/api\("([A-Za-z0-9_]+)"/g)].map(m=>m[1]))];
  assert.ok(calls.length >= 50, 'unexpected drop in actions');
  for (const name of calls) assert.ok(source.includes('action==="' + name + '"'), name);
});
check('Professional profile and quiz features remain present', () => {
  const app = constant('SITE_APP');
  assert.ok(app.includes('candidatory-profile-v2-'));
  assert.ok(app.includes('profile-wizard-nav'));
  assert.ok(app.includes('assessment-competencies'));
  assert.ok(source.includes('candidate_profile_details'));
});
if (errors.length) {
  console.error('\nRELEASE BLOCKED (' + errors.length + ' checks failed):');
  process.exitCode = 1;
} else console.log('\nStatic parity checks passed; authenticated Telegram and mobile QA still required.');
