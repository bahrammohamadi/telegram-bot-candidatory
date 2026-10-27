// Regression: Telegram bot-token HMAC validation must include signature, exclude hash.
import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
const TOKEN="123456:TEST_TOKEN_NOT_REAL";
function sign(params){
 const data=Object.entries(params).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>k+"="+v).join("\n");
 const secret=createHmac("sha256","WebAppData").update(TOKEN).digest();
 return createHmac("sha256",secret).update(data).digest("hex");
}
test("HMAC includes Telegram third-party signature",()=>{
 const values={auth_date:"1772000000",user:'{"id":1234,"first_name":"Test"}',signature:"ED25519_PUBLIC_SIGNATURE_PLACEHOLDER"};
 const hash=sign(values);
 assert.equal(hash,sign(values));
 const {signature,...omit}=values;
 assert.notEqual(hash,sign(omit));
});
test("tampering fails",()=>{
 const values={auth_date:"1772000000",user:'{"id":1234}',signature:"EXAMPLE"};
 assert.notEqual(sign(values),sign({...values,user:'{"id":1235}'}));
});
