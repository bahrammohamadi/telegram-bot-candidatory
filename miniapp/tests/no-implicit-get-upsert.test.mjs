import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source = readFileSync(new URL('../src/worker.mjs', import.meta.url), 'utf8');

test('authenticated GET must not execute the implicit account upsert', () => {
  const marker = "INSERT INTO accounts(telegram_id,first_name,last_name,username)";
  assert.equal(source.split(marker).length - 1, 1, 'expected exactly one account upsert');
  assert.match(source, /if\(req\.method!=='GET'\)await env\.DB\.prepare\('INSERT INTO accounts\(/);
});

test('authentication must precede the guarded account upsert', () => {
  const auth = source.indexOf('if(!user)return fail(');
  const upsert = source.indexOf('INSERT INTO accounts(');
  assert.ok(auth >= 0 && upsert > auth);
});
