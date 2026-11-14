const {chromium}=require('playwright');
const {readFileSync}=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 const src=readFileSync(__dirname+'/dist/integration-assistant-worker.mjs','utf8');
 const marker='const TEST_PAGE=',start=src.indexOf(marker)+marker.length;
 const html=process.env.ASSISTANT_HTML_FILE?readFileSync(process.env.ASSISTANT_HTML_FILE,'utf8'):JSON.parse(src.slice(start,src.indexOf(';\n',start)));
 const browser=await chromium.launch();
 try{
 for(const width of [320,375,430]){
  const page=await browser.newPage({viewport:{width,height:820}});
  const errors=[],actions=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.Telegram={WebApp:{initData:'synthetic_browser_only',ready(){}}}});
  await page.route('**/*',route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.hostname==='telegram.org')return route.fulfill({contentType:'application/javascript',body:''});
   if(url.pathname==='/api/profile')return route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,profile:{election_type:'council',stage:'planning',district:'Synthetic district',professional_summary:''},details:{}})});
   if(url.pathname==='/api/assistant'){
    const data=JSON.parse(req.postData());actions.push(data.action);
    const response=data.action==='status'?{ok:true,ai_available:false,plan:'free',mode:'guided_only',used_today:0,remaining_today:2,daily_user_limit:2}
     :{ok:true,engine:'static_guidance_no_ai',title:'دستور جلسه خدمات عمومی',topic:data.topic,steps:['تعیین هدف جلسه','ثبت مسئول پیگیری','تعیین مهلت پاسخ','بررسی صورت‌جلسه'],source_note:'منابع رسمی را بررسی کنید.'};
    return route.fulfill({contentType:'application/json',body:JSON.stringify(response)});
   }
   return route.fulfill({contentType:'text/html',body:html});
  });
  await page.goto('https://assistant.synthetic/');
  await page.locator('#form').waitFor({state:'visible'});
  await page.locator('#save').click();
  await page.locator('#review').waitFor({state:'visible'});
  await page.locator('#go-dashboard').click();
  await page.locator('#dashboard').waitFor({state:'visible'});
  await page.locator('[data-module="دستیار هوشمند"]').click();
  await page.locator('#assistant-panel').waitFor({state:'visible'});
  await page.waitForFunction(()=>document.querySelector('#assistant-ai-state')?.textContent.includes('فعال نشده'));
  assert.equal(await page.locator('#assistant-ask').isDisabled(),true);
  await page.locator('#assistant-task').selectOption('agenda');
  await page.locator('#assistant-topic').fill('جلسه آموزشی آزمایشی');
  await page.locator('#assistant-guide').click();
  await page.locator('#assistant-result').waitFor({state:'visible'});
  assert.equal(await page.locator('#assistant-result-text p').count(),6);
  assert.match(await page.locator('#assistant-result-text').innerText(),/جلسه آموزشی آزمایشی/);
  assert.deepEqual(actions,['status','guide']);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,'horizontal overflow at '+width);
  assert.deepEqual(errors,[],'no browser script failures');
  await page.locator('#assistant-close').click();
  assert.equal(await page.locator('.modules').isVisible(),true);
  console.log('PASS assistant: no-cost guide, AI disabled, privacy, dashboard navigation, mobile '+width+'px');
  await page.close();
 }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
