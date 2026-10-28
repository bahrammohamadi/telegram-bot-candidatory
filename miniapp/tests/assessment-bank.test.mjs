import test from 'node:test';
import assert from 'node:assert/strict';
import {assessmentBank,assessmentDomains} from '../src/assessment-bank.mjs';
test('competency taxonomy and question integrity',()=>{
 assert.equal(assessmentDomains.length,6);
 assert.equal(assessmentBank.length,150);
 assert.equal(new Set(assessmentBank.map(q=>q.id)).size,150);
 for(const d of assessmentDomains)assert.equal(assessmentBank.filter(q=>q.domain===d.id).length,25);
 for(const q of assessmentBank){assert.equal(q.options.length,4);assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<4);assert.ok(q.prompt.length>20);}
});
test('pilot assessment offers 30 items in 6 domains',()=>{
 const selected=assessmentBank.filter((q,i)=>i%5===0);
 assert.equal(selected.length,30);
 for(const d of assessmentDomains)assert.equal(selected.filter(q=>q.domain===d.id).length,5);
});
