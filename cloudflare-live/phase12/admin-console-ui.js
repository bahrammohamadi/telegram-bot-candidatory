// Read-only admin console UI. Authorization is enforced server-side for every request.
const adminConsoleRoot=document.getElementById('admin-console-dashboard');
const adminConsoleSummary=document.getElementById('admin-console-summary');
const adminConsoleRequests=document.getElementById('admin-console-requests');
const adminConsoleAudit=document.getElementById('admin-console-audit');
const adminConsoleStatus=document.getElementById('admin-console-status');
const adminConsoleFilter=document.getElementById('admin-console-filter');
let adminConsoleOffset=0,adminConsoleBusy=false;
async function adminConsoleApi(action,fields={}){
 const response=await fetch('/api/admin-console',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData,action,...fields})});
 let result;try{result=await response.json()}catch{throw Error('پاسخ سرور معتبر نبود')}
 if(!response.ok)throw Error(result.error||'ADMIN_CONSOLE_ERROR');return result;
}
function adminNode(tag,s,className){
 const e=document.createElement(tag);if(s!==undefined)e.textContent=String(s);if(className)e.className=className;return e;
}
function adminCard(parent,title,body){
 const article=adminNode('article',undefined,'admin-console-card');
 article.append(adminNode('strong',title),adminNode('p',body));parent.append(article);
}
async function adminConsoleOverview(){
 const result=await adminConsoleApi('overview');
 adminConsoleSummary.replaceChildren();
 const req=result.requests;
 adminCard(adminConsoleSummary,'درخواست‌های نمایشی',req.total+' مورد');
 adminCard(adminConsoleSummary,'در انتظار بررسی',req.pending+' مورد');
 adminCard(adminConsoleSummary,'تأیید نمایشی',req.approved+' مورد');
 adminCard(adminConsoleSummary,'ردشده',req.rejected+' مورد');
 adminCard(adminConsoleSummary,'تصمیم‌های ثبت‌شده',result.decisions_logged+' رویداد در دفتر ممیزی');
 adminCard(adminConsoleSummary,'اشتراک‌های حرفه‌ای آزمایشی',result.demo_professional_accounts+' حساب فعال');
 adminCard(adminConsoleSummary,'حساب‌های تستی',result.test_accounts+' حساب');
 const footer=adminNode('small','هیچ پرداخت واقعی و هیچ آپلود رسیدی فعال نیست.');adminConsoleSummary.append(footer);
}
async function adminConsoleLoadRequests(reset=false){
 if(reset)adminConsoleOffset=0;
 const result=await adminConsoleApi('requests',{status:adminConsoleFilter.value,limit:20,offset:adminConsoleOffset});
 adminConsoleRequests.replaceChildren();
 if(!result.requests.length)adminConsoleRequests.append(adminNode('p','درخواستی در این صفحه وجود ندارد.'));
 for(const item of result.requests){
  const status=item.status==='approved'?'تأیید نمایشی':item.status==='rejected'?'ردشده':'در انتظار بررسی';
  const row=adminNode('article',undefined,'admin-console-card');row.setAttribute('role','listitem');
  row.append(adminNode('strong',item.reference));
  row.append(adminNode('p','شناسه حساب تستی: '+item.telegram_id+' | وضعیت: '+status));
  row.append(adminNode('small','زمان ثبت: '+item.created_at+(item.reviewed_at?' | بررسی: '+item.reviewed_at:'')));
  if(item.admin_id)row.append(adminNode('small','شناسه مدیر بررسی‌کننده: '+item.admin_id));
  adminConsoleRequests.append(row);
 }
 const next=document.getElementById('admin-console-next');
 next.disabled=result.requests.length<20||adminConsoleOffset>=500;
 adminConsoleStatus.textContent='صفحه '+(Math.floor(adminConsoleOffset/20)+1)+' از فهرست آزمایشی بارگذاری شد.';
}
async function adminConsoleLoadAudit(){
 const [result,diagnostic]=await Promise.all([adminConsoleApi('audit',{limit:30}),adminConsoleApi('verify')]);
 adminConsoleAudit.replaceChildren();
 if(!result.entries.length)adminConsoleAudit.append(adminNode('p','هنوز تصمیمی در دفتر ممیزی ثبت نشده است.'));
 for(const item of result.entries){
  const action=item.action==='demo_approve'?'تأیید نمایشی':'رد درخواست';
  const card=adminNode('article',undefined,'admin-console-card');card.setAttribute('role','listitem');
  card.append(adminNode('strong',action));
  card.append(adminNode('p','شناسه درخواست: '+item.record_id+' | شناسه مدیر: '+item.actor_id));
  card.append(adminNode('small','زمان: '+item.created_at));
  adminConsoleAudit.append(card);
 }
 document.getElementById('admin-console-diagnostic').textContent=diagnostic.reviewed_without_audit===0
 ?'بازبینی دفتر ممیزی: برای تمام تصمیم‌های نمایشی ثبت‌شده، سابقه وجود دارد.'
 :'نیازمند بررسی: '+diagnostic.reviewed_without_audit+' درخواست بررسی‌شده فاقد رکورد ممیزی است. هیچ اصلاح خودکاری انجام نشد.';
}
async function adminConsoleRefresh(){
 if(adminConsoleBusy)return;
 adminConsoleBusy=true;adminConsoleStatus.textContent='در حال بارگذاری آمار و سوابق مدیریتی...';
 document.getElementById('admin-console-refresh').disabled=true;
 try{
  await adminConsoleOverview();
  await Promise.all([adminConsoleLoadRequests(true),adminConsoleLoadAudit()]);
  adminConsoleStatus.textContent='نمای کلی، فهرست درخواست‌ها و دفتر ممیزی به‌روز شدند.';
 }catch(error){adminConsoleStatus.textContent='خطای مدیریت آزمایشی: '+error.message}
 finally{adminConsoleBusy=false;document.getElementById('admin-console-refresh').disabled=false}
}
adminConsoleFilter.addEventListener('change',async()=>{
 try{await adminConsoleLoadRequests(true)}catch(e){adminConsoleStatus.textContent='دریافت فهرست ناموفق: '+e.message}
});
document.getElementById('admin-console-refresh').addEventListener('click',adminConsoleRefresh);
document.getElementById('admin-console-audit-refresh').addEventListener('click',async()=>{
 try{await adminConsoleLoadAudit();adminConsoleStatus.textContent='سوابق و یکپارچگی دفتر ممیزی بررسی شدند.'}
 catch(e){adminConsoleStatus.textContent='خطای دفتر ممیزی: '+e.message}
});
document.getElementById('admin-console-next').addEventListener('click',async()=>{
 adminConsoleOffset+=20;
 try{await adminConsoleLoadRequests()}catch(e){adminConsoleOffset-=20;adminConsoleStatus.textContent='خطای صفحه بعدی: '+e.message}
});
