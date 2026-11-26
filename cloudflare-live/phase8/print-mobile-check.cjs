const {chromium}=require('playwright');
const {readFileSync,mkdirSync,statSync}=require('node:fs');
const {join}=require('node:path');
const assert=require('node:assert/strict');

(async()=>{
const script=readFileSync(__dirname+'/dist/integration-print-worker.mjs','utf8');
const marker='const TEST_PAGE=',start=script.indexOf(marker)+marker.length;
if(start<marker.length)throw Error('Embedded HTML missing');
const html=process.env.PRINT_HTML_FILE?readFileSync(process.env.PRINT_HTML_FILE,'utf8'):JSON.parse(script.slice(start,script.indexOf(';\n',start)));
const browser=await chromium.launch();
const out=join(__dirname,'dist','pdf-smoke');mkdirSync(out,{recursive:true});
try{
for(const width of [320,375,430]){
const context=await browser.newContext({viewport:{width,height:860},acceptDownloads:true});
const page=await context.newPage(),errors=[];
page.on('pageerror',error=>errors.push(error.message));
await page.addInitScript(()=>{
 window.Telegram={WebApp:{initData:'VERY_PRIVATE_SYNTHETIC_INIT_DATA_FOR_TESTING_ONLY',ready(){}}};
 window.print=()=>{window.__printRequested=true};
});
await page.route('**/*',route=>{
 const req=route.request(),url=new URL(req.url());
 if(url.hostname==='telegram.org')return route.fulfill({contentType:'application/javascript',body:''});
 if(url.pathname==='/api/profile')return route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,profile:{election_type:'council',district:'Not a real location',stage:'planning',professional_summary:''},details:{}})});
 if(url.pathname==='/api/goals')return route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,goals:[]})});
 if(url.pathname==='/api/progress'){
 const obj={ok:true,scope:'authenticated_test_account',generated_at:'2026-11-02T08:00:00Z',
 profile:{completed:true},goals:{total:3,completed:2,overdue:1},calendar:{total:5,completed:4,scheduled:1},
 practice:{total:6,speech:4,qa:2,duration_seconds:805,self_rating:3.8},
 quizzes:{attempts:5,unique_quizzes:2,available_quizzes:2,correct_answers:17,answered_questions:25,correct_percentage:68}};
 return route.fulfill({contentType:'application/json',body:JSON.stringify(obj)});
 }
 return route.fulfill({contentType:'text/html',body:html});
});
await page.goto('https://synthetic.print.test/');
await page.locator('#form').waitFor({state:'visible'});
await page.locator('#save').click();
await page.locator('#review').waitFor({state:'visible'});
await page.locator('#go-dashboard').click();
await page.locator('[data-module="گزارش عملکرد"]').click();
await page.locator('#open-progress').click();
await page.locator('#progress-panel').waitFor({state:'visible'});
await page.locator('#progress-print-button').click();
const printCalled=await page.evaluate(()=>window.__printRequested===true);
assert.equal(printCalled,true,'Print button did not invoke print');
assert.equal(await page.locator('#progress-print .print-card').count(),8);
assert.match(await page.locator('#progress-print').innerText(),/گزارش پیشرفت آموزشی کاندیداتوری/);
assert.match(await page.locator('#progress-print').innerText(),/68٪/);
const snapshot=await page.locator('#progress-print').innerHTML();
assert.ok(!snapshot.includes('VERY_PRIVATE_SYNTHETIC_INIT_DATA_FOR_TESTING_ONLY'),'Telegram initData must not leak to printed document');
assert.ok(!snapshot.includes('9100030101'),'Telegram id must not leak');
await page.emulateMedia({media:'print'});
const visibility=await page.evaluate(()=>{
 const root=document.getElementById('progress-print'),page=root?.querySelector('.print-page');
 if(!root||!page)return {visible:false,width:0,height:0};
 const computed=getComputedStyle(root),rect=page.getBoundingClientRect();
 return {visible:computed.display!=='none'&&computed.visibility==='visible',width:rect.width,height:rect.height};
});
assert.equal(visibility.visible,true,'Printed report must be visible in print media');
assert.ok(visibility.width>200&&visibility.height>200,'Printed report content has no page area');
const pdfPath=join(out,'progress-'+width+'.pdf');
await page.pdf({path:pdfPath,format:'A4',printBackground:true});
assert.ok(statSync(pdfPath).size>4000,'PDF appears empty');
await page.emulateMedia({media:'screen'});
const downloadPromise=page.waitForEvent('download');
await page.locator('#progress-download-html').click();
const download=await downloadPromise;
assert.equal(download.suggestedFilename(),'candidatory-progress-report.html');
const filePath=join(out,'progress-'+width+'.html');await download.saveAs(filePath);
const file=readFileSync(filePath,'utf8');
assert.ok(file.includes('dir="rtl"')&&file.includes('گزارش پیشرفت آموزشی کاندیداتوری'));
assert.ok(!file.includes('VERY_PRIVATE_SYNTHETIC_INIT_DATA_FOR_TESTING_ONLY'),'initData leaked to offline file');
assert.ok(!file.includes('/api/progress'),'offline file must not fetch private API');
assert.ok(!file.includes('telegram_id'),'user ID leaked to offline file');
assert.ok(!file.includes('<script'),'offline report must not execute scripts');
const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
assert.equal(overflow,false,'Mobile overflow at '+width);
assert.deepEqual(errors,[],'Javascript errors');
console.log('PASS: print action, valid RTL A4 PDF, private offline HTML and viewport '+width+'px');
await context.close();
}
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
