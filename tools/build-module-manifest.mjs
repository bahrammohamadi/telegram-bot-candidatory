// Offline module integrity manifest generator for the EXISTING production Worker.
// Usage: node tools/build-module-manifest.mjs <source-directory>
// Read-only: no Cloudflare calls, no deployment, no database or secrets.
// Output is deterministic JSON on stdout; hash is SHA-256 over raw file bytes.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';
import { createHash } from 'node:crypto';

const rootArg = process.argv[2];
if (process.argv.length !== 3 || !rootArg) {
  console.error('Usage: node tools/build-module-manifest.mjs <source-directory>');
  process.exit(2);
}
const root = resolve(rootArg);
if (!statSync(root).isDirectory()) throw Error('Expected directory');
const modules = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a,b)=>a.name.localeCompare(b.name,'en'))) {
    if (entry.isSymbolicLink()) throw Error('Symlinks are not permitted: '+entry.name);
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile()) {
      const name = relative(root, full).split('\\').join('/');
      if (!/\.(mjs|js|cjs|json|wasm|txt|html|css)$/.test(name)) throw Error('Unexpected module type: '+name);
      const bytes = readFileSync(full);
      modules.push({name, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex')});
    } else throw Error('Unexpected entry: '+entry.name);
  }
}
walk(root);
if (!modules.length) throw Error('No modules found');
modules.sort((a,b)=>a.name.localeCompare(b.name,'en'));
const canonical = JSON.stringify(modules);
const manifestSha256 = createHash('sha256').update(canonical).digest('hex');
console.log(JSON.stringify({schemaVersion:1,workerName:'candidatory-miniapp-api',manifestSha256,modules},null,2));
