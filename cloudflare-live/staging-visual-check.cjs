const { chromium } = require('playwright');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({headless:true});
  const widths=[320,375,430];
  fs.mkdirSync('staging-screenshots',{recursive:true});
  try {
    for(const width of widths){
      const page=await browser.newPage({viewport:{width,height:800},deviceScaleFactor:1});
      const errors=[];
      page.on('pageerror',e=>errors.push(String(e)));
      await page.goto('https://candidatory-miniapp-staging.lasvaram-candidatory.workers.dev/',{waitUntil:'domcontentloaded',timeout:30000});
      await page.locator('#staging-dashboard-body .staging-kpis').waitFor({timeout:15000});
      const result=await page.evaluate(()=>({
        scroll:document.documentElement.scrollWidth,
        viewport:window.innerWidth,
        nav:document.querySelectorAll('.bottom-nav [data-tab]').length,
        chart:!!document.querySelector('.staging-donut'),
        blocked:document.querySelector('.bottom-nav [data-tab="profile"]')?.getAttribute('aria-disabled'),
      }));
      await page.screenshot({path:`staging-screenshots/mobile-${width}.png`,fullPage:true});
      console.log(width,JSON.stringify(result),'errors',errors.slice(0,3));
      if(result.scroll>result.viewport+2)throw Error('Horizontal overflow at '+width+': '+result.scroll);
      if(result.nav!==5||!result.chart||result.blocked!=='true')throw Error('Missing expected navigation/chart at '+width);
      if(errors.length)throw Error('Runtime JavaScript error at '+width+': '+errors.join('; '));
      await page.close();
    }
  } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
