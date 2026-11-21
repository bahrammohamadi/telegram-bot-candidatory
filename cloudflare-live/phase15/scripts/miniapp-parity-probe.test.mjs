#!/usr/bin/env node
// Offline regression: parity probe must reject unsafe targets before any HTTP call.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const script = join(dirname(fileURLToPath(import.meta.url)), 'miniapp-parity-probe.mjs');
const cases = [
  ['missing target', ['https://main.example']],
  ['plain HTTP', ['http://main.example', 'https://test.example']],
  ['embedded credentials', ['https://user:password@main.example', 'https://test.example']],
  ['query credential', ['https://main.example?token=secret', 'https://test.example']],
  ['fragment', ['https://main.example/#token', 'https://test.example']],
  ['identical origins', ['https://main.example/a', 'https://main.example/b']],
  ['malformed URL', ['not-a-url', 'https://test.example']],
];
for (const [name, args] of cases) {
  const result = spawnSync(process.execPath, [script, ...args], {
    encoding: 'utf8', timeout: 3000, env: { PATH: process.env.PATH },
  });
  assert.equal(result.status, 2, name + ': unsafe target must be rejected');
  assert.equal(result.error, undefined, name + ': process error');
  assert.ok(!result.stdout.includes('results'), name + ': no HTTP results expected');
  console.log('PASS ' + name);
}
console.log('PASS: all seven offline parity target safety checks');
