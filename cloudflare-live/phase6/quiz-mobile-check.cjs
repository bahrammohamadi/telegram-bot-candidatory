const {chromium}=require('playwright');
const fs=require('node:fs');
(async()=>{
const worker=fs.readFileSync(__dirname+'/dist/integration-quiz-worker.mjs','utf8');
const marker='const TEST_PAGE=',start=worker.indexOf(marker)+marker.length;
const html=process.env.QUIZ_HTML_FILE?fs.readFileSync(process.env.QUIZ_HTML_FILE,'utf8'):JSON.parse(worker.slice(start,worker.indexOf(';\n',start)));
const browser=await chromium.launch();
try{
for(const width of [320,375,430]){
const page=await browser.newPage({viewport:{width,height:800}});
const attempts=[],errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.Telegram={WebApp:{initData:'synthetic-only',ready(){}}}});
await page.route('**/*',route=>{
const req=route.request(),u=new URL(req.url());
if(u.hostname==='telegram.org')return route.fulfill({contentType:'application/javascript',body:''});
if(u.pathname==='/api/profile')return route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,profile:{election_type:'council',stage:'planning',district:'Test',professional_summary:''},details:{}})});
if(u.pathname==='/api/practice')return route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,sessions:[]})});
if(u.pathname==='/api/quiz'){
const b=JSON.parse(req.postData()||'{}');
const q={id:91001,title:'آزمون آزمایشی',description:'',question_count:2};
const questions=[{id:11,prompt:'سؤال اول',options:['الف','ب','ج','د'],position:1},{id:12,prompt:'سؤال دوم',options:['الف','ب','ج','د'],position:2}];
let answer={ok:true};
if(b.action==='catalog')answer={ok:true,quizzes:[q]};
if(b.action==='history')answer={ok:true,attempts:attempts.map(a=>({attempt_id:a.attempt_id,quiz_id:91001,title:q.title,score:a.score,question_count:2,submitted_at:'2026-11-02'}))};
if(b.action==='start')answer={ok:true,quiz:q,questions};
if(b.action==='submit'){
const feedback=questions.map(v=>({question_id:v.id,prompt:v.prompt,correct_index:1,selected_index:b.answers[v.id],is_correct:b.answers[v.id]===1,correct_answer:'ب',rationale:'توضیح آموزشی',source_url:'https://www.unesco.org/en/ami'}));
const attempt={attempt_id:'00000000-0000-4000-8000-000000000001',score:feedback.filter(x=>x.is_correct).length,feedback};
attempts.push(attempt);answer={ok:true,...attempt,question_count:2};
}
if(b.action==='review')answer={ok:true,...attempts[0],question_count:2};
return route.fulfill({contentType:'application/json',body:JSON.stringify(answer)});
}
return route.fulfill({contentType:'text/html',body:html});
});
await page.goto('https://synthetic.test/');
await page.locator('#form').waitFor({state:'visible'});
await page.locator('#save').click();
await page.locator('#go-dashboard').click();
await page.locator('[data-module="تمرین و آمادگی"]').click();
await page.locator('#open-quiz').click();
await page.locator('#quiz-catalog button').first().click();
await page.locator('#quiz-form').waitFor({state:'visible'});
if(await page.locator('#quiz-feedback').innerText())throw Error('Answer leaked before grading');
await page.locator('input[name="quiz-question-11"][value="1"]').check();
await page.locator('input[name="quiz-question-12"][value="1"]').check();
await page.locator('#quiz-submit').click();
await page.locator('#quiz-result').waitFor({state:'visible'});
if(await page.locator('#quiz-feedback article').count()!==2)throw Error('Feedback missing');
await page.locator('#quiz-result-close').click();
await page.locator('#quiz-history button').first().click();
await page.locator('#quiz-result').waitFor({state:'visible'});
await page.locator('#quiz-close').click();
await page.locator('#practice-panel').waitFor({state:'visible'});
if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2))throw Error('Horizontal overflow');
if(errors.length)throw Error(errors.join('; '));
console.log('PASS quiz flow '+width+'px');
await page.close();
}
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
