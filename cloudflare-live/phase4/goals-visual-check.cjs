const {chromium}=require('playwright');
const fs=require('node:fs');
(async()=>{
const src=fs.readFileSync(__dirname+'/dist/integration-goals-worker.mjs','utf8');
const marker='const TEST_PAGE=',begin=src.indexOf(marker)+marker.length;
if(begin<marker.length)throw Error('HTML bundle missing');
const html=JSON.parse(src.slice(begin,src.indexOf(';\n',begin)));
const browser=await chromium.launch();
try{for(const width of [320,375,430]){
const page=await browser.newPage({viewport:{width,height:800}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',route=>{
const request=route.request(),url=new URL(request.url());
if(url.hostname==='telegram.org')return route.abort();
if(url.pathname==='/api/profile')return route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,profile:{election_type:'council',stage:'planning',district:'Synthetic',professional_summary:''},details:{}})});
if(url.pathname==='/api/goals')return route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,goals:[]})});
if(url.pathname==='/api/calendar')return route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,events:[]})});
return route.fulfill({contentType:'text/html',body:html});
});
await page.addInitScript(()=>{window.Telegram={WebApp:{initData:'synthetic_test_not_real',ready(){}}}});
await page.goto('https://integration.test/');
await page.locator('#form').waitFor({state:'visible'});
await page.locator('[name="district"]').fill('Synthetic');
await page.locator('#save').click();
await page.locator('#review').waitFor({state:'visible'});
await page.locator('#go-dashboard').click();
await page.locator('#dashboard').waitFor({state:'visible'});
await page.locator('[data-module="گزارش عملکرد"]').click();
await page.locator('#goals-panel').waitFor({state:'visible'});
if(!await page.locator('#goals-form').isVisible())throw Error('Goals form missing');
if(await page.locator('.modules').isVisible())throw Error('Dashboard buttons should be hidden inside goals');
await page.locator('#goals-close').click();
if(await page.locator('#goals-panel').isVisible())throw Error('Goal panel did not close');
if(errors.length)throw Error(errors.join('; '));
const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
if(overflow)throw Error('Horizontal overflow at '+width);
console.log('PASS goals route and 3-stage wizard at '+width);
await page.close();
}}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
