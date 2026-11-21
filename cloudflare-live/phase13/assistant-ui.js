const assistantPanel=document.getElementById('assistant-panel');
const assistantStatus=document.getElementById('assistant-status');
const assistantState=document.getElementById('assistant-ai-state');
const assistantResult=document.getElementById('assistant-result');
const assistantText=document.getElementById('assistant-result-text');
const assistantForm=document.getElementById('assistant-form');
let assistantBusy=false;
async function assistantApi(action,data={}){
 const response=await fetch('/api/assistant',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData,action,...data})});
 let payload;try{payload=await response.json()}catch{throw Error('پاسخ سرور معتبر نیست')}
 if(!response.ok)throw Error(payload.message||payload.error||'ASSISTANT_ERROR');return payload;
}
async function assistantRefresh(){
 assistantState.textContent='در حال بررسی وضعیت راهنما و مدل...';
 try{
  const result=await assistantApi('status');
  const active=result.ai_available===true;
  const button=document.getElementById('assistant-ask');
  button.disabled=!active;button.textContent=active?'درخواست پاسخ از مدل AI':'مدل AI فعلاً فعال نیست';
  assistantState.textContent=active
   ?'مدل فعال است. سهمیه امروز: '+result.used_today+' استفاده از '+result.daily_user_limit+' | باقیمانده: '+result.remaining_today+'.'
   :'راهنمای بدون مدل در دسترس است. اتصال AI برای جلوگیری از هزینه ناخواسته هنوز فعال نشده و هیچ پیام یا هزینه‌ای برای آن ثبت نمی‌شود.';
 }catch(e){assistantState.textContent='بررسی وضعیت مدل ناموفق: '+e.message;document.getElementById('assistant-ask').disabled=true}
}
function assistantShow(title,lines){
 document.getElementById('assistant-result-title').textContent=title;
 assistantText.replaceChildren();
 for(const line of lines){
  const p=document.createElement('p');p.textContent=line;assistantText.append(p);
 }
 assistantResult.hidden=false;
}
document.getElementById('assistant-guide').addEventListener('click',async()=>{
 if(assistantBusy)return;assistantBusy=true;
 const btn=document.getElementById('assistant-guide');btn.disabled=true;
 assistantStatus.textContent='در حال آماده‌سازی چک‌لیست آموزشی...';
 try{
  const result=await assistantApi('guide',{task:assistantForm.elements.task.value,topic:assistantForm.elements.topic.value});
  const lines=[...(result.topic?['موضوع: '+result.topic]:[]),...result.steps.map((s,i)=>(i+1)+'. '+s),result.source_note];
  assistantShow(result.title+' — راهنمای بدون مدل AI',lines);
  assistantStatus.textContent='چک‌لیست بدون مصرف API آماده شد.';
 }catch(e){assistantStatus.textContent='تهیه راهنما ناموفق: '+e.message}
 finally{assistantBusy=false;btn.disabled=false}
});
document.getElementById('assistant-ask').addEventListener('click',async()=>{
 if(assistantBusy)return;assistantBusy=true;
 const button=document.getElementById('assistant-ask');button.disabled=true;
 assistantStatus.textContent='در حال پردازش پرسش عمومی...';
 try{
  const result=await assistantApi('ask',{task:assistantForm.elements.task.value,question:assistantForm.elements.question.value});
  assistantShow('پاسخ مدل AI — نیازمند بازبینی',[result.answer,result.caveat]);
  assistantStatus.textContent='پاسخ مدل دریافت شد. پیش از استفاده، مطالب را بررسی کن.';
  await assistantRefresh();
 }catch(e){assistantStatus.textContent='پاسخ مدل در دسترس نیست: '+e.message}
 finally{assistantBusy=false;await assistantRefresh()}
});
document.getElementById('assistant-copy').addEventListener('click',async()=>{
 const content=[...assistantText.querySelectorAll('p')].map(p=>p.textContent).join('\n');
 if(!content)return;
 try{await navigator.clipboard.writeText(content);assistantStatus.textContent='پاسخ کپی شد.'}
 catch{assistantStatus.textContent='امکان کپی مستقیم نبود؛ متن پاسخ را انتخاب کن.'}
});
async function openAssistant(){
 assistantPanel.hidden=false;dashboard.querySelector('.modules').hidden=true;
 await assistantRefresh();
}
document.getElementById('assistant-close').addEventListener('click',()=>{
 assistantPanel.hidden=true;dashboard.querySelector('.modules').hidden=false;status('بازگشت به میزکار آموزشی.');
});
