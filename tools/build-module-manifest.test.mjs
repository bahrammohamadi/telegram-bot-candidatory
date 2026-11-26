// Offline regression tests for build-module-manifest.mjs. No network, secrets or deployments.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const tool = resolve('tools/build-module-manifest.mjs');
function fixture(run) {
  const root = mkdtempSync(join(tmpdir(), 'candidatory-manifest-'));
  try { return run(root); } finally { rmSync(root, {recursive:true, force:true}); }
}
function invoke(root) { return spawnSync(process.execPath, [tool, root], {encoding:'utf8'}); }
test('deterministic manifest with byte-exact hashes and nested paths', () => fixture(root => {
  mkdirSync(join(root,'nested'));
  writeFileSync(join(root,'nested','b.js'), 'export default 1;\n');
  writeFileSync(join(root,'a.css'), 'body{}');
  const first = invoke(root), second = invoke(root);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(first.stdout, second.stdout);
  const manifest = JSON.parse(first.stdout);
  assert.equal(manifest.workerName, 'candidatory-miniapp-api');
  assert.deepEqual(manifest.modules.map(m=>m.name), ['a.css','nested/b.js']);
  for (const item of manifest.modules) assert.match(item.sha256, /^[a-f0-9]{64}$/);
  assert.equal(manifest.modules[0].sha256, createHash('sha256').update('body{}').digest('hex'));
  assert.equal(manifest.manifestSha256, createHash('sha256').update(JSON.stringify(manifest.modules)).digest('hex'));
}));
test('rejects empty directory', () => fixture(root => assert.notEqual(invoke(root).status,0)));
test('rejects unsupported file extensions', () => fixture(root => {
  writeFileSync(join(root,'private.env'),'do-not-include');
  assert.notEqual(invoke(root).status,0);
}));
test('rejects symbolic links', () => fixture(root => {
  writeFileSync(join(root,'a.js'),'ok');
  symlinkSync(join(root,'a.js'),join(root,'alias.js'));
  assert.notEqual(invoke(root).status,0);
}));
test('rejects missing argument', () => assert.notEqual(spawnSync(process.execPath,[tool],{encoding:'utf8'}).status,0));
