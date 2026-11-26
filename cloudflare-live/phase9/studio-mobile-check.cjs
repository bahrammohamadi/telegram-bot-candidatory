const {chromium}=require('playwright');
const {readFileSync}=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 const source=readFileSync(__dirname+'/dist/integration-studio-worker.mjs','utf8');
 const start=source.indexOf('const TEST_PAGE=')+'const TEST_PAGE='.length;
 const html=process.env.STUDIO_HTML_FILE?readFileSync(process.env.STUDIO_HTML_FILE,'utf8'):JSON.parse(source.slice(start,source.indexOf(';\n',start)));
 const browser=await chromium.launch();
 try{
  for(const width of [320,375,430]){
   const page=await browser.newPage({viewport:{width,height:820}});
   const errors=[],drafts=[],requests=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('dialog',dialog=>dialog.accept());
   await page.addInitScript(()=>{window.Telegram={WebApp:{initData:'synthetic_browser_data_only',ready(){}}}});
   await page.route('**/*',route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.hostname==='telegram.org')return route.fulfill({contentType:'application/javascript',body:''});
    if(url.pathname==='/api/profile')return route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,profile:{election_type:'council',stage:'planning',district:'Synthetic',professional_summary:''},details:{}})});
    if(url.pathname==='/api/studio'){
     const b=JSON.parse(request.postData()||'{}');requests.push(b.action);
     let data={ok:true};
     if(b.action==='list')data={ok:true,drafts:drafts.map(x=>({...x}))};
     if(b.action==='create'){const id='00000000-0000-4000-8000-'+String(drafts.length+1).padStart(12,'0');drafts.push({id,kind:b.kind,title:b.title,body:b.body,source_url:b.source_url,status:b.status,created_at:'2026-11-02',updated_at:'2026-11-02'});data={ok:true,id}}
     if(b.action==='update'){const i=drafts.findIndex(d=>d.id===b.id);if(i>=0)Object.assign(drafts[i],{kind:b.kind,title:b.title,body:b.body,source_url:b.source_url,status:b.status})}
     if(b.action==='delete'){const i=drafts.findIndex(d=>d.id===b.id);if(i>=0)drafts.splice(i,1)}
     return route.fulfill({contentType:'application/json',body:JSON.stringify(data)});
    }
    return route.fulfill({contentType:'text/html',body:html});
   });
   await page.goto('https://studio.synthetic/');
   await page.locator('#form').waitFor({state:'visible'});
   await page.locator('#save').click();
   await page.locator('#review').waitFor({state:'visible'});
   await page.locator('#go-dashboard').click();
   await page.locator('#dashboard').waitFor({state:'visible'});
   await page.locator('[data-module="استودیوی محتوا"]').click();
   await page.locator('#studio-panel').waitFor({state:'visible'});
   await page.locator('#studio-form [name="kind"]').selectOption('service_update');
   await page.locator('#studio-form [name="title"]').fill('اطلاعیه عمومی آزمایشی');
   await page.locator('#studio-facts').fill('اطلاعات مورد تایید به صورت ساختگی');
   await page.locator('#studio-form [name="source_url"]').fill('https://example.org/document');
   await page.locator('#studio-compose').click();
   assert.match(await page.locator('#studio-body').inputValue(),/اطلاعات مورد تایید/);
   await page.locator('#studio-body').fill('متن گزارش عمومی آزمایشی بدون هیچ اطلاعات واقعی یا خصوصی');
   await page.locator('#studio-save').click();
   await page.locator('#studio-list article').first().waitFor({state:'visible'});
   assert.equal(drafts.length,1);
   await page.locator('#studio-list article button').first().click();
   assert.equal(await page.locator('#studio-form [name="title"]').inputValue(),'اطلاعیه عمومی آزمایشی');
   await page.locator('#studio-form [name="title"]').fill('اطلاعیه عمومی بازبینی‌شده');
   await page.locator('#studio-form [name="status"]').selectOption('reviewed');
   await page.locator('#studio-save').click();
   await page.waitForFunction(()=>document.querySelector('#studio-list').textContent.includes('بازبینی‌شده'));
   assert.equal(drafts.length,1);
   assert.equal(drafts[0].status,'reviewed');
   await page.locator('#studio-list article button').last().click();
   await page.waitForFunction(()=>document.querySelectorAll('#studio-list article').length===0);
   assert.equal(drafts.length,0);
   assert.deepEqual(requests.filter(x=>!['list'].includes(x)),['create','update','delete']);
   assert.equal(await page.locator('.modules').isVisible(),false);
   await page.locator('#studio-close').click();
   assert.equal(await page.locator('.modules').isVisible(),true);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2),false);
   assert.deepEqual(errors,[]);
   console.log('PASS: neutral studio editor, create/update/delete, 3-step navigation, mobile '+width+'px');
   await page.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
