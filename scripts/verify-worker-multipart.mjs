#!/usr/bin/env node
// Fail closed: verify a complete Cloudflare Worker multipart source export before release.
// Usage: node scripts/verify-worker-multipart.mjs ./worker-export.multipart
import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
const REQUIRED = ['entrypoint.mjs', 'legacy.mjs', 'preview.mjs'];
export function inspectMultipart(bytes) {
  const input = Buffer.isBuffer(bytes) ? bytes.toString('latin1') : String(bytes);
  const first = input.match(/^(--[^\r\n]+)\r?\n/);
  if (!first) throw new Error('Missing multipart boundary');
  const boundary = first[1];
  if (!input.includes(boundary + '--')) throw new Error('Missing closing boundary');
  const parts = input.split(boundary).slice(1, -1);
  const names = parts.map(part => {
    const m = part.match(/Content-Disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]+)")?/i);
    if (!m || !m[2]) throw new Error('Part without a filename');
    if (!/Content-Type:\s*application\/javascript\+module/i.test(part)) throw new Error('Non-module part: ' + m[1]);
    if (!part.includes('\r\n\r\n') && !part.includes('\n\n')) throw new Error('Missing part body');
    return m[2];
  });
  if (new Set(names).size !== names.length) throw new Error('Duplicate module filename');
  for (const name of REQUIRED) if (!names.includes(name)) throw new Error('Missing required module: ' + name);
  // Any extra modules are allowed but MUST be included in the inventory.
  return { modules: names.sort(), bytes: Buffer.byteLength(input, 'latin1') };
}
if (process.argv[2] === '--self-test') {
  const make = names => '--boundary\r\n' + names.map(n => 'Content-Disposition: form-data; name="' + n + '"; filename="' + n + '"\r\nContent-Type: application/javascript+module\r\n\r\nexport default {};\r\n--boundary\r\n').join('').replace(/--boundary\r\n$/, '--boundary--\r\n');
  assert.deepEqual(inspectMultipart(make(REQUIRED)).modules, [...REQUIRED].sort());
  assert.throws(() => inspectMultipart(make(REQUIRED.slice(0,2))), /Missing required module/);
  assert.throws(() => inspectMultipart(make([...REQUIRED, REQUIRED[0]])), /Duplicate module/);
  assert.throws(() => inspectMultipart('--boundary\r\n'), /closing boundary/);
  console.log('PASS multipart source completeness guard (4 cases)');
} else if (process.argv[2]) {
  console.log(JSON.stringify(inspectMultipart(readFileSync(process.argv[2])), null, 2));
} else {
  console.error('Usage: node scripts/verify-worker-multipart.mjs <multipart-file>|--self-test');
  process.exitCode = 2;
}
