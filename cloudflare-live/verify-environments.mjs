import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const manifest=JSON.parse(readFileSync(new URL('./environment-manifest.json',import.meta.url),'utf8'));
assert.notEqual(manifest.production.databaseId,manifest.staging.databaseId,'Databases must be isolated');
for(const name of ['production','staging']){
  const target=manifest[name];
  const source=readFileSync(new URL(target.source,import.meta.url),'utf8');
  assert.equal(createHash('sha256').update(source).digest('hex'),target.sha256,`${name} snapshot hash mismatch`);
  for(const pattern of [/sk-[A-Za-z0-9_-]{20,}/,/gh[pousr]_[A-Za-z0-9_]{20,}/,/AIza[A-Za-z0-9_-]{25,}/,/[0-9]{8,10}:[A-Za-z0-9_-]{30,}/,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/])assert.ok(!pattern.test(source),`${name}: possible embedded secret`);
  console.log(`PASS ${name}: snapshot hash and secret-pattern checks`);
}
console.log('PASS isolated database identifiers; this is snapshot validation, not a fresh live API comparison');
