// Practice UI is available only after valid Telegram profile load.
const practicePanel=document.getElementById('practice-panel');
const practiceForm=document.getElementById('practice-form');
const practiceList=document.getElementById('practice-list');
const practiceFeedback=document.getElementById('practice-feedback');
const practiceSummary=document.getElementById('practice-summary');
const practiceClock=document.getElementById('practice-clock');
const prompts={
 speech_clear:'در ۹۰ ثانیه مسئله روشنایی یک خیابان را با سه بخشِ شرح مسئله، اطلاعات قابل بررسی و راهکار اجرایی توضیح بده.',
 speech_evidence:'پیشرفت یک پروژه عمومی را به زبان روشن گزارش کن؛ منبع هر عدد را مشخص کن و از آمار ساختگی خودداری کن.',
 qa_unknown:'اگر درباره جزئیات بودجه اطلاعات کافی نداری، چگونه شفاف توضیح می‌دهی که چه چیزی را نمی‌دانی و چگونه بررسی می‌کنی؟',
 qa_followup:'اگر شهروندی از تأخیر رسیدگی شکایت دارد، مسیر ثبت، پیگیری و پاسخگویی را چگونه روشن بیان می‌کنی؟'
};
document.getElementById('practice-exercise').addEventListener('change',e=>{
 document.getElementById('practice-prompt').textContent=prompts[e.target.value]||'';
});
document.getElementById('practice-exercise').dispatchEvent(new Event('change'));
let practiceStarted=null,practiceTimer=null,practiceSeconds=0;
function practiceShowTime(){const m=String(Math.floor(practiceSeconds/60)).padStart(2,'0'),s=String(practiceSeconds%60).padStart(2,'0');practiceClock.textContent=m+':'+s;practiceForm.elements.duration_seconds.value=String(practiceSeconds)}
function practiceStop(){
 if(practiceStarted!==null)practiceSeconds=Math.min(900,Math.floor((Date.now()-practiceStarted)/1000));
 practiceStarted=null;if(practiceTimer!==null)clearInterval(practiceTimer);practiceTimer=null;practiceShowTime();
}
document.getElementById('practice-start').addEventListener('click',()=>{
 practiceStop();practiceSeconds=0;practiceStarted=Date.now();
 practiceTimer=setInterval(()=>{practiceSeconds=Math.min(900,Math.floor((Date.now()-practiceStarted)/1000));practiceShowTime();if(practiceSeconds===900)practiceStop()},1000);
 practiceShowTime();
});
document.getElementById('practice-stop').addEventListener('click',practiceStop);
async function practiceApi(action,payload={}){
 const r=await fetch('/api/practice',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData,action,...payload})});
 let data;try{data=await r.json()}catch{throw Error('پاسخ سرور معتبر نیست')}
 if(!r.ok)throw Error(data.error||'PRACTICE_ERROR');return data;
}
function practiceRender(items){
 practiceList.replaceChildren();
 const count=items.length,total=items.reduce((sum,x)=>sum+x.self_score,0);
 practiceSummary.textContent='تعداد تمرین‌های ثبت‌شده: '+count+' | میانگین ارزیابی شخصی: '+(count?(total/count).toFixed(1):'—')+' از ۵ (حداکثر ۱۰۰ تمرین آخر نمایش داده می‌شود)';
 if(!count){const p=document.createElement('p');p.textContent='هنوز تمرینی ثبت نکرده‌اید.';practiceList.append(p);return}
 for(const item of items){
  const card=document.createElement('article');card.setAttribute('role','listitem');card.style.cssText='border:1px solid #96a3b2;border-radius:12px;padding:12px;margin:10px 0';
  const title=document.createElement('strong');title.textContent=(item.kind==='speech'?'سخنرانی':'پرسش‌وپاسخ')+' — '+(document.querySelector('#practice-exercise option[value="'+item.exercise_key+'"]')?.textContent||item.exercise_key);
  const info=document.createElement('p');info.textContent='امتیاز شخصی '+item.self_score+' از ۵ | زمان '+item.duration_seconds+' ثانیه | '+item.created_at;
  const response=document.createElement('p');response.textContent=item.response_text||'بدون متن پاسخ';
  const reflection=document.createElement('p');reflection.textContent='بازنگری: '+(item.reflection||'—');
  const del=document.createElement('button');del.type='button';del.textContent='حذف این تمرین';del.className='secondary';
  del.addEventListener('click',async()=>{
   del.disabled=true;try{await practiceApi('delete',{id:item.id});await practiceRefresh()}
   catch(e){practiceFeedback.textContent='حذف ناموفق: '+e.message;del.disabled=false}
  });
  card.append(title,info,response,reflection,del);practiceList.append(card);
 }
}
async function practiceRefresh(){
 practiceFeedback.textContent='در حال دریافت تمرین‌ها...';
 try{const result=await practiceApi('list');practiceRender(result.sessions);practiceFeedback.textContent='سوابق تمرین بارگذاری شد.'}
 catch(e){practiceFeedback.textContent='بازیابی ناموفق: '+e.message}
}
async function openPractice(){
 practicePanel.hidden=false;dashboard.querySelector('.modules').hidden=true;
 await practiceRefresh();
}
practiceForm.addEventListener('submit',async e=>{
 e.preventDefault();practiceStop();
 const button=document.getElementById('practice-save');button.disabled=true;
 const values=Object.fromEntries(new FormData(practiceForm));
 const data={exercise_key:values.exercise_key,response_text:values.response_text,reflection:values.reflection,self_score:Number(values.self_score),duration_seconds:Number(values.duration_seconds)};
 try{
  await practiceApi('create',data);
  practiceFeedback.textContent='تمرین در پایگاه داده آزمایشی ذخیره شد.';
  practiceForm.elements.response_text.value='';practiceForm.elements.reflection.value='';
  practiceSeconds=0;practiceShowTime();await practiceRefresh();
 }catch(e){practiceFeedback.textContent='ثبت ناموفق: '+e.message}
 finally{button.disabled=false}
});
document.getElementById('practice-close').addEventListener('click',()=>{
 practiceStop();practicePanel.hidden=true;dashboard.querySelector('.modules').hidden=false;
 status('بازگشت به میزکار آزمایشی.');
});
