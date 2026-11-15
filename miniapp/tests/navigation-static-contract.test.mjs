import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Static regression contract: no Telegram credentials, database, or deployed environment.
const source = readFileSync(fileURLToPath(new URL('../public/app.js', import.meta.url)), 'utf8');
const fn = source.match(/function switchTab\(name\)\{([\s\S]*?)\}\s*document\.querySelectorAll\('\[data-tab\]'\)/);
test('tab navigation validates a matching button and panel before mutating active state', () => {
  assert.ok(fn, 'switchTab must exist immediately before tab click registration');
  const body = fn[1];
  const guard = body.indexOf('classList.contains(\'panel\')');
  const aria = body.indexOf("setAttribute('aria-current'");
  const active = body.indexOf("classList.toggle('active'");
  assert.ok(guard >= 0, 'target must have panel class');
  assert.ok(body.includes('dataset.tab===name'), 'target must have a matching navigation button');
  assert.ok(body.slice(guard, aria).includes('return'), 'invalid target must return before mutation');
  assert.ok(aria > guard && active > aria, 'all navigation mutations must follow validation');
});
test('tab navigation must not use HTML injection', () => {
  assert.ok(!/innerHTML\s*=/.test(fn?.[1] ?? ''), 'tab switch must not inject HTML');
});
