#!/usr/bin/env node
// Offline, read-only release guard: compares complete module inventory and SHA-256 digests.
// Usage: node scripts/verify-worker-artifact.mjs baseline.json candidate.json
// Manifest format: {"main_module":"entrypoint.mjs","modules":[{"name":"entrypoint.mjs","sha256":"64 hex chars"},...]}
import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
const hash = '^[a-f0-9]{64}$';
export function normalize(manifest) {
  if (!manifest || typeof manifest !== 'object' || !Array.isArray(manifest.modules) ||
      typeof manifest.main_module !== 'string' || !manifest.main_module.trim()) throw Error('Invalid artifact manifest');
  const modules = manifest.modules.map(m => {
    if (!m || typeof m.name !== 'string' || !m.name.trim() || m.name !== m.name.trim() ||
        typeof m.sha256 !== 'string' || !new RegExp(hash).test(m.sha256)) throw Error('Invalid module entry');
    return {name:m.name,sha256:m.sha256};
  }).sort((a,b)=>a.name.localeCompare(b.name));
  if (new Set(modules.map(m=>m.name)).size !== modules.length) throw Error('Duplicate module');
  if (!modules.some(m=>m.name===manifest.main_module)) throw Error('Missing main module');
  return {main_module:manifest.main_module,modules};
}
export function verifyArtifact(baseline,candidate,allowedChanged=[]) {
  const a=normalize(baseline),b=normalize(candidate);
  if (a.main_module!==b.main_module) throw Error('Main module drift');
  const names=x=>x.modules.map(m=>m.name).join('\n');
  if (names(a)!==names(b)) throw Error('Module inventory drift');
  if (!Array.isArray(allowedChanged) || allowedChanged.some(n=>typeof n!=='string'||!a.modules.some(m=>m.name===n))) throw Error('Invalid allowlist');
  const changed=a.modules.filter((m,i)=>m.sha256!==b.modules[i].sha256).map(m=>m.name);
  if (changed.some(n=>!allowedChanged.includes(n))) throw Error('Unexpected module change: '+changed.join(', '));
  return {ok:true,moduleCount:a.modules.length,changed};
}
if (process.argv[2]==='--self-test') {
  const h='a'.repeat(64),j='b'.repeat(64);
  const a={main_module:'entrypoint.mjs',modules:[{name:'entrypoint.mjs',sha256:h},{name:'legacy.mjs',sha256:h},{name:'preview.mjs',sha256:h}]};
  assert.deepEqual(verifyArtifact(a,{...a,modules:[...a.modules].reverse()}),{ok:true,moduleCount:3,changed:[]});
  assert.throws(()=>verifyArtifact(a,{...a,modules:a.modules.slice(0,2)}),/Module inventory drift/);
  assert.throws(()=>verifyArtifact(a,{...a,modules:[...a.modules,a.modules[0]]}),/Duplicate module/);
  assert.throws(()=>verifyArtifact(a,{...a,main_module:'missing.mjs'}),/Missing main module/);
  assert.throws(()=>verifyArtifact(a,{...a,modules:a.modules.map((m,i)=>i===0?{...m,sha256:j}:m)}),/Unexpected module change/);
  assert.deepEqual(verifyArtifact(a,{...a,modules:a.modules.map((m,i)=>i===0?{...m,sha256:j}:m)},['entrypoint.mjs']).changed,['entrypoint.mjs']);
  assert.throws(()=>verifyArtifact(a,{...a,modules:a.modules.map((m,i)=>i===0?{...m,sha256:'wrong'}:m)}),/Invalid module entry/);
  console.log('PASS artifact manifest gate (7 cases)');
} else if (process.argv.length>=4) {
  const load=p=>JSON.parse(readFileSync(p,'utf8'));
  console.log(JSON.stringify(verifyArtifact(load(process.argv[2]),load(process.argv[3]),process.argv.slice(4))));
} else {
  console.error('Usage: node scripts/verify-worker-artifact.mjs baseline.json candidate.json [allowed changed module names] | --self-test');
  process.exitCode=2;
}
