#!/usr/bin/env node
// Read-only release gate: compare binding identities without exposing secret values.
// Usage: node scripts/verify-worker-bindings.mjs baseline.json candidate.json
import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

export function bindingIdentity(binding) {
  if (!binding || typeof binding.name !== 'string' || typeof binding.type !== 'string') throw new Error('Invalid binding');
  const id = binding.database_id ?? binding.id ?? binding.namespace_id ?? binding.bucket_name ?? binding.service ?? null;
  return { name: binding.name, type: binding.type, ...(id ? { target: String(id) } : {}) };
}
export function compareBindings(baseline, candidate) {
  if (!Array.isArray(baseline) || !Array.isArray(candidate)) throw new Error('Expected binding arrays');
  const normalized = xs => xs.map(bindingIdentity).sort((a,b) => a.name.localeCompare(b.name));
  const old = normalized(baseline), next = normalized(candidate);
  if (new Set(old.map(x=>x.name)).size !== old.length || new Set(next.map(x=>x.name)).size !== next.length) throw new Error('Duplicate binding name');
  if (JSON.stringify(old) !== JSON.stringify(next)) {
    const names = [...new Set([...old.map(x=>x.name), ...next.map(x=>x.name)])];
    const changed = names.filter(name => JSON.stringify(old.find(x=>x.name===name)) !== JSON.stringify(next.find(x=>x.name===name)));
    throw new Error('Binding drift detected: ' + changed.join(', '));
  }
  return { ok: true, bindingCount: old.length };
}
if (process.argv[2] === '--self-test') {
  const base = [{name:'DB',type:'d1',database_id:'prod-123'},{name:'BOT_TOKEN',type:'secret_text'}];
  assert.deepEqual(compareBindings(base,[...base].reverse()),{ok:true,bindingCount:2});
  assert.throws(()=>compareBindings(base,[{name:'DB',type:'d1',database_id:'review-456'},base[1]]),/Binding drift/);
  assert.throws(()=>compareBindings(base,[base[0]]),/Binding drift/);
  assert.throws(()=>compareBindings(base,[...base,base[0]]),/Duplicate binding/);
  assert.throws(()=>compareBindings(base,[{name:'DB',type:'kv_namespace',database_id:'prod-123'},base[1]]),/Binding drift/);
  console.log('PASS binding parity guard (5 cases)');
} else if (process.argv.length===4) {
  const read = file => { const obj=JSON.parse(readFileSync(file,'utf8')); return Array.isArray(obj)?obj:obj.bindings; };
  console.log(JSON.stringify(compareBindings(read(process.argv[2]),read(process.argv[3]))));
} else {
  console.error('Usage: node scripts/verify-worker-bindings.mjs baseline.json candidate.json | --self-test');
  process.exitCode=2;
}
