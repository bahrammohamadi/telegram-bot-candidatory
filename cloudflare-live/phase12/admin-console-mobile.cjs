const {chromium}=require('playwright');
const {readFileSync}=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 const source=readFileSync(__dirname+'/dist/integration-admin-console-worker.mjs','utf8');
 const start=source.indexOf('const TEST_PAGE=')+'const TEST_PAGE='.length;
 const html=process.env.ADMIN_CONSOLE_HTML_FILE?readFileSync(process.env.ADMIN_CONSOLE_HTML_FILE,'utf8'):JSON.parse(source.slice(start,source.indexOf(';\n',start)));
 const browser=await chromium.launch();
 try{
 for(const width of [320,375,430]){
  for(const isAdmin of [false,true]){
   const page=await browser.newPage({viewport:{width,height:850}}),errors=[],called=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{window.Telegram={WebApp:{initData:'synthetic_browser_only',ready(){}}}});
   await page.route('**/*',route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.hostname==='telegram.org')return route.fulfill({contentType:'application/javascript',body:''});
    if(url.pathname==='/api/profile')return route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,profile:{election_type:'council',stage:'planning',district:'Synthetic',professional_summary:''},details:{}})});
    if(url.pathname==='/api/membership')return route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,is_admin:isAdmin,mode:'isolated_demo_no_real_payment',plan:'free',subscription:null,requests:[],price_toman:6900000,duration_days:30,receipt_upload_available:false,real_payments_enabled:false})});
    if(url.pathname==='/api/entitlements')return route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,mode:'isolated_demo_no_real_payment',plan:'free',limits:{goals:5,calendar:10,practice:10,studio:3,quiz_daily:2},usage:{goals:0,calendar:0,practice:0,studio:0,quiz_daily:0},remaining:{goals:5,calendar:10,practice:10,studio:3,quiz_daily:2}})});
    if(url.pathname==='/api/admin-console'){
     const data=JSON.parse(request.postData());called.push(data.action);
     const result=data.action==='overview'?{ok:true,requests:{total:2,pending:1,approved:1,rejected:0},decisions_logged:1,demo_professional_accounts:1,test_accounts:4,real_payments_enabled:false,receipt_upload_available:false}
      :data.action==='requests'?{ok:true,requests:data.status==='approved'?[{id:'a',reference:'DEMO-001',telegram_id:910000001,status:'approved',created_at:'2026-11-02'}]:data.status==='pending'?[{id:'b',reference:'DEMO-002',telegram_id:910000002,status:'pending',created_at:'2026-11-02'}]:[]}
      :data.action==='audit'?{ok:true,entries:[{id:'a',actor_id:910000002,action:'demo_approve',record_id:'a',created_at:'2026-11-02'}]}
      :{ok:true,reviewed_without_audit:0};
     return route.fulfill({contentType:'application/json',body:JSON.stringify(result)});
    }
    return route.fulfill({contentType:'text/html',body:html});
   });
   await page.goto('https://admin.synthetic/');
   await page.locator('#form').waitFor({state:'visible'});
   await page.locator('#save').click();
   await page.locator('#review').waitFor({state:'visible'});
   await page.locator('#go-dashboard').click();
   await page.locator('#dashboard').waitFor({state:'visible'});
   await page.locator('#open-membership').click();
   await page.locator('#membership-panel').waitFor({state:'visible'});
   assert.equal(await page.locator('#membership-admin').isVisible(),isAdmin);
   if(!isAdmin){assert.equal(called.length,0,'unauthorized client does not call admin API')}
   else{
    await page.locator('#admin-console-summary article').first().waitFor({state:'visible'});
    assert.equal(await page.locator('#admin-console-summary article').count(),7);
    assert.equal(await page.locator('#admin-console-requests article').count(),1);
    assert.equal(await page.locator('#admin-console-audit article').count(),1);
    await page.locator('#admin-console-filter').selectOption('approved');
    await page.waitForFunction(()=>document.querySelector('#admin-console-requests')?.textContent.includes('DEMO-001'));
    assert.equal(await page.locator('#admin-console-diagnostic').innerText(),'بازبینی دفتر ممیزی: برای تمام تصمیم‌های نمایشی ثبت‌شده، سابقه وجود دارد.');
    await page.locator('#admin-console-refresh').click();
    await page.waitForFunction(()=>document.querySelector('#admin-console-status')?.textContent.includes('به‌روز شدند'));
    assert.ok(called.includes('overview')&&called.includes('requests')&&called.includes('audit')&&called.includes('verify'));
   }
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2),false,'overflow at '+width);
   assert.deepEqual(errors,[],'no browser errors');
   await page.locator('#membership-close').click();
   assert.equal(await page.locator('.modules').isVisible(),true);
   console.log('PASS admin console viewport '+width+'px; authorized='+isAdmin);
   await page.close();
  }
 }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
