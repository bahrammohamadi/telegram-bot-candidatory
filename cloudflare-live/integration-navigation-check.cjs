const {chromium}=require('playwright');
const fs=require('node:fs');
(async()=>{
 const source=fs.readFileSync(__dirname+'/dist/integration-worker.mjs','utf8');
 const asset=name=>{const marker='const '+name+'=',start=source.indexOf(marker)+marker.length;return JSON.parse(source.slice(start,source.indexOf(';\n',start)))};
 const browser=await chromium.launch({headless:true});
 try{for(const width of [320,375,430,768,1024]){
 const page=await browser.newPage({viewport:{width,height:850}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{
 const path=new URL(route.request().url()).pathname;
 const files={'/':['SITE_HTML','text/html'],'/app.js':['SITE_APP','text/javascript'],'/ops-ui.js':['SITE_OPS','text/javascript'],'/style.css':['SITE_CSS','text/css']};
 if(new URL(route.request().url()).hostname!=='candidate.test')return route.abort();
 if(files[path])return route.fulfill({body:asset(files[path][0]),contentType:files[path][1]});
 return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Test: authentication unavailable'})});
 });
 await page.goto('https://candidate.test/');
 // A client without signed Telegram initData must not expose the private home.
 const guarded=await page.locator('#home-panel').evaluate(el=>{
  const style=getComputedStyle(el);
  return el.hidden || style.display==='none' || style.visibility==='hidden' || !!el.closest('[hidden]');
 });
 if(!guarded)throw Error('Unauthenticated private home unexpectedly visible');
 // This is a navigation-component smoke test, not an authenticated Telegram E2E test.
 // The synthetic API returns 503 by design, so the app's auth gate keeps home hidden.
 // Reveal only the already-rendered home ancestors for isolated navigation testing.
 await page.locator('.functional-grid').waitFor({state:'attached'});
 await page.evaluate(()=>{
  const grid=document.querySelector('.functional-grid');
  if(!grid || grid.querySelectorAll(':scope > button').length!==6)throw Error('Functional navigation was not rendered');
  for(let node=grid.parentElement;node&&node!==document.body;node=node.parentElement){
   if(node.hidden)node.hidden=false;
   if(getComputedStyle(node).display==='none')node.style.display='block';
  }
 });
 await page.locator('.functional-grid').waitFor({state:'visible',timeout:5000});
 // Any existing first-visit overlay is dismissed by its own control.
 const skip=page.locator('#first-visit-skip');if(await skip.isVisible())await skip.click();
 const cards=page.locator('.functional-grid>button');
 if(await cards.count()!==6)throw Error('Expected six sections');
 for(let i=0;i<6;i++){
 await cards.nth(i).click();
 await page.locator('#functional-section').waitFor({state:'visible'});
 if(await page.locator('[data-functional-route]').count()<3)throw Error('Missing tool routes');
 await page.locator('#functional-heading').press('Escape');
 if(!await cards.nth(i).evaluate(el=>el===document.activeElement))throw Error('Focus not restored');
 }
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
 if(overflow)throw Error('Horizontal overflow '+width);
 if(errors.length)throw Error(errors.join('\n'));
 console.log('PASS six sections, routes, keyboard focus and responsive viewport '+width);
 await page.close();
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
