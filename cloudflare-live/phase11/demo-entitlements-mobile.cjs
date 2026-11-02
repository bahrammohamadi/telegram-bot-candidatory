const {chromium}=require('playwright');
const {readFileSync}=require('node:fs');
const assert=require('node:assert/strict');

(async()=>{
 const source=readFileSync(__dirname+'/dist/integration-entitlements-worker.mjs','utf8');
 const token='const TEST_PAGE=',start=source.indexOf(token)+token.length;
 const html=process.env.ENTITLEMENTS_HTML_FILE?readFileSync(process.env.ENTITLEMENTS_HTML_FILE,'utf8'):JSON.parse(source.slice(start,source.indexOf(';\n',start)));
 const browser=await chromium.launch();
 try{
  for(const width of [320,375,430]){
   const page=await browser.newPage({viewport:{width,height:850}});
   const errors=[],requests=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{window.Telegram={WebApp:{initData:'synthetic-not-a-real-token',ready(){}}}});
   await page.route('**/*',route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.hostname==='telegram.org')return route.fulfill({contentType:'application/javascript',body:''});
    if(url.pathname==='/api/profile')return route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,profile:{election_type:'council',stage:'planning',district:'Synthetic',professional_summary:''},details:{}})});
    if(url.pathname==='/api/entitlements'){
     const data=JSON.parse(request.postData());requests.push(data.action);
     const payload={ok:true,mode:'isolated_demo_no_real_payment',plan:'free',limits:{goals:5,calendar:10,practice:10,studio:3,quiz_daily:2},usage:{goals:1,calendar:2,practice:0,studio:3,quiz_daily:1},remaining:{goals:4,calendar:8,practice:10,studio:0,quiz_daily:1},subscription_paid_verified:false,real_payments_enabled:false};
     return route.fulfill({contentType:'application/json',body:JSON.stringify(payload)});
    }
    if(url.pathname==='/api/membership'){
     const b=JSON.parse(request.postData());requests.push(b.action);
     const payload={ok:true,mode:'isolated_demo_no_real_payment',is_admin:false,plan:'free',subscription:null,requests:[],price_toman:6900000,duration_days:30,receipt_upload_available:false,real_payments_enabled:false};
     return route.fulfill({contentType:'application/json',body:JSON.stringify(payload)});
    }
    return route.fulfill({contentType:'text/html',body:html});
   });
   await page.goto('https://entitlements.synthetic/');
   await page.locator('#form').waitFor({state:'visible'});
   await page.locator('#save').click();
   await page.locator('#review').waitFor({state:'visible'});
   await page.locator('#go-dashboard').click();
   await page.locator('#dashboard').waitFor({state:'visible'});
   await page.locator('#open-membership').click();
   await page.locator('#membership-panel').waitFor({state:'visible'});
   await page.locator('#membership-limits h4').waitFor({state:'visible'});
   const text=await page.locator('#membership-limits').innerText();
   assert.match(text,/رایگان/);
   assert.match(text,/پیش‌نویس‌های محتوا: 3 استفاده‌شده از 3/);
   assert.match(text,/باقیمانده: 0/);
   assert.match(text,/دفعات آزمون در ۲۴ ساعت/);
   assert.equal(await page.locator('#membership-admin').isVisible(),false);
   assert.equal(requests.filter(x=>x==='status').length,2,'membership and entitlements checked');
   await page.locator('#membership-refresh').click();
   assert.equal(requests.filter(x=>x==='status').length,4,'refresh must call both APIs');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,'horizontal overflow '+width);
   assert.deepEqual(errors,[]);
   await page.locator('#membership-close').click();
   assert.equal(await page.locator('.modules').isVisible(),true);
   console.log('PASS entitlement usage and remaining quota display on '+width+'px');
   await page.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
