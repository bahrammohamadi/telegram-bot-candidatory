const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 const path=__dirname+'/dist/integration-practice-worker.mjs';
 const source=fs.readFileSync(path,'utf8');
 const begin=source.indexOf('const TEST_PAGE=')+'const TEST_PAGE='.length;
 const html=process.env.PRACTICE_HTML_FILE?fs.readFileSync(process.env.PRACTICE_HTML_FILE,'utf8'):JSON.parse(source.slice(begin,source.indexOf(';\n',begin)));
 const browser=await chromium.launch();
 try{
 for(const width of [320,375,430]){
  const page=await browser.newPage({viewport:{width,height:820}});
  const errors=[],items=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.Telegram={WebApp:{initData:'synthetic_test_only',ready(){}}}});
  await page.route('**/*',route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.hostname==='telegram.org')return route.fulfill({contentType:'application/javascript',body:''});
   if(url.pathname==='/api/profile')return route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,profile:{election_type:'council',stage:'planning',district:'Synthetic district',professional_summary:''},details:{}})});
   if(url.pathname==='/api/practice'){
    const b=JSON.parse(req.postData()),action=b.action;
    if(action==='create')items.push({id:'00000000-0000-4000-8000-'+String(items.length+1).padStart(12,'0'),exercise_key:b.exercise_key,kind:b.exercise_key.startsWith('speech')?'speech':'qa',response_text:b.response_text,reflection:b.reflection,self_score:b.self_score,duration_seconds:b.duration_seconds,created_at:'2026-11-02T09:00:00'});
    if(action==='delete'){const i=items.findIndex(x=>x.id===b.id);if(i>=0)items.splice(i,1)}
    const result=action==='list'?{ok:true,sessions:items.map(x=>({...x}))}:{ok:true};
    return route.fulfill({contentType:'application/json',body:JSON.stringify(result)});
   }
   return route.fulfill({contentType:'text/html',body:html});
  });
  await page.goto('https://synthetic.test/');
  await page.locator('#form').waitFor({state:'visible'});
  await page.locator('#save').click();
  await page.locator('#review').waitFor({state:'visible'});
  await page.locator('#go-dashboard').click();
  await page.locator('#dashboard').waitFor({state:'visible'});
  await page.locator('[data-module="تمرین و آمادگی"]').click();
  await page.locator('#practice-panel').waitFor({state:'visible'});
  assert.equal(await page.locator('.modules').isVisible(),false);
  await page.locator('#practice-exercise').selectOption('speech_clear');
  assert.match(await page.locator('#practice-prompt').innerText(),/۹۰ ثانیه/);
  await page.locator('#practice-form [name="response_text"]').fill('گزارش ساختگی برای تمرین بیان روشن موضوعات عمومی');
  await page.locator('#practice-form [name="reflection"]').fill('نیاز به بیان روشن‌تر داده و منبع دارم');
  await page.locator('#practice-form [name="self_score"]').selectOption('4');
  await page.locator('#practice-start').click();
  await page.waitForTimeout(1050);
  await page.locator('#practice-stop').click();
  assert.ok(Number(await page.locator('#practice-form [name="duration_seconds"]').inputValue())>=1,'Timer did not advance');
  await page.locator('#practice-save').click();
  await page.locator('#practice-list article').first().waitFor({state:'visible'});
  assert.match(await page.locator('#practice-summary').innerText(),/تعداد تمرین‌های ثبت‌شده: 1/);
  await page.locator('#practice-exercise').selectOption('qa_unknown');
  await page.locator('#practice-form [name="reflection"]').fill('هنگام پاسخ با صداقت عدم قطعیت را توضیح دادم');
  await page.locator('#practice-save').click();
  await page.waitForFunction(()=>document.querySelectorAll('#practice-list article').length===2);
  assert.match(await page.locator('#practice-summary').innerText(),/تعداد تمرین‌های ثبت‌شده: 2/);
  await page.locator('#practice-list article button').first().click();
  await page.waitForFunction(()=>document.querySelectorAll('#practice-list article').length===1);
  await page.locator('#practice-close').click();
  assert.equal(await page.locator('#practice-panel').isVisible(),false);
  assert.equal(await page.locator('.modules').isVisible(),true);
  assert.deepEqual(errors,[],'Client errors');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);
  assert.equal(overflow,false,'Horizontal overflow at '+width);
  console.log('PASS: three-step journey, practice timer, two exercise types, save/delete, layout at '+width+' px');
  await page.close();
 }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
