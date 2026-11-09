// Anonymous visual smoke of the deployed isolated Cloudflare Worker only.
// Never loads Telegram initData, admin credentials, personal records or payment data.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const url = 'https://candidatory-miniapp-integration.lasvaram-candidatory.workers.dev/';
(async () => {
  const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
  try {
    const dir = path.resolve('integration-ui-screenshots');
    fs.mkdirSync(dir,{recursive:true});
    for (const width of [320,375,390,430,768]) {
      const context = await browser.newContext({viewport:{width,height:800},deviceScaleFactor:1,locale:'fa-IR',reducedMotion:'reduce'});
      const page = await context.newPage();
      const response = await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
      assert.equal(response?.status(),200,'Public integration UI must return HTTP 200');
      const state = await page.evaluate(()=>{
        const css=[...document.querySelectorAll('style')].map(x=>x.textContent||'').join('\n');
        return {
          rtl: document.documentElement.getAttribute('dir')==='rtl',
          lang: document.documentElement.lang,
          theme:css.includes('Candidatory mobile visual refresh'),
          overflow:document.documentElement.scrollWidth-window.innerWidth,
          mainVisible:!!document.querySelector('main'),
          title:document.title.trim(),
          viewport:document.querySelector('meta[name="viewport"]')?.content||'',
          unlabeledButtons:[...document.querySelectorAll('button')].filter(b=>!((b.innerText||'').trim()||b.getAttribute('aria-label')||b.getAttribute('aria-labelledby')||b.getAttribute('title'))).length,
          buttons:[...document.querySelectorAll('button')].map(x=>parseFloat(getComputedStyle(x).minHeight)||0)
        };
      });
      assert.equal(state.rtl,true,'RTL expected');
      assert.equal(state.lang,'fa','Persian lang expected');
      assert.equal(state.theme,true,'Deployed visual CSS not present');
      assert.equal(state.mainVisible,true,'Main UI missing');
      assert.ok(state.title.length>0,'Document title missing');
      assert.ok(state.viewport.includes('width=device-width'),'Responsive viewport missing');
      assert.equal(state.unlabeledButtons,0,'Buttons without accessible names');
      assert.ok(state.overflow<=2,'Horizontal overflow on '+width+'px: '+state.overflow);
      assert.ok(state.buttons.length>0&&state.buttons.every(h=>h>=44),'Touch targets too short');
      await page.screenshot({path:path.join(dir,`ui-${width}.png`),fullPage:true});
      console.log('PASS isolated mobile visual smoke width='+width+' CSS/RTL/overflow/touch');
      await context.close();
    }
  } finally {await browser.close()}
})().catch(e=>{console.error(e.message);process.exitCode=1});
