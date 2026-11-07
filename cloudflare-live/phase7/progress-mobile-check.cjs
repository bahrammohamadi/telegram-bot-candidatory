const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
  const src=fs.readFileSync(__dirname+'/dist/integration-progress-worker.mjs','utf8');
  const marker='const TEST_PAGE=',start=src.indexOf(marker)+marker.length;
  const html=process.env.PROGRESS_HTML_FILE?fs.readFileSync(process.env.PROGRESS_HTML_FILE,'utf8'):JSON.parse(src.slice(start,src.indexOf(';\n',start)));
  const browser=await chromium.launch();
  try{
    for(const width of [320,375,430]){
      const page=await browser.newPage({viewport:{width,height:800}});
      const errors=[];let reportReads=0;
      page.on('pageerror',e=>errors.push(e.message));
      await page.addInitScript(()=>{window.Telegram={WebApp:{initData:'synthetic_browser_only',ready(){}}}});
      await page.route('**/*',route=>{
        const req=route.request(),path=new URL(req.url()).pathname;
        if(new URL(req.url()).hostname==='telegram.org')return route.fulfill({contentType:'application/javascript',body:''});
        if(path==='/api/profile')return route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,profile:{election_type:'council',district:'Synthetic district',stage:'planning',professional_summary:''},details:{}})});
        if(path==='/api/goals')return route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,goals:[]})});
        if(path==='/api/progress'){
          reportReads++;
          const report={ok:true,scope:'authenticated_test_account',generated_at:'2026-11-02T10:00:00.000Z',
            profile:{completed:true},goals:{total:3,completed:2,overdue:1},calendar:{total:5,completed:4,scheduled:1},
            practice:{total:3,speech:2,qa:1,duration_seconds:250,self_rating:4.3},
            quizzes:{attempts:4,unique_quizzes:2,available_quizzes:2,correct_answers:15,answered_questions:20,correct_percentage:75}};
          return route.fulfill({contentType:'application/json',body:JSON.stringify(report)});
        }
        return route.fulfill({contentType:'text/html',body:html});
      });
      await page.goto('https://synthetic.test/');
      await page.locator('#form').waitFor({state:'visible'});
      await page.locator('#save').click();
      await page.locator('#review').waitFor({state:'visible'});
      await page.locator('#go-dashboard').click();
      await page.locator('#dashboard').waitFor({state:'visible'});
      await page.locator('[data-module="گزارش عملکرد"]').click();
      await page.locator('#goals-panel').waitFor({state:'visible'});
      await page.locator('#open-progress').click();
      await page.locator('#progress-panel').waitFor({state:'visible'});
      assert.equal(await page.locator('#progress-cards article').count(),8);
      assert.equal(await page.locator('#progress-charts progress').count(),3);
      assert.match(await page.locator('#progress-export').inputValue(),/اهداف: 2 از 3/);
      assert.match(await page.locator('#progress-export').inputValue(),/درصد پاسخ صحیح در همه نوبت‌ها: 75٪/);
      assert.equal(await page.locator('#progress-export').getAttribute('readonly'),'');
      await page.locator('#progress-refresh').click();
      assert.equal(reportReads,2,'refresh must request new data');
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);
      assert.equal(overflow,false,'horizontal overflow at '+width);
      await page.locator('#progress-close').click();
      await page.locator('#goals-panel').waitFor({state:'visible'});
      assert.equal(await page.locator('#progress-panel').isVisible(),false);
      await page.locator('#goals-close').click();
      assert.equal(await page.locator('.modules').isVisible(),true);
      assert.deepEqual(errors,[],'no browser JS errors');
      console.log('PASS progress: 8 cards, 3 bars, private metrics, refresh, navigation, no overflow at '+width+'px');
      await page.close();
    }
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
