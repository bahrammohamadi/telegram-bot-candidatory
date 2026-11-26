// Offline production binding contract check. No network, credentials or deployment.
// Usage: node --test tests/production-binding-contract.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

const expected = Object.freeze({
  ADMIN_TELEGRAM_IDS: { type: 'secret_text' },
  ADMIN_TELEGRAM_IDS_MAHDI: { type: 'secret_text' },
  AI: { type: 'ai' },
  AVALAI_API_KEY: { type: 'secret_text' },
  DB: { type: 'd1', database_id: '48b3c86b-45ea-492b-96e1-334dfafa2097' },
  REVIEW_DB: { type: 'd1', database_id: '2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0' },
  TELEGRAM_BOT_TOKEN: { type: 'secret_text' },
});

function verify(bindings) {
  assert.ok(Array.isArray(bindings), 'bindings must be an array');
  const names = bindings.map(b => b.name);
  assert.equal(new Set(names).size, names.length, 'duplicate binding');
  assert.deepEqual([...names].sort(), Object.keys(expected).sort(), 'binding set drift');
  for (const b of bindings) {
    const contract = expected[b.name];
    assert.equal(b.type, contract.type, `type drift for ${b.name}`);
    if (contract.type === 'd1') assert.equal(b.database_id, contract.database_id, `D1 ID drift for ${b.name}`);
    if (contract.type === 'secret_text') assert.equal('text' in b || 'value' in b, false, 'secret value must never enter a manifest');
  }
}

const fixture = Object.entries(expected).map(([name, properties]) => ({ name, ...properties }));
test('known safe binding metadata passes', () => verify(structuredClone(fixture)));
test('missing binding fails closed', () => assert.throws(() => verify(fixture.slice(1))));
test('extra binding fails closed', () => assert.throws(() => verify([...fixture, {name:'UNEXPECTED',type:'plain_text'}])));
test('duplicate binding fails closed', () => assert.throws(() => verify([...fixture, fixture[0]])));
test('wrong D1 database fails closed', () => assert.throws(() => verify(fixture.map(b => b.name === 'DB' ? {...b,database_id:'wrong'} : b))));
test('secret value in manifest fails closed', () => assert.throws(() => verify(fixture.map(b => b.name === 'TELEGRAM_BOT_TOKEN' ? {...b,value:'synthetic'} : b))));
test('wrong AI binding type fails closed', () => assert.throws(() => verify(fixture.map(b => b.name === 'AI' ? {...b,type:'plain_text'} : b))));
