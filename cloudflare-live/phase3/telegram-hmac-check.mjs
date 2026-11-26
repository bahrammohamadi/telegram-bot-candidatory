import { createHmac } from 'node:crypto';
import assert from 'node:assert/strict';
import worker from './integration-auth-worker.mjs';
const token='123456789:TEST_TOKEN_ONLY_NEVER_REAL';
const user=JSON.stringify({id:9000001234,first_name:'Synthetic'});
function signed(extra={}){
 const pairs=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user,...extra});
 const check=[...pairs.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>k+'='+v).join('\n');
 const secret=createHmac('sha256','WebAppData').update(token).digest();
 pairs.set('hash',createHmac('sha256',secret).update(check).digest('hex'));
 return pairs.toString();
}
const db={prepare(sql){return {bind(){return this},async first(){return null}}}};
async function verify(initData){
 const request=new Request('https://synthetic.test/api/profile',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'get',initData})});
 const response=await worker.fetch(request,{TELEGRAM_BOT_TOKEN:token,DB:db});
 return response.status;
}
assert.equal(await verify(signed()),200,'legacy signed initData without signature should pass');
assert.equal(await verify(signed({signature:'test_ed25519_signature'})),200,'modern initData with signature must pass HMAC');
const tampered=new URLSearchParams(signed({signature:'test_ed25519_signature'}));
tampered.set('signature','tampered');
assert.equal(await verify(tampered.toString()),401,'modifying signature must invalidate HMAC');
assert.equal(await verify('bad'),401,'invalid initData must be rejected');
console.log('PASS: valid modern Telegram signature field, legacy initData, and tampering rejection');
