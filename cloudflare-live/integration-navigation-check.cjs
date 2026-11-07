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
 const group=page.getByRole('group',{name:'بخش‌های اصلی کاندیداتوری'});
 if(await group.count()!==1)throw Error('Main navigation lacks accessible group label');
 if(await page.locator('#functional-section[role="region"][aria-labelledby="functional-heading"]').count()!==1)throw Error('Section region lacks accessible heading association');
 for(let i=0;i<6;i++){
 await cards.nth(i).click();
 await page.locator('#functional-section').waitFor({state:'visible'});
 if(await cards.nth(i).getAttribute('aria-expanded')!=='true')throw Error('Selected section is not announced expanded');
 if(await page.locator('.functional-grid>button[aria-expanded="true"]').count()!==1)throw Error('Multiple navigation sections announced expanded');
 if(await page.locator('#functional-section').getAttribute('role')!=='region')throw Error('Expanded section lacks region role');
 if(await page.locator('[data-functional-route]').count()<3)throw Error('Missing tool routes');
 await page.locator('#functional-heading').press('Escape');
 if(!await page.locator('#functional-section').isHidden())throw Error('Section remains visible after Escape');
 if(await cards.nth(i).getAttribute('aria-expanded')!=='false')throw Error('Closed section remains announced expanded');
 if(!await cards.nth(i).evaluate(el=>el===document.activeElement))throw Error('Focus not restored');
 }
 // Regression: tasks and performance reports must remain reachable from their distinct sections.
 const expectedRoutes=[
  {section:'برنامه و وظایف',route:'tasks'},
  {section:'گزارش عملکرد',route:'reports'},
  {section:'گزارش عملکرد',route:'progress'}
 ];
 for(const {section,route} of expectedRoutes){
  const card=cards.filter({hasText:section});
  if(await card.count()!==1)throw Error('Missing primary section '+section);
  await card.click();
  await page.locator('#functional-section').waitFor({state:'visible'});
  if(await page.locator('#functional-heading').textContent()!==section)throw Error('Wrong heading for '+section);
  const target=page.locator('#functional-section [data-functional-route="'+route+'"]');
  if(await target.count()!==1 || !await target.isVisible())throw Error('Missing visible route '+route);
  await page.keyboard.press('Escape');
  if(!await card.evaluate(el=>el===document.activeElement))throw Error('Route focus restoration failed '+route);
 }
 // The tasks panel must offer a direct, visible shortcut to existing performance reports.
 const taskSection=cards.filter({hasText:'برنامه و وظایف'});
 await taskSection.click();
 const reportShortcut=page.locator('#functional-section [data-cross-section="tasks-to-reports"][data-functional-route="reports"]');
 if(await reportShortcut.count()!==1 || !await reportShortcut.isVisible())throw Error('Missing tasks-to-reports shortcut');
 if((await reportShortcut.textContent()).trim()!=='مشاهده گزارش عملکرد وظایف')throw Error('Incorrect report shortcut label');
 await page.keyboard.press('Escape');
 if(!await taskSection.evaluate(el=>el===document.activeElement))throw Error('Task shortcut section did not restore focus');
 // Keyboard-only route: Enter opens the section and Escape returns focus.
 await cards.first().focus();
 await page.keyboard.press('Enter');
 await page.locator('#functional-section').waitFor({state:'visible'});
 if(!await page.locator('#functional-heading').evaluate(el=>el===document.activeElement))throw Error('Keyboard opening did not focus section heading');
 if(await cards.first().getAttribute('aria-expanded')!=='true')throw Error('Keyboard opening did not update expanded state');
 await page.keyboard.press('Escape');
 if(!await page.locator('#functional-section').isHidden())throw Error('Keyboard Escape did not close section');
 if(!await cards.first().evaluate(el=>el===document.activeElement))throw Error('Keyboard Escape did not restore focus');
 // Space must activate the same native button, and focus must return on Escape.
 await cards.last().focus();
 await page.keyboard.press('Space');
 await page.locator('#functional-section').waitFor({state:'visible'});
 if(await cards.last().getAttribute('aria-expanded')!=='true')throw Error('Space activation did not expand final section');
 if(await page.locator('#functional-heading').textContent()!=='استودیوی محتوا')throw Error('Space activated the wrong section');
 await page.keyboard.press('Escape');
 if(!await page.locator('#functional-section').isHidden())throw Error('Space-opened section did not close');
 if(await cards.last().getAttribute('aria-expanded')!=='false')throw Error('Space-opened section remains expanded');
 if(!await cards.last().evaluate(el=>el===document.activeElement))throw Error('Space route did not restore focus');
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
 if(overflow)throw Error('Horizontal overflow '+width);
 if(errors.length)throw Error(errors.join('\n'));
 console.log('PASS six sections, routes, keyboard focus and responsive viewport '+width);
 await page.close();
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
