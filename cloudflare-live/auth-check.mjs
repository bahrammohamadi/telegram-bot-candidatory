import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('./worker.js',import.meta.url),'utf8');
const {default:worker,verify}=await import('data:text/javascript;base64,'+Buffer.from(source+'\nexport {verify};').toString('base64'));
// Local-only synthetic signing key: never configured on a deployed Worker.
const token='local-test-key-not-a-telegram-token';
function signed(user,age=0){
 const p=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)-age),user:JSON.stringify(user)});
 const data=[...p].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${v}`).join('\n');
 const secret=createHmac('sha256','WebAppData').update(token).digest();
 p.set('hash',createHmac('sha256',secret).update(data).digest('hex'));return p.toString();
}
const valid=signed({id:10001,first_name:'Synthetic user'});
assert.equal((await verify(valid,token)).id,10001);
console.log('PASS valid synthetic Telegram signature');
const cases=[
 ['missing',undefined,'INVALID_INIT_DATA'],
 ['empty','','INVALID_INIT_DATA'],
 ['oversized','x'.repeat(8193),'INVALID_INIT_DATA'],
 ['tampered',valid.replace('10001','10002'),'INVALID_SIGNATURE'],
 ['expired',signed({id:10001},7200),'EXPIRED_INIT_DATA'],
 ['future',signed({id:10001},-7200),'EXPIRED_INIT_DATA'],
 ['invalid user',signed({id:-1}),'UNAUTHORIZED'],
];
let dbCalls=0;
const DB={prepare(){dbCalls++;throw Error('Rejected identity reached database');}};
for(const [name,initData,expected] of cases){
 const res=await worker.fetch(new Request('https://test.invalid/api/action',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'candidateProfile',initData})}),{DB,TELEGRAM_BOT_TOKEN:token});
 assert.equal(res.status,401,name);assert.equal((await res.json()).error,expected,name);
 console.log(`PASS ${name}: rejected before database access`);
}
const unconfigured=await worker.fetch(new Request('https://test.invalid/api/action',{method:'POST',body:JSON.stringify({action:'candidateProfile',initData:valid})}),{DB});
assert.equal(unconfigured.status,503);assert.equal(dbCalls,0);
console.log('PASS missing signing key fails closed; zero database calls for rejected requests');
console.log('Scope: local authentication boundary only; not Telegram WebView E2E or tenant isolation certification.');
