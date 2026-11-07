const {chromium}=require('playwright');
const {readFileSync}=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
const source=readFileSync(__dirname+'/dist/integration-membership-worker.mjs','utf8');
const marker='const TEST_PAGE=',start=source.indexOf(marker)+marker.length;
const html=process.env.MEMBERSHIP_HTML_FILE?readFileSync(process.env.MEMBERSHIP_HTML_FILE,'utf8'):JSON.parse(source.slice(start,source.indexOf(';\n',start)));
const browser=await chromium.launch();
try{
 for(const width of [320,375,430]){
  const page=await browser.newPage({viewport:{width,height:850}}),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.Telegram={WebApp:{initData:'synthetic_test_only',ready(){}}}});
  await page.route('**/*',route=>{
   const req=route.request(),path=new URL(req.url()).pathname;
   if(new URL(req.url()).hostname==='telegram.org')return route.fulfill({contentType:'application/javascript',body:''});
   if(path==='/api/profile')return route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,profile:{election_type:'council',stage:'planning',district:'Synthetic',professional_summary:''},details:{}})});
   if(path==='/api/membership'){
    const b=JSON.parse(req.postData());
    let d={ok:true};
    if(b.action==='status')d={ok:true,mode:'isolated_demo_no_real_payment',is_admin:false,plan:'free',subscription:null,requests:requests.map(x=>({...x})),price_toman:6900000,duration_days:30,receipt_upload_available:false,real_payments_enabled:false};
    if(b.action==='demo_request'){
     const id='00000000-0000-4000-8000-000000000111',reference='DEMO-SYNTHETIC';
     requests.push({id,reference,plan_id:'professional',status:'pending',created_at:'2026-11-02 12:00:00',reviewed_at:null});
     d={ok:true,id,reference,status:'pending'};
    }
    return route.fulfill({contentType:'application/json',body:JSON.stringify(d)});
   }
   return route.fulfill({contentType:'text/html',body:html});
  });
  await page.goto('https://membership.synthetic/');
  await page.locator('#form').waitFor({state:'visible'});
  await page.locator('#save').click();
  await page.locator('#review').waitFor({state:'visible'});
  await page.locator('#go-dashboard').click();
  await page.locator('#dashboard').waitFor({state:'visible'});
  await page.locator('#open-membership').click();
  await page.locator('#membership-panel').waitFor({state:'visible'});
  assert.equal(await page.locator('#membership-admin').isVisible(),false,'admin closed by default');
  assert.match(await page.locator('#membership-panel').innerText(),/پرداخت واقعی و آپلود رسید فعال نیست/);
  await page.locator('#membership-demo-request').click();
  await page.locator('#membership-requests article').first().waitFor({state:'visible'});
  assert.equal(requests.length,1);
  assert.equal(await page.locator('#membership-demo-request').isDisabled(),true);
  assert.match(await page.locator('#membership-summary').innerText(),/رایگان/);
  await page.locator('#membership-refresh').click();
  assert.equal(await page.locator('#membership-requests article').count(),1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,'overflow at '+width);
  await page.locator('#membership-close').click();
  assert.equal(await page.locator('.modules').isVisible(),true);
  assert.deepEqual(errors,[]);
  console.log('PASS: membership demo status, request, no payment, hidden admin, mobile '+width+'px');
  await page.close();
 }
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
