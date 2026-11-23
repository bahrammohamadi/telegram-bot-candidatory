#!/usr/bin/env node
// Offline gate for a downloaded Cloudflare multipart Worker bundle.
// Usage: node scripts/check-production-bundle.mjs /path/to/worker.multipart
// Does not access Cloudflare, Telegram, D1 or any production resources.
import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
const path = process.argv[2];
if (!path) { console.error('Usage: node scripts/check-production-bundle.mjs <multipart-file>'); process.exit(2); }
const raw = readFileSync(path, 'utf8');
const boundary = raw.match(/^--([^\r\n]+)/)?.[1];
assert(boundary, 'Missing multipart boundary');
const sections = raw.split('--' + boundary).slice(1).filter(x => !/^--/.test(x.trimStart()));
const modules = new Map();
for (const section of sections) {
  const match = section.match(/Content-Disposition:[^\r\n]*name="([^"]+)"/i);
  if (!match) continue;
  const sep = section.indexOf('\r\n\r\n');
  assert(sep !== -1, 'Missing multipart header separator');
  const name = match[1];
  assert(!modules.has(name), 'Duplicate module: ' + name);
  modules.set(name, section.slice(sep + 4).replace(/\r\n$/, ''));
}
for (const name of ['entrypoint.mjs', 'legacy.mjs', 'preview.mjs']) {
  assert(modules.has(name), 'Missing required module: ' + name);
  assert(modules.get(name).trim().length > 0, 'Empty module: ' + name);
}
const entry = modules.get('entrypoint.mjs');
for (const name of ['legacy.mjs', 'preview.mjs']) {
  assert(entry.includes("'./" + name + "'") || entry.includes('"./' + name + '"'), 'Entrypoint missing import: ' + name);
}
console.log(JSON.stringify({ valid: true, moduleNames: [...modules.keys()], byteLengths: Object.fromEntries([...modules].map(([k,v]) => [k, Buffer.byteLength(v)])) }, null, 2));

/* Strict opt-in font readiness gate; no network, no production mutations.
   Usage: node scripts/check-production-bundle.mjs worker.multipart --require-self-hosted-font
   This deliberately fails the current Google Fonts-only release. */
if (process.argv.includes('--require-self-hosted-font')) {
  const preview = modules.get('preview.mjs');
  const htmlMatch = preview.match(/const TEST_PAGE=("(?:\\\\.|[^"\\\\])*");/);
  assert(htmlMatch, 'Embedded HTML constant missing');
  let html;
  try { html = JSON.parse(htmlMatch[1]); } catch { throw new Error('Embedded HTML cannot be parsed'); }
  assert(/Vazirmatn/.test(html), 'Vazirmatn family missing');
  assert(/@font-face/.test(html), 'No @font-face declaration for local font');
  assert(/\\.woff2/.test(html), 'No WOFF2 reference in HTML');
  assert(!/fonts\\.(googleapis|gstatic)\\.com/.test(html), 'External Google Fonts dependency still present');
  assert(/font-family:\\s*(?:["']?Vazirmatn)/.test(html), 'Global Vazirmatn font declaration missing');
  assert(/font\\/woff2|application\\/font-woff/.test(entry), 'Entrypoint does not serve font with an explicit font content type');
  console.log('PASS: offline self-hosted font static assertions (not a live smoke test)');
}
