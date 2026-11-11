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
test('accept explicit nonproduction environment',()=>assert.equal(validateTarget({...good,TARGET_ENV:'integration',ALLOW_PRODUCTION:'false'}),true));
