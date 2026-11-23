#!/usr/bin/env node
// Purely offline regression tests for the production multipart gate.
// No Telegram/Cloudflare/D1 calls; synthetic bundle only.
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const gate = new URL('../check-production-bundle.mjs', import.meta.url).pathname;
const entry = "import legacy from './legacy.mjs'; import preview from './preview.mjs'; export default {fetch(request){if(new URL(request.url).pathname==='/assets/vazirmatn.woff2')return new Response('synthetic font',{headers:{'content-type':'font/woff2'}});return new Response('ok')}};";
function fixture({ font = true, external = false, omit = '' } = {}) {
  const css = font ? '@font-face{font-family:Vazirmatn;src:url(/assets/vazirmatn.woff2)}html,body{font-family:Vazirmatn,sans-serif}' : 'body{font-family:Tahoma}';
  const link = external ? '<link href="https://fonts.googleapis.com/css2?family=Vazirmatn">' : '';
  const html = '<html><head>' + link + '<style>' + css + '</style></head><body>امروز</body></html>';
  const modules = { 'entrypoint.mjs': entry, 'legacy.mjs': 'export default {}', 'preview.mjs': 'const TEST_PAGE=' + JSON.stringify(html) + '; export default {}' };
  const boundary = 'synthetic-test-boundary';
  return Object.entries(modules).filter(([name]) => name !== omit).map(([name, source]) => '--' + boundary + '\r\nContent-Disposition: form-data; name="' + name + '"; filename="' + name + '"\r\nContent-Type: application/javascript+module\r\n\r\n' + source + '\r\n').join('') + '--' + boundary + '--\r\n';
}
function run(bundle, strict = false) {
  const dir = mkdtempSync(join(tmpdir(), 'candidatory-static-'));
  try {
    const file = join(dir, 'bundle.multipart');
    writeFileSync(file, bundle);
    return spawnSync(process.execPath, [gate, file, ...(strict ? ['--require-self-hosted-font'] : [])], { encoding: 'utf8', timeout: 10000 });
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
test('valid synthetic three-module bundle passes', () => {
  const r = run(fixture());
  assert.equal(r.status, 0, r.stderr);
});
test('missing production module fails closed', () => {
  const r = run(fixture({ omit: 'legacy.mjs' }));
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /Missing required module/);
});
test('same-origin font bundle passes strict static gate', () => {
  const r = run(fixture(), true);
  assert.equal(r.status, 0, r.stderr);
});
test('external font dependency fails strict gate', () => {
  const r = run(fixture({ external: true }), true);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /External Google Fonts dependency/);
});
test('missing font face fails strict gate', () => {
  const r = run(fixture({ font: false }), true);
  assert.notEqual(r.status, 0);
});

test('comment-only WOFF2 MIME claim fails strict gate', () => {
  const fake = fixture().replace(entry, "import legacy from './legacy.mjs'; import preview from './preview.mjs'; export default {fetch(){return new Response('ok')}}; // font/woff2");
  const r = run(fake, true);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /Entrypoint lacks an explicit WOFF2 response content type/);
});
