import test from 'node:test';
import assert from 'node:assert/strict';
import { assessmentBank } from '../src/assessment-bank.mjs';

// Regression guard for the 2026-11-09 repair: the fifth question of each
// competency is a follow-up and must point to its evidence-review option.
test('all follow-up questions point to the evidence-review answer', () => {
  const followUps = assessmentBank.filter(q => q.type === 'پیگیری نتیجه');
  assert.equal(followUps.length, 30, 'five competencies in each of six domains');
  for (const q of followUps) {
    assert.equal(q.correct, 0, `wrong follow-up key: ${q.id}`);
    assert.match(q.options[q.correct], /بازبینی شواهد/, `wrong answer content: ${q.id}`);
    assert.equal(new Set(q.options).size, 4, `duplicate choices: ${q.id}`);
  }
});
