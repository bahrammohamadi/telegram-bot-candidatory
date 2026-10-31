const {chromium}=require('playwright');
const fs=require('node:fs');
(async()=>{
 const source=fs.readFileSync(__dirname+'/dist/integration-worker.mjs','utf8');
 const asset=name=>{const marker='const '+name+'=',start=source.indexOf(marker)+marker.length;return JSON.parse(source.slice(start,source.indexOf(';\n',start)))};
 const browser=await chromium.launch({headless:true});
 try{for(const width of [320,375,430]){
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
 await page.locator('.functional-grid').waitFor();
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
 console.log('PASS six sections, routes, keyboard focus and mobile width '+width);
 await page.close();
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
