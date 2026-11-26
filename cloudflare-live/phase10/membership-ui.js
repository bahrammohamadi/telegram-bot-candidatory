const membershipPanel=document.getElementById('membership-panel');
const membershipState=document.getElementById('membership-state');
const membershipSummary=document.getElementById('membership-summary');
const membershipRequests=document.getElementById('membership-requests');
const membershipAdmin=document.getElementById('membership-admin');
const membershipQueue=document.getElementById('membership-admin-queue');
async function membershipApi(action,payload={}){
 const response=await fetch('/api/membership',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData,action,...payload})});
 let data;try{data=await response.json()}catch{throw Error('پاسخ سرور قابل خواندن نبود')}
 if(!response.ok)throw Error(data.error||'MEMBERSHIP_ERROR');
 return data;
}
function membershipText(tag,value){const e=document.createElement(tag);e.textContent=String(value);return e}
function membershipList(items,target){
 target.replaceChildren();
 if(!items.length){target.append(membershipText('p','درخواستی برای نمایش وجود ندارد.'));return}
 for(const item of items){
  const card=membershipText('article','');card.className='membership-card';
  card.append(membershipText('strong','درخواست '+item.reference));
  card.append(membershipText('p','وضعیت: '+(item.status==='pending'?'در انتظار بررسی آزمایشی':item.status==='approved'?'تأیید نمایشی':item.status==='rejected'?'رد شده':item.status)));
  card.append(membershipText('small','زمان ثبت: '+item.created_at));
  target.append(card);
 }
}
async function membershipRefresh(){
 membershipState.textContent='در حال دریافت وضعیت اشتراک آزمایشی...';
 try{
  const data=await membershipApi('status');
  const plan=data.plan==='professional'?'حرفه‌ای آزمایشی':'رایگان';
  membershipSummary.replaceChildren();
  membershipSummary.append(membershipText('strong','وضعیت فعلی: '+plan));
  if(data.subscription?.expires_at)membershipSummary.append(membershipText('p','پایان اعتبار ثبت‌شده: '+data.subscription.expires_at));
  membershipSummary.append(membershipText('small','فعال‌سازی حرفه‌ای واقعی، پرداخت و تصویر رسید هنوز پشتیبانی نمی‌شوند.'));
  membershipList(data.requests,membershipRequests);
  membershipAdmin.hidden=!data.is_admin;
  document.getElementById('membership-demo-request').disabled=data.requests.some(x=>x.status==='pending');
  if(data.is_admin)await membershipAdminRefresh();
  membershipState.textContent='وضعیت از پایگاه داده آزمایشی دریافت شد.';
 }catch(e){membershipState.textContent='خطا در دریافت وضعیت: '+e.message}
}
async function membershipAdminRefresh(){
 try{
  const response=await membershipApi('admin_queue');
  membershipQueue.replaceChildren();
  if(!response.requests.length){membershipQueue.append(membershipText('p','درخواست آزمایشی در انتظار بررسی وجود ندارد.'));return}
  for(const item of response.requests){
   const card=membershipText('article','');card.className='membership-card';
   card.append(membershipText('strong','درخواست '+item.reference));
   card.append(membershipText('p','شناسه حساب آزمایشی: '+item.telegram_id));
   card.append(membershipText('small','ثبت: '+item.created_at));
   for(const [decision,label] of [['approved','تأیید نمایشی ۳۰روزه'],['rejected','رد درخواست']]){
    const button=membershipText('button',label);button.type='button';button.className='secondary';
    button.addEventListener('click',async()=>{
     button.disabled=true;
     try{
      await membershipApi('admin_decide',{id:item.id,decision});
      membershipState.textContent=decision==='approved'?'دسترسی نمایشی به ثبت رسید؛ پرداختی دریافت نشده است.':'درخواست نمایشی رد شد.';
      await membershipAdminRefresh();
     }catch(e){membershipState.textContent='تغییر وضعیت ناموفق: '+e.message;button.disabled=false}
    });
    card.append(button);
   }
   membershipQueue.append(card);
  }
 }catch(e){membershipState.textContent='صف ادمین در دسترس نیست: '+e.message}
}
async function openMembership(){
 membershipPanel.hidden=false;
 dashboard.querySelector('.modules').hidden=true;
 await membershipRefresh();
}
document.getElementById('open-membership').addEventListener('click',openMembership);
document.getElementById('membership-refresh').addEventListener('click',membershipRefresh);
document.getElementById('membership-admin-refresh').addEventListener('click',membershipAdminRefresh);
document.getElementById('membership-demo-request').addEventListener('click',async()=>{
 const button=document.getElementById('membership-demo-request');button.disabled=true;
 membershipState.textContent='در حال ایجاد درخواست آزمایشی بدون پرداخت...';
 try{
  const result=await membershipApi('demo_request');
  membershipState.textContent='درخواست نمایشی '+result.reference+' ثبت شد. هنوز هیچ پرداخت یا رسیدی وجود ندارد.';
  await membershipRefresh();
 }catch(e){membershipState.textContent='ثبت درخواست ناموفق: '+e.message;button.disabled=false}
});
document.getElementById('membership-close').addEventListener('click',()=>{
 membershipPanel.hidden=true;dashboard.querySelector('.modules').hidden=false;
 status('بازگشت به میزکار آزمایشی.');
});
