// Create a private print-ready snapshot from the already authenticated report response.
// No signed initData, Telegram user ID, private profile fields or network requests are included.
const reportPrintRoot=document.getElementById('progress-print');
const reportPrintCss="@PRINT_CSS@";
function reportPrintElement(tag,content,className){
  const element=document.createElement(tag);
  if(content!==undefined)element.textContent=String(content);
  if(className)element.className=className;
  return element;
}
function reportPrintCard(parent,name,value,detail){
  const card=reportPrintElement('section',undefined,'print-card');
  card.append(reportPrintElement('h2',name),reportPrintElement('span',value,'print-value'),reportPrintElement('p',detail));
  parent.append(card);
}
function reportBuildPrint(data){
  reportPrintRoot.replaceChildren();
  const container=reportPrintElement('article',undefined,'print-page');
  const header=reportPrintElement('header',undefined,'print-header');
  header.append(reportPrintElement('h1','گزارش پیشرفت آموزشی کاندیداتوری'));
  header.append(reportPrintElement('p','گزارش شخصی فعالیت‌های ثبت‌شده در نسخه آزمایشی؛ بدون اطلاعات هویتی و بدون شماره حساب تلگرام.'));
  let dt;try{dt=new Intl.DateTimeFormat('fa-IR',{dateStyle:'long',timeStyle:'short'}).format(new Date(data.generated_at))}catch{dt='تاریخ نامشخص'}
  header.append(reportPrintElement('p','تاریخ تهیه گزارش: '+dt));
  container.append(header);
  const grid=reportPrintElement('section',undefined,'print-grid'),g=data.goals,c=data.calendar,p=data.practice,q=data.quizzes;
  reportPrintCard(grid,'پرونده',data.profile.completed?'تکمیل‌شده':'تکمیل‌نشده','وضعیت ثبت اطلاعات پایه');
  reportPrintCard(grid,'اهداف',g.completed+' از '+g.total,g.overdue+' هدف باز دارای مهلت گذشته');
  reportPrintCard(grid,'رویدادها',c.completed+' از '+c.total,c.scheduled+' رویداد برنامه‌ریزی‌شده');
  reportPrintCard(grid,'تمرین‌ها',p.total+' مورد',p.speech+' سخنرانی و '+p.qa+' پرسش‌وپاسخ');
  reportPrintCard(grid,'زمان تمرین',Math.round(p.duration_seconds/60)+' دقیقه','مدت جمع‌شده از زمان‌سنج‌های ثبت‌شده، با گرد کردن به دقیقه');
  reportPrintCard(grid,'ارزیابی شخصی',p.self_rating===null?'بدون داده':p.self_rating+' از ۵','امتیاز خوداظهاری؛ نه سنجش صوتی یا هوش مصنوعی');
  reportPrintCard(grid,'نوبت‌های آزمون',q.attempts+' نوبت',q.unique_quizzes+' آزمون متفاوت از '+q.available_quizzes+' آزمون منتشرشده');
  reportPrintCard(grid,'دقت پاسخ‌ها',q.correct_percentage===null?'بدون داده':q.correct_percentage+'٪',q.correct_answers+' پاسخ صحیح از '+q.answered_questions+' پاسخ ثبت‌شده در تمام نوبت‌ها');
  container.append(grid);
  const method=reportPrintElement('section',undefined,'print-section');
  method.append(reportPrintElement('h2','روش محاسبه و محدودیت‌ها'));
  method.append(reportPrintElement('p','آمار اهداف و جلسات با شمارش رکوردهای ذخیره‌شده محاسبه می‌شود. مقدار پیشرفت نشان‌دهنده وضعیت ثبت‌شده توسط خود کاربر است.'));
  method.append(reportPrintElement('p','درصد پاسخ‌های صحیح، نسبت مجموع پاسخ‌های صحیح به کل پاسخ‌های ثبت‌شده در تمام نوبت‌های آزمون است؛ این گزارش برآورد صلاحیت حرفه‌ای یا انتخاباتی نیست.'));
  method.append(reportPrintElement('p','میانگین ارزیابی تمرین‌ها خوداظهاری است و هیچ تحلیل خودکار صدا، شخصیت یا عملکرد انتخاباتی انجام نشده است.'));
  container.append(method);
  const footer=reportPrintElement('footer','CANDIDATORY — گزارش آموزشی آزمایشی | داده‌ها فقط در همین دستگاه قالب‌بندی شده‌اند و این خروجی به سرور جدیدی ارسال نمی‌شود.','print-footer');
  container.append(footer);
  reportPrintRoot.append(container);
}
function reportPrintDoc(){
  const cloned=reportPrintRoot.cloneNode(true);cloned.hidden=false;
  return '<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>گزارش پیشرفت کاندیداتوری</title><style>'+reportPrintCss+'body{font-family:Tahoma,Arial,sans-serif;direction:rtl;background:#f4f6f8;color:#182c35;margin:0;padding:24px}.progress-print{max-width:820px;margin:auto;padding:20px;background:#fff;border:1px solid #d2dce2;border-radius:12px}@media print{body{margin:0;padding:0}.progress-print{border:none;max-width:none;padding:0}}</style></head><body>'+cloned.outerHTML+'</body></html>';
}
async function reportRequireData(){
  if(!progressLast)await progressRefresh();
  if(!progressLast){progressState.textContent='گزارش هنوز دریافت نشده؛ ابتدا اتصال به سرور را بررسی کنید.';return false}
  reportBuildPrint(progressLast);
  return true;
}
function reportAfterPrint(){reportPrintRoot.hidden=true}
window.addEventListener('afterprint',reportAfterPrint);
document.getElementById('progress-print-button').addEventListener('click',async()=>{
  if(!await reportRequireData())return;
  reportPrintRoot.hidden=false;
  progressState.textContent='در پنجره چاپ، «Save as PDF / ذخیره به‌صورت PDF» را انتخاب کنید. در صورت نبود این گزینه در تلگرام، نسخه HTML قابل چاپ را دریافت کنید.';
  if(typeof window.print!=='function'){progressState.textContent='چاپ در این مرورگر پشتیبانی نمی‌شود؛ نسخه HTML قابل چاپ را دریافت کنید.';return}
  try{window.print()}catch{progressState.textContent='چاپ در این محیط اجرا نشد؛ نسخه HTML قابل چاپ را دریافت کنید.'}
});
document.getElementById('progress-download-html').addEventListener('click',async()=>{
  if(!await reportRequireData())return;
  const html=reportPrintDoc();
  const blob=new Blob([html],{type:'text/html;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='candidatory-progress-report.html';a.style.display='none';document.body.append(a);
  try{a.click();progressState.textContent='نسخه HTML قابل چاپ روی دستگاه آماده دریافت شد. آن را در مرورگر باز کرده و Print → Save as PDF را انتخاب کنید.'}
  finally{a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000)}
});
