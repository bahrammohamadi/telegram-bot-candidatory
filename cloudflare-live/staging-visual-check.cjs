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
      await page.locator('#first-visit-guide:not([hidden])').waitFor({timeout:10000});
      await page.locator('#first-visit-next').click();
      await page.locator('#first-visit-next').click();
      await page.locator('#first-visit-next').click();
      if(await page.locator('#first-visit-guide').isVisible())throw Error('Onboarding did not close');
      await page.locator('.bottom-nav [data-tab="home"]').click();
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
      // Status filters should remain usable and restore the complete chart.
      await page.locator('[data-staging-filter="done"]').click();
      await page.locator('#staging-dashboard-body .staging-kpis').waitFor({timeout:15000});
      if(await page.locator('[data-staging-filter="done"]').getAttribute('aria-pressed')!=='true')throw Error('Done filter not selected');
      await page.locator('[data-staging-filter="todo"]').click();
      await page.locator('#staging-dashboard-body .staging-kpis').waitFor({timeout:15000});
      if(await page.locator('[data-staging-filter="todo"]').getAttribute('aria-pressed')!=='true')throw Error('Remaining filter not selected');
      await page.locator('[data-staging-filter="all"]').click();
      await page.locator('#staging-dashboard-body .staging-kpis').waitFor({timeout:15000});
      // Unified hub: five cards and restricted-state messages.
      const hub=page.locator('.staging-learning-hub');
      await hub.locator('[data-hub-tab]').first().waitFor();
      if(await hub.locator('[data-hub-tab]').count()!==5)throw Error('Expected five unified hub cards');
      await hub.locator('[data-hub-tab="profile"]').dispatchEvent('click');
      if(!(await page.locator('#staging-hub-message').textContent()).includes('حساب آزمایشی'))throw Error('Missing restricted professional profile explanation');
      await hub.locator('[data-hub-tab="lessons"]').click();
      if(!(await page.locator('#staging-hub-message').textContent()).includes('آموزش'))throw Error('Lessons hub navigation did not activate');
      await page.locator('.bottom-nav [data-tab="home"]').click();
      // Verify a safe aggregate-only CSV export in the admin demo.
      const [download] = await Promise.all([
        page.waitForEvent('download',{timeout:15000}),
        page.locator('#admin-export-summary').click()
      ]);
      if(download.suggestedFilename()!=='candidatory-staging-summary.csv')throw Error('Unexpected export filename');
      // Candidate-oriented six-card home and preserved legacy access.
      await page.locator('.candidate-six-grid button').first().waitFor({timeout:12000});
      if(await page.locator('.candidate-six-grid button').count()!==6)throw Error('Candidate home must have exactly six primary actions');
      await page.locator('[data-candidate-target="profile"]').click();
      if(!(await page.locator('#candidate-v2-feedback').textContent()).includes('احرازشده'))throw Error('Missing private profile safeguard');
      await page.locator('.candidate-legacy summary').click();
      await page.locator('.admin-modern-home').waitFor({state:'visible',timeout:8000});
      await page.locator('.candidate-legacy summary').click();
      // Approved admin mobile layout and quick navigation.
      await page.locator('.admin-modern-stats .admin-modern-stat').first().waitFor({timeout:15000});
      if(await page.locator('.admin-modern-tile').count()!==4)throw Error('Missing four admin shortcuts');
      await page.locator('[data-admin-modern="users"]').click();
      await page.locator('#admin-design-detail:not([data-collapsed="true"])').waitFor();
      await page.locator('#admin-design-detail [data-admin-view="overview"]').click();
      await page.locator('#admin-modern-search').fill('گزارش');
      if(await page.locator('.admin-modern-tile:visible').count()!==1)throw Error('Dashboard search filter failed');
      await page.locator('#admin-modern-search').fill('');
      // Admin UI prototype: tabs, aggregate metrics and restricted functionality labels.
      const admin=page.locator('.admin-design-preview');
      await admin.locator('.admin-design-metrics article').first().waitFor({timeout:15000});
      if(await admin.locator('[role="tab"]').count()!==5)throw Error('Expected five admin design tabs');
      if(!(await admin.locator('.admin-design-head h2').textContent()).includes('مرکز فرماندهی'))throw Error('New admin dashboard title not present');
      await admin.locator('[data-admin-view="users"]').click();
      await admin.locator('.admin-design-content h3').filter({hasText:'مدیریت کاربران'}).waitFor();
      await admin.locator('[data-admin-view="reports"]').click();
      await admin.locator('.admin-design-task-status').waitFor({timeout:15000});
      await admin.locator('.admin-design-metrics article').first().waitFor({timeout:15000});
      await admin.locator('[data-admin-view="overview"]').click();
      // Interaction: chart refresh, disabled profile feedback and keyboard focus.
      await page.locator('#staging-dashboard-refresh').click();
      await page.locator('#staging-dashboard-body .staging-kpis').waitFor({timeout:15000});
      await page.locator('.bottom-nav [data-tab="profile"]').dispatchEvent("click");
      const feedback=await page.locator('#app-toast').textContent();
      if(!feedback?.includes('پیش‌نمایش'))throw Error('Profile preview feedback missing at '+width);
      await page.locator('#staging-dashboard-refresh').focus();
      const focused=await page.evaluate(()=>document.activeElement?.id);
      if(focused!=='staging-dashboard-refresh')throw Error('Refresh not keyboard focusable');
      // Dark-mode stylesheet coverage without mutating persistent preferences.
      await page.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));
      await page.screenshot({path:`staging-screenshots/mobile-${width}-dark.png`,fullPage:true});
      const dark=await page.locator('.staging-dashboard').evaluate(el=>getComputedStyle(el).backgroundColor);
      if(!dark)throw Error('Dark mode did not render');
      await page.evaluate(()=>document.documentElement.removeAttribute('data-theme'));
      // Audited navigation hit areas: each should be at least 44 CSS pixels tall.
      const sizes=await page.locator('.bottom-nav [data-tab]').evaluateAll(nodes=>nodes.map(el=>({name:el.getAttribute('data-tab'),w:Math.round(el.getBoundingClientRect().width),h:Math.round(el.getBoundingClientRect().height)})));
      console.log('navigation hit targets',width,JSON.stringify(sizes));
      if(sizes.some(x=>x.h<44||x.w<44))throw Error('Small mobile navigation tap target: '+JSON.stringify(sizes));
      // Check chart error/retry state against a simulated isolated API outage.
      await page.route('**/api/staging/dashboard',route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"TEST_OUTAGE"}'}));
      await page.locator('#staging-dashboard-refresh').click();
      await page.locator('#staging-dashboard-body .staging-error').waitFor({timeout:12000});
      const retry=page.locator('#staging-dashboard-body button');
      if(!await retry.isVisible())throw Error('Missing retry after staging API outage');
      await page.unroute('**/api/staging/dashboard');
      await retry.click();
      await page.locator('#staging-dashboard-body .staging-kpis').waitFor({timeout:15000});
      await page.close();
    }
  } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
