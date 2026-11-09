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
          mainAppForm:!!document.querySelector('#form'),
          mainAppDashboard:!!document.querySelector('#dashboard'),
          mainAppReview:!!document.querySelector('#review'),
          mainAppSteps:!!document.querySelector('#steps'),
          moduleCount:document.querySelectorAll('.modules [data-module]').length,
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
      assert.equal(state.mainAppForm,true,'Main app onboarding form missing');
      assert.equal(state.mainAppDashboard,true,'Main app dashboard missing');
      assert.equal(state.mainAppReview,true,'Main app review screen missing');
      assert.equal(state.mainAppSteps,true,'Main app onboarding steps missing');
      assert.ok(state.moduleCount>=6,'Main app module grid missing');
      if (width===320) {
        const legacy=await context.request.get(new URL('/legacy',url).toString(),{maxRedirects:0});
        assert.equal(legacy.status(),410,'Legacy module must stay archived');
        const review=await context.request.get(new URL('/review',url).toString(),{maxRedirects:0});
        assert.equal(review.status(),302,'Review alias must route to main app');
        assert.equal(new URL(review.headers().location,url).pathname,'/','Review alias must redirect to dashboard root');
      }
      assert.ok(state.title.length>0,'Document title missing');
      assert.ok(state.viewport.includes('width=device-width'),'Responsive viewport missing');
      assert.equal(state.unlabeledButtons,0,'Buttons without accessible names');
      assert.ok(state.overflow<=2,'Horizontal overflow on '+width+'px: '+state.overflow);
      assert.ok(state.buttons.length>0&&state.buttons.every(h=>h>=44),'Touch targets too short');
      await page.screenshot({path:path.join(dir,`ui-${width}.png`),fullPage:true});
      console.log('PASS full-main-app isolated mobile smoke width='+width+' CSS/RTL/modules/onboarding/accessibility/routes');
      await context.close();
    }
  } finally {await browser.close()}
})().catch(e=>{console.error(e.message);process.exitCode=1});
