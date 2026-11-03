const {chromium}=require('playwright');
const {readFileSync}=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 const src=readFileSync(__dirname+'/dist/integration-tasks-worker.mjs','utf8');
 const marker='const TEST_PAGE=',start=src.indexOf(marker)+marker.length;
 const html=process.env.TASKS_HTML_FILE?readFileSync(process.env.TASKS_HTML_FILE,'utf8'):JSON.parse(src.slice(start,src.indexOf(';\n',start)));
 const browser=await chromium.launch();
 try{
  for(const width of [320,375,430]){
   const page=await browser.newPage({viewport:{width,height:820}});
   const errors=[],requests=[],items=[];
   page.on('pageerror',error=>errors.push(error.message));
   page.on('dialog',dialog=>dialog.accept());
   await page.addInitScript(()=>{window.Telegram={WebApp:{initData:'synthetic_browser_token',ready(){}}}});
   await page.route('**/*',route=>{
    const req=route.request(),url=new URL(req.url());
    if(url.hostname==='telegram.org')return route.fulfill({contentType:'application/javascript',body:''});
    if(url.pathname==='/api/profile')return route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,profile:{election_type:'council',stage:'planning',district:'Synthetic',professional_summary:''},details:{}})});
    if(url.pathname==='/api/tasks'){
     const body=JSON.parse(req.postData());requests.push(body.action);
     let status=200,data={ok:true};
     if(body.action==='list')data={ok:true,tasks:items.map(t=>({...t,is_overdue:t.status!=='done'&&t.due_date==='2020-01-01'?1:0}))};
     if(body.action==='summary')data={ok:true,plan:'free',limit:10,summary:{total:items.length,open:items.filter(x=>x.status==='open').length,doing:items.filter(x=>x.status==='doing').length,done:items.filter(x=>x.status==='done').length,overdue:items.filter(x=>x.status!=='done'&&x.due_date==='2020-01-01').length},remaining:10-items.length,demo_only:true};
     if(body.action==='create'){
      const id='00000000-0000-4000-8000-000000001401';
      items.push({id,title:body.title,details:body.details,priority:body.priority,due_date:body.due_date||null,status:'open',done_at:null,created_at:'2026-11-03',updated_at:'2026-11-03'});
      status=201;data={ok:true,id};
     }
     if(body.action==='status'){
      const x=items.find(t=>t.id===body.id);if(x){x.status=body.status;x.done_at=body.status==='done'?'2026-11-03':null}
     }
     if(body.action==='update'){
      const x=items.find(t=>t.id===body.id);if(x)Object.assign(x,{title:body.title,details:body.details,due_date:body.due_date||null,priority:body.priority});
     }
     if(body.action==='delete'){const i=items.findIndex(t=>t.id===body.id);if(i>=0)items.splice(i,1)}
     return route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
    }
    return route.fulfill({contentType:'text/html',body:html});
   });
   await page.goto('https://tasks.synthetic/');
   await page.locator('#form').waitFor({state:'visible'});
   await page.locator('#save').click();
   await page.locator('#review').waitFor({state:'visible'});
   await page.locator('#go-dashboard').click();
   await page.locator('#dashboard').waitFor({state:'visible'});
   await page.locator('[data-module="برنامه و پیگیری وظایف"]').click();
   await page.locator('#tasks-panel').waitFor({state:'visible'});
   await page.locator('#tasks-form [name="title"]').fill('صورت‌جلسه خدمات عمومی آزمایشی');
   await page.locator('#tasks-form [name="details"]').fill('اطلاعات ساختگی برای تست');
   await page.locator('#tasks-form [name="priority"]').selectOption('high');
   await page.locator('#tasks-form [name="due_date"]').fill('2020-01-01');
   await page.locator('#tasks-save').click();
   await page.locator('.task-card').first().waitFor({state:'visible'});
   assert.equal(items.length,1);
   assert.match(await page.locator('.task-card').innerText(),/عقب‌افتاده/);
   assert.match(await page.locator('#tasks-summary').innerText(),/باقیمانده: 9/);
   await page.locator('#tasks-filter').selectOption('overdue');
   assert.equal(await page.locator('.task-card').count(),1);
   await page.locator('.task-card select').selectOption('done');
   await page.waitForFunction(()=>document.querySelectorAll('.task-card').length===0);
   await page.locator('#tasks-filter').selectOption('done');
   await page.locator('.task-card').first().waitFor({state:'visible'});
   await page.locator('.task-card button').first().click();
   assert.equal(await page.locator('#tasks-form [name="title"]').inputValue(),'صورت‌جلسه خدمات عمومی آزمایشی');
   await page.locator('#tasks-form [name="title"]').fill('صورت‌جلسه بررسی‌شده و اصلاح‌شده');
   await page.locator('#tasks-form [name="due_date"]').fill('');
   await page.locator('#tasks-save').click();
   await page.waitForFunction(()=>document.querySelector('.task-card')?.textContent.includes('اصلاح‌شده'));
   assert.equal(items.length,1);
   await page.locator('.task-card button').last().click();
   await page.waitForFunction(()=>document.querySelectorAll('.task-card').length===0);
   assert.equal(items.length,0);
   assert.deepEqual(requests.filter(x=>['create','update','status','delete'].includes(x)),['create','status','update','delete']);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,'horizontal overflow '+width);
   assert.deepEqual(errors,[]);
   await page.locator('#tasks-close').click();
   assert.equal(await page.locator('.modules').isVisible(),true);
   console.log('PASS mobile tasks: create, overdue, done, edit, delete, quotas, '+width+'px');
   await page.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
