const {chromium}=require('playwright');
const {readFileSync}=require('node:fs');
const {createHmac}=require('node:crypto');
const {DatabaseSync}=require('node:sqlite');

(async()=>{
 const {default:router}=await import('./dist/entrypoint.mjs');
 const db=new DatabaseSync(':memory:');
 for(const p of ['../integration-schema.sql','../phase13/assistant-migration.sql','../phase14/tasks-migration.sql'])db.exec(readFileSync(new URL(p,'file://'+__dirname+'/main-review-browser.cjs'),'utf8'));
 const REVIEW_DB={
  prepare(sql){const st=db.prepare(sql);return {bind(...params){return {
   async first(){return st.get(...params)||null},async all(){return {results:st.all(...params)}},
   async run(){const r=st.run(...params);return {meta:{changes:r.changes}}}
  }},async first(){return st.get()||null},async all(){return {results:st.all()}},async run(){return {meta:{changes:st.run().changes}}}}},
  async batch(stmts){db.exec('BEGIN');try{const x=[];for(const s of stmts)x.push(await s.run());db.exec('COMMIT');return x}catch(e){db.exec('ROLLBACK');throw e}}
 };
 const token='123456789:SYNTHETIC_REVIEW_BOT';
 function signed(id){
  const p=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id,first_name:'Review'}),signature:'synthetic'});
  const msg=[...p.entries()].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>k+'='+v).join('\n');
  const secret=createHmac('sha256','WebAppData').update(token).digest();
  p.set('hash',createHmac('sha256',secret).update(msg).digest('hex'));
  return p.toString();
 }
 const initData=signed(9107124111);
 const env={TELEGRAM_BOT_TOKEN:token,REVIEW_DB,DB:new Proxy({}, {get(){throw Error('MAIN_DB_ACCESS_DURING_PREVIEW_TEST')}})};
 const browser=await chromium.launch();
 try{
  for(const width of [320,375,430]){
   const page=await browser.newPage({viewport:{width,height:850}}),jsErrors=[];
   page.on('pageerror',err=>jsErrors.push(err.message));
   await page.addInitScript(id=>{window.Telegram={WebApp:{initData:id,ready(){},expand(){}}}},initData);
   await page.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.hostname==='telegram.org')return route.fulfill({status:200,contentType:'application/javascript',body:''});
    if(['fonts.googleapis.com','fonts.gstatic.com'].includes(url.hostname))return route.fulfill({status:200,contentType:'text/css',body:''});
    if(url.pathname==='/review/api/bot-info')return route.fulfill({contentType:'application/json',body:JSON.stringify({telegramTokenValid:true,botUsername:'candidatoryiran_bot'})});
    if(url.hostname!=='main-bot.synthetic')return route.abort();
    const method=request.method(),payload=request.postData();
    const headers=request.headers();
    const resp=await router.fetch(new Request(request.url(),{method,headers,body:method==='GET'||method==='HEAD'?undefined:payload}),env);
    const body=Buffer.from(await resp.arrayBuffer());
    return route.fulfill({status:resp.status,headers:Object.fromEntries(resp.headers),body});
   });
   await page.goto('https://main-bot.synthetic/');
   await page.locator('a.candidatory-review-entry').waitFor({state:'visible'});
   if(!(await page.locator('a.candidatory-review-entry').getAttribute('href')==='/review'))throw Error('Main review link missing');
   await page.locator('a.candidatory-review-entry').click();
   await page.waitForURL('**/review');
   await page.locator('.main-review-notice').waitFor({state:'visible'});
   const note=await page.locator('.main-review-notice').innerText();
   if(!note.includes('دیتابیس آزمایشی'))throw Error('No isolated-data warning');
   await page.locator('#form').waitFor({state:'visible'});
   await page.locator('#save').click();
   await page.locator('#review').waitFor({state:'visible'});
   await page.locator('#go-dashboard').click();
   await page.locator('#dashboard').waitFor({state:'visible'});
   await page.locator('[data-module="برنامه و پیگیری وظایف"]').click();
   await page.locator('#tasks-panel').waitFor({state:'visible'});
   await page.locator('#tasks-form [name="title"]').fill('وظیفه تست بازبینی در ربات اصلی');
   await page.locator('#tasks-form [name="details"]').fill('فقط اطلاعات ساختگی');
   await page.locator('#tasks-save').click();
   await page.locator('.task-card').first().waitFor({state:'visible'});
   if(!((await page.locator('.task-card').first().innerText()).includes('وظیفه تست بازبینی')))throw Error('Task not saved');
   if(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2))throw Error('Horizontal overflow at '+width);
   if(jsErrors.some(e=>/assistant|tasks|review/i.test(e)))throw Error('Preview runtime errors '+JSON.stringify(jsErrors));
   console.log('PASS main-bot review link, signed profile and private task via preview router, mobile '+width+'px');
   await page.close();
  }
 }finally{await browser.close();db.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
