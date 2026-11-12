#!/usr/bin/env node
// Offline artifact manifest builder. Never reads or writes Cloudflare resources.
// Usage: node scripts/build-worker-manifest.mjs <module-root> <main-module> [module names...]
// Emits JSON to stdout only; no secrets or module source is printed.
import { readFileSync, lstatSync, realpathSync } from 'node:fs';
import { resolve, relative, isAbsolute, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';

const safeName = name => typeof name === 'string' && name.length > 0 &&
  name === name.trim() && !name.includes('\\') && !/[\x00-\x1f\x7f]/.test(name) &&
  !isAbsolute(name) && !name.split('/').some(part => !part || part === '.' || part === '..') &&
  !name.includes(':') && !name.includes('%');

export function buildManifest(root, main, names) {
  if (!safeName(main) || !Array.isArray(names) || !names.length ||
      names.some(n => !safeName(n)) || new Set(names).size !== names.length ||
      !names.includes(main)) throw Error('Invalid module inventory');
  const base = realpathSync(root);
  const modules = names.map(name => {
    const path = resolve(base, name);
    const rel = relative(base, path);
    if (rel.startsWith('..'+sep) || rel === '..' || isAbsolute(rel) ||
        !lstatSync(path).isFile() || realpathSync(path) !== path) {
      throw Error('Unsafe module path: ' + name);
    }
    return { name, sha256: createHash('sha256').update(readFileSync(path)).digest('hex') };
  }).sort((a,b)=>a.name.localeCompare(b.name));
  return {main_module:main,modules};
}

if (process.argv[2] === '--self-test') {
  const { mkdtempSync, writeFileSync, symlinkSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const root=mkdtempSync(join(tmpdir(),'worker-manifest-'));
  try {
    writeFileSync(join(root,'entrypoint.mjs'),'export default {}');
    writeFileSync(join(root,'legacy.mjs'),'export const x=1;');
    const result=buildManifest(root,'entrypoint.mjs',['legacy.mjs','entrypoint.mjs']);
    assert.equal(result.modules.length,2);
    assert.match(result.modules[0].sha256,/^[a-f0-9]{64}$/);
    assert.throws(()=>buildManifest(root,'entrypoint.mjs',['entrypoint.mjs','entrypoint.mjs']),/Invalid module inventory/);
    assert.throws(() => buildManifest(root, 'entrypoint.mjs', Array.of('..' + '/entrypoint.mjs')), /Invalid module inventory/);
    assert.throws(()=>buildManifest(root,'entrypoint.mjs',['entrypoint.mjs','%2e%2e/x']),/Invalid module inventory/);
    assert.throws(()=>buildManifest(root,'missing.mjs',['entrypoint.mjs']),/Invalid module inventory/);
    assert.throws(()=>buildManifest(root,'entrypoint.mjs',['entrypoint.mjs','bad\u0000name.mjs']),/Invalid module inventory/);
    assert.throws(()=>buildManifest(root,'entrypoint.mjs',['entrypoint.mjs','bad\nname.mjs']),/Invalid module inventory/);
    symlinkSync(join(root,'legacy.mjs'),join(root,'linked.mjs'));
    assert.throws(()=>buildManifest(root,'entrypoint.mjs',['entrypoint.mjs','linked.mjs']),/Unsafe module path/);
    console.log('PASS offline artifact manifest builder (8 cases)');
  } finally { rmSync(root,{recursive:true,force:true}); }
} else if (process.argv.length>=5) {
  console.log(JSON.stringify(buildManifest(process.argv[2],process.argv[3],process.argv.slice(4)),null,2));
} else {
  console.error('Usage: node scripts/build-worker-manifest.mjs <root> <main> <module...> | --self-test');
  process.exitCode=2;
}
