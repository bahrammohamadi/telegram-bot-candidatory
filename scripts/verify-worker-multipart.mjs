#!/usr/bin/env node
// Fail closed: inspect Cloudflare Worker multipart exports before production upload.
import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
const REQUIRED = ['entrypoint.mjs', 'legacy.mjs', 'preview.mjs'];

export function inspectMultipart(bytes, { requireMetadata = false } = {}) {
  const input = Buffer.isBuffer(bytes) ? bytes.toString('latin1') : String(bytes);
  const first = input.match(/^(--[^\r\n]+)\r?\n/);
  if (!first) throw new Error('Missing multipart boundary');
  const boundary = first[1];
  if (!input.endsWith(boundary + '--\r\n') && !input.endsWith(boundary + '--\n') && !input.endsWith(boundary + '--'))
    throw new Error('Missing closing boundary');
  const parts = input.split(boundary);
  if (parts.length < 3 || !parts.at(-1)?.startsWith('--')) throw new Error('Malformed multipart');
  const modules = [];
  let metadata = null;
  for (const part of parts.slice(1, -1)) {
    const separator = part.includes('\r\n\r\n') ? '\r\n\r\n' : '\n\n';
    const index = part.indexOf(separator);
    if (index < 0) throw new Error('Missing part body');
    const headers = part.slice(0, index);
    const body = part.slice(index + separator.length).replace(/\r?\n$/, '');
    const match = headers.match(/Content-Disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]+)")?/i);
    if (!match) throw new Error('Missing part disposition');
    const [, name, filename] = match;
    if (name === 'metadata') {
      if (metadata !== null || filename) throw new Error('Duplicate or invalid metadata');
      try { metadata = JSON.parse(body); } catch { throw new Error('Invalid metadata JSON'); }
      if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) throw new Error('Invalid metadata object');
      continue;
    }
    if (!filename || filename !== name || !/^[a-zA-Z0-9_.-]+\.mjs$/.test(filename))
      throw new Error('Invalid module filename: ' + name);
    if (!/Content-Type:\s*application\/javascript\+module/i.test(headers))
      throw new Error('Non-module part: ' + name);
    if (!body.trim()) throw new Error('Empty module body: ' + name);
    modules.push(filename);
  }
  if (new Set(modules).size !== modules.length) throw new Error('Duplicate module filename');
  for (const name of REQUIRED) if (!modules.includes(name)) throw new Error('Missing required module: ' + name);
  if (requireMetadata && metadata === null) throw new Error('Production artifact missing metadata');
  if (requireMetadata && (typeof metadata.main_module !== 'string' || !metadata.main_module)) throw new Error('Production artifact missing main_module');
  if (metadata?.main_module && !modules.includes(metadata.main_module)) throw new Error('Metadata main_module missing');
  return { modules: modules.sort(), bytes: Buffer.byteLength(input, 'latin1'), hasMetadata: metadata !== null };
}

if (process.argv[2] === '--self-test') {
  const make = (names, meta) => {
    const entries = [
      ...(meta === undefined ? [] : [['metadata', null, 'application/json', meta]]),
      ...names.map(n => [n, n, 'application/javascript+module', 'export default {};'])
    ];
    return '--boundary\r\n' + entries.map(([name, filename, type, body]) =>
      'Content-Disposition: form-data; name="' + name + '"' + (filename ? '; filename="' + filename + '"' : '') +
      '\r\nContent-Type: ' + type + '\r\n\r\n' + body + '\r\n').join('--boundary\r\n') + '--boundary--\r\n';
  };
  assert.deepEqual(inspectMultipart(make(REQUIRED)).modules, [...REQUIRED].sort());
  assert.equal(inspectMultipart(make(REQUIRED, '{"main_module":"entrypoint.mjs"}'), { requireMetadata: true }).hasMetadata, true);
  assert.throws(() => inspectMultipart(make(REQUIRED), { requireMetadata: true }), /missing metadata/);
  assert.throws(() => inspectMultipart(make(REQUIRED, '{}'), { requireMetadata: true }), /missing main_module/);
  assert.throws(() => inspectMultipart(make(REQUIRED, '{invalid}')), /Invalid metadata JSON/);
  assert.throws(() => inspectMultipart(make(REQUIRED, '{"main_module":"missing.mjs"}')), /main_module missing/);
  assert.throws(() => inspectMultipart(make(REQUIRED.slice(0, 2))), /Missing required module/);
  assert.throws(() => inspectMultipart(make([...REQUIRED, REQUIRED[0]])), /Duplicate module/);
  assert.throws(() => inspectMultipart('--boundary\r\n'), /closing boundary/);
  assert.throws(() => inspectMultipart(make(REQUIRED).replace('export default {};', '')), /Empty module body/);
  assert.throws(() => inspectMultipart(make(REQUIRED).replace('application/javascript+module', 'text/plain')), /Non-module/);
  console.log('PASS multipart completeness guard (11 cases)');
} else if (process.argv[2]) {
  console.log(JSON.stringify(inspectMultipart(readFileSync(process.argv[2]), { requireMetadata: true }), null, 2));
} else {
  console.error('Usage: node scripts/verify-worker-multipart.mjs <multipart-file>|--self-test');
  process.exitCode = 2;
}
