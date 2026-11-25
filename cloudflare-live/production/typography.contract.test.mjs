import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './entrypoint.mjs';
import { FONT_PATH, applyTypography } from '../../assets/fonts/self-hosted-typography.mjs';

const origin = 'https://offline.invalid';
test('production entrypoint serves actual WOFF2 without credentials or bindings', async () => {
  const get = await worker.fetch(new Request(origin + FONT_PATH), {}, {});
  assert.equal(get.status, 200);
  assert.equal(get.headers.get('content-type'), 'font/woff2');
  const bytes = new Uint8Array(await get.arrayBuffer());
  assert.equal(String.fromCharCode(...bytes.slice(0,4)), 'wOF2');
  assert.equal(bytes.length, Number(get.headers.get('content-length')));
  const head = await worker.fetch(new Request(origin + FONT_PATH,{method:'HEAD'}), {}, {});
  assert.equal((await head.arrayBuffer()).byteLength,0);
  assert.equal(head.headers.get('content-length'),String(bytes.length));
  assert.equal((await worker.fetch(new Request(origin + FONT_PATH,{method:'POST'}),{},{})).status,405);
  assert.equal((await worker.fetch(new Request(origin + '/'),{},{})).status,503);
});
test('typography retains production CSP and API authorization responses', async () => {
  const csp = "default-src 'none'; script-src 'unsafe-inline' https://telegram.org; connect-src 'self'; style-src 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors https://web.telegram.org https://*.telegram.org";
  const html = await applyTypography(new Response('<html><head></head><body>آزمون</body></html>',{headers:{'content-type':'text/html','content-security-policy':csp}}));
  assert.equal(html.headers.get('content-security-policy'),csp+"; font-src 'self'");
  assert.match(await html.text(),/candidatory-self-hosted-font/);
  const denied = new Response('{"error":"unauthorized"}',{status:401,headers:{'content-type':'application/json'}});
  assert.equal(await applyTypography(denied),denied);
});
