#!/usr/bin/env node
// Offline repository guard: fail when a GitHub Actions workflow contains
// commands likely to deploy a second Cloudflare Worker/environment.
// This is defense in depth, NOT a complete workflow security parser.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
const dir = '.github/workflows';
const files = readdirSync(dir).filter(x => /\.ya?ml$/.test(x));
const forbidden = [
  /\bwrangler\s+(?:deploy|publish|versions\s+deploy)\b[^\n]*\s--env\s+(?!production\b)\S+/i,
  /\bwrangler\s+(?:deploy|publish|versions\s+deploy)\b[^\n]*\s--name\s+(?!candidatory-miniapp-api\b)\S+/i,
  /\bwrangler\s+(?:deploy|publish|versions\s+deploy)\b[^\n]*\s--(?:dry-run|outdir)\b/i,
];
let failures = 0;
for (const file of files) {
  const source = readFileSync(join(dir,file),'utf8');
  for (const pattern of forbidden) {
    if (pattern.test(source)) {
      console.error(`BLOCKED: ${file}: prohibited deployment command pattern ${pattern}`);
      failures++;
    }
  }
}
if (failures) process.exit(1);
console.log(`Offline production-only lint completed on ${files.length} workflow files. This check does not authorize deployment.`);
