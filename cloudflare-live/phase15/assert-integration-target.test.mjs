import test from 'node:test';
import assert from 'node:assert/strict';
import {validateTarget} from './assert-integration-target.mjs';
const good={TARGET_WORKER:'candidatory-miniapp-integration',TARGET_D1_NAME:'candidatory-integration-test-20261101',TARGET_D1_ID:'2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0'};
test('only the isolated integration Worker and D1 are accepted',()=>assert.equal(validateTarget(good),true));
for(const [key,value] of [['TARGET_WORKER','candidatory-news-bot'],['TARGET_WORKER','candidatory-miniapp'],['TARGET_D1_NAME','production'],['TARGET_D1_ID','wrong']]){
 test('reject '+key+' mismatch',()=>assert.throws(()=>validateTarget({...good,[key]:value})));
}
test('reject missing configuration',()=>assert.throws(()=>validateTarget({})));
test('reject production override',()=>assert.throws(()=>validateTarget({...good,ALLOW_PRODUCTION:'true'})));

for (const [key,value] of [
 ['ALLOW_PRODUCTION','TRUE'],['ALLOW_PRODUCTION','1'],['ALLOW_PRODUCTION',' yes '],
 ['PRODUCTION_DEPLOY','on'],['DEPLOY_PRODUCTION','true'],
 ['TARGET_ENV','production'],['CLOUDFLARE_ENV','Production'],['WRANGLER_ENV',' production ']
]) {
 test('reject production alias '+key+'='+value,()=>assert.throws(()=>validateTarget({...good,[key]:value})));
}
for (const [key,value] of [
 ['ALLOW_PRODUCTION','enabled'],['ALLOW_PRODUCTION','deploy'],
 ['PRODUCTION_DEPLOY','approved'],['DEPLOY_PRODUCTION','unexpected'],
 ['ALLOW_PRODUCTION','false,true'],['ALLOW_PRODUCTION','null']
]) {
 test('fail closed on unknown production flag '+key+'='+value,()=>assert.throws(()=>validateTarget({...good,[key]:value})));
}
for (const value of ['false','FALSE','0','off','no','  ']) {
 test('allow explicit disabled production flag '+JSON.stringify(value),()=>assert.equal(validateTarget({...good,ALLOW_PRODUCTION:value}),true));
}
test('accept explicit nonproduction environment',()=>assert.equal(validateTarget({...good,TARGET_ENV:'integration',ALLOW_PRODUCTION:'false'}),true));

for (const key of ['TARGET_ENV','CLOUDFLARE_ENV','WRANGLER_ENV']) {
 for (const value of ['prod','live','main','release','production-preview','unexpected']) {
  test('reject unknown environment '+key+'='+value,()=>assert.throws(()=>validateTarget({...good,[key]:value})));
 }
 for (const value of ['integration','staging','test','development']) {
  test('allow safe environment '+key+'='+value,()=>assert.equal(validateTarget({...good,[key]:value}),true));
 }
}
