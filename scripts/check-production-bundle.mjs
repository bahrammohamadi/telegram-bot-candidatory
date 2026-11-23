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

/* Strict opt-in font readiness gate; no network or production mutations.
   Usage: node scripts/check-production-bundle.mjs worker.multipart --require-self-hosted-font */
if (process.argv.includes('--require-self-hosted-font')) {
  const preview = modules.get('preview.mjs');
  const marker = 'const TEST_PAGE=';
  const start = preview.indexOf(marker);
  assert(start >= 0, 'Embedded HTML constant missing');
  let pos = start + marker.length + 1, escaped = false;
  for (; pos < preview.length; pos++) {
    const c = preview[pos];
    if (escaped) { escaped = false; continue; }
    if (c === '\\') { escaped = true; continue; }
    if (c === '"') break;
  }
  assert(preview[pos + 1] === ';', 'Embedded HTML string boundary missing');
  const html = JSON.parse(preview.slice(start + marker.length, pos + 1));
  assert(html.includes('Vazirmatn'), 'Vazirmatn family missing');
  assert(html.includes('@font-face'), 'No @font-face declaration for local font');
  assert(html.includes('.woff2'), 'No WOFF2 reference in HTML');
  assert(!html.includes('fonts.googleapis.com') && !html.includes('fonts.gstatic.com'), 'External Google Fonts dependency remains');
  assert(html.includes('font-family:Vazirmatn') || html.includes('font-family:"Vazirmatn"'), 'Global font declaration missing');
  // A comment containing font/woff2 is not evidence of an actual font response.\n  const executableEntry = entry.replace(/\\/\\*[\\s\\S]*?\\*\\//g, '').replace(/(^|\\s)\\/\\/[^\\n]*/g, '$1');\n  assert(/font\\/woff2/.test(executableEntry) && /content-type/i.test(executableEntry), 'Entrypoint lacks an explicit WOFF2 response content type');\n  assert(/\\.woff2|vazirmatn-font|font\\//i.test(executableEntry) && /new Response\\s*\\(/.test(executableEntry), 'Entrypoint lacks a font-serving response route');
  console.log('PASS: offline self-hosted font static checks; live smoke and CI still required');
}
