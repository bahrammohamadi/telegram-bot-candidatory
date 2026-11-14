import test from 'node:test';
import assert from 'node:assert/strict';
import { assessmentBank } from '../src/assessment-bank.mjs';

// Structural integrity only: this does not certify editorial correctness.
test('assessment bank has unique identifiers and complete, safe answer keys', () => {
  assert.equal(assessmentBank.length, 150, 'expected 150 assessment questions');
  const ids = new Set();
  for (const q of assessmentBank) {
    assert.equal(typeof q.id, 'string');
    assert.ok(q.id.trim(), 'missing question id');
    assert.ok(!ids.has(q.id), `duplicate question id: ${q.id}`);
    ids.add(q.id);
    for (const field of ['domain', 'domainLabel', 'skill', 'type', 'prompt', 'explanation']) {
      assert.equal(typeof q[field], 'string', `invalid ${field} on ${q.id}`);
      assert.ok(q[field].trim(), `empty ${field} on ${q.id}`);
    }
    assert.ok(Array.isArray(q.options), `missing options on ${q.id}`);
    assert.equal(q.options.length, 4, `invalid option count on ${q.id}`);
    assert.ok(q.options.every(v => typeof v === 'string' && v.trim()), `blank option on ${q.id}`);
    assert.equal(new Set(q.options.map(v => v.trim())).size, 4, `duplicate option on ${q.id}`);
    assert.ok(Number.isInteger(q.correct) && q.correct >= 0 && q.correct < q.options.length,
      `out-of-range answer on ${q.id}`);
    assert.ok(Number.isFinite(q.weight) && q.weight > 0, `invalid weight on ${q.id}`);
  }
});
