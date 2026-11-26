import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source = readFileSync(new URL('../src/worker.mjs', import.meta.url), 'utf8');

test('authenticated GET cannot trigger implicit account upsert', () => {
  const marker = 'INSERT INTO accounts(telegram_id,first_name,last_name,username)';
  assert.equal(source.split(marker).length - 1, 1, 'expected one reusable account upsert definition');
  assert.match(source, /const ensureAccount=\(\)=>env\.DB\.prepare\('INSERT INTO accounts\(/);
  assert.doesNotMatch(source, /if\(req\.method!=='GET'\)await ensureAccount\(\)/,
    'account upsert must not run for arbitrary non-GET requests');
  const calls = [...source.matchAll(/await ensureAccount\(\)/g)];
  assert.equal(calls.length, 4, 'only the four validated POST handlers may ensure an account');
  for (const call of calls) {
    const prefix = source.slice(0, call.index);
    const lastRoute = prefix.lastIndexOf("req.method==='POST'");
    const lastAlternative = prefix.lastIndexOf("req.method==='GET'");
    assert.ok(lastRoute > lastAlternative, 'ensureAccount call must be inside a POST route');
  }
});

test('authentication must precede the account upsert definition', () => {
  const auth = source.indexOf('if(!user)return fail(');
  const upsert = source.indexOf('INSERT INTO accounts(');
  assert.ok(auth >= 0 && upsert > auth);
});
