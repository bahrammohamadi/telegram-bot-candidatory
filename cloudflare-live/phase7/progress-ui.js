// User-owned, read-only progress dashboard. Never imply the self-rating is AI generated.
const progressPanel=document.getElementById('progress-panel');
const progressCards=document.getElementById('progress-cards');
const progressCharts=document.getElementById('progress-charts');
const progressState=document.getElementById('progress-state');
const progressExport=document.getElementById('progress-export');
const progressFormat=(n,unit='')=>new Intl.NumberFormat('fa-IR',{maximumFractionDigits:1}).format(n)+(unit?' '+unit:'');
let progressLast=null;
async function progressApi(){
  const response=await fetch('/api/progress',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData,action:'overview'})});
  const data=await response.json();
  if(!response.ok)throw Error(data.error||'PROGRESS_ERROR');
  return data;
}
function progressCard(title,value,note){
  const article=document.createElement('article');article.className='progress-card';
  const name=document.createElement('strong');name.textContent=title;
  const number=document.createElement('div');number.className='progress-number';number.textContent=value;
  const desc=document.createElement('small');desc.textContent=note;
  article.append(name,number,desc);progressCards.append(article);
}
function progressBar(title,current,total,note){
  const wrap=document.createElement('section');wrap.className='progress-bar-card';
  const label=document.createElement('strong');label.textContent=title+' — '+progressFormat(current)+' از '+progressFormat(total);
  const bar=document.createElement('progress');bar.max=Math.max(total,1);bar.value=current;bar.setAttribute('aria-label',title);
  const desc=document.createElement('small');desc.textContent=note;
  wrap.append(label,bar,desc);progressCharts.append(wrap);
}
function progressRender(data){
  progressLast=data;progressCards.replaceChildren();progressCharts.replaceChildren();
  const g=data.goals,c=data.calendar,p=data.practice,q=data.quizzes;
  progressCard('پرونده',data.profile.completed?'تکمیل‌شده':'تکمیل‌نشده','ثبت اطلاعات اولیه');
  progressCard('اهداف',progressFormat(g.completed)+' / '+progressFormat(g.total),progressFormat(g.overdue)+' هدف باز با مهلت گذشته');
  progressCard('تقویم و جلسات',progressFormat(c.completed)+' / '+progressFormat(c.total),progressFormat(c.scheduled)+' رویداد برنامه‌ریزی‌شده');
  progressCard('تمرین‌های ثبت‌شده',progressFormat(p.total),progressFormat(p.speech)+' سخنرانی و '+progressFormat(p.qa)+' پرسش‌وپاسخ');
  progressCard('زمان تمرین',progressFormat(Math.round(p.duration_seconds/60))+' دقیقه','جمع مدت زمان‌سنج‌های ثبت‌شده؛ مقدار تقریبی');
  progressCard('میانگین ارزیابی شخصی',p.self_rating===null?'بدون داده':progressFormat(p.self_rating)+' / ۵','خودارزیابی کاربر، نه تحلیل هوش مصنوعی');
  progressCard('دفعات آزمون',progressFormat(q.attempts),progressFormat(q.unique_quizzes)+' آزمون متفاوت از '+progressFormat(q.available_quizzes)+' آزمون منتشرشده');
  progressCard('پاسخ‌های صحیح',q.correct_percentage===null?'بدون داده':progressFormat(q.correct_percentage)+'٪',progressFormat(q.correct_answers)+' از '+progressFormat(q.answered_questions)+' پاسخ، در تمام نوبت‌ها');
  progressBar('پیشرفت اهداف',g.completed,g.total,g.total?'نسبت اهدافی که انجام‌شده علامت خورده‌اند':'هنوز هدفی ثبت نشده است');
  progressBar('تکمیل رویدادهای تقویم',c.completed,c.total,c.total?'نسبت رویدادهای انجام‌شده به همه رویدادهای ثبت‌شده':'هنوز رویدادی ثبت نشده است');
  progressBar('آزمون‌های متفاوت تکمیل‌شده',q.unique_quizzes,q.available_quizzes,q.available_quizzes?'تعداد آزمون‌های متفاوتی که حداقل یک‌بار ثبت شده‌اند':'آزمون منتشرشده‌ای وجود ندارد');
  progressExport.value=[
    'گزارش پیشرفت حساب آزمایشی کاندیداتوری',
    'زمان تولید (UTC): '+data.generated_at,
    'پرونده: '+(data.profile.completed?'تکمیل‌شده':'تکمیل‌نشده'),
    'اهداف: '+g.completed+' از '+g.total+' انجام‌شده؛ '+g.overdue+' دارای مهلت گذشته',
    'تقویم: '+c.completed+' از '+c.total+' انجام‌شده؛ '+c.scheduled+' برنامه‌ریزی‌شده',
    'تمرین: '+p.total+' مورد (سخنرانی '+p.speech+'، پرسش‌وپاسخ '+p.qa+')',
    'زمان ثبت‌شده تمرین: '+p.duration_seconds+' ثانیه',
    'میانگین خودارزیابی: '+(p.self_rating===null?'بدون داده':p.self_rating+' از ۵'),
    'آزمون: '+q.attempts+' نوبت، '+q.unique_quizzes+' آزمون متفاوت از '+q.available_quizzes+' آزمون منتشرشده',
    'درصد پاسخ صحیح در همه نوبت‌ها: '+(q.correct_percentage===null?'بدون داده':q.correct_percentage+'٪'),
    'این آمار نشانگر فعالیت ثبت‌شده است و صلاحیت یا عملکرد انتخاباتی را ارزیابی نمی‌کند.'
  ].join('\n');
}
async function progressRefresh(){
  progressState.textContent='در حال دریافت اطلاعات واقعی پیشرفت...';
  const btn=document.getElementById('progress-refresh');btn.disabled=true;
  try{const data=await progressApi();progressRender(data);progressState.textContent='گزارش از پایگاه داده آزمایشی به‌روز شد.'}
  catch(e){progressState.textContent='بارگذاری گزارش ناموفق: '+e.message}
  finally{btn.disabled=false}
}
async function openProgress(){
  goalsPanel.hidden=true;progressPanel.hidden=false;await progressRefresh();
}
document.getElementById('progress-refresh').addEventListener('click',progressRefresh);
document.getElementById('progress-close').addEventListener('click',()=>{progressPanel.hidden=true;goalsPanel.hidden=false;status('بازگشت به اهداف و پیگیری عملکرد.')});
document.getElementById('open-progress').addEventListener('click',openProgress);
document.getElementById('progress-copy').addEventListener('click',async()=>{
  if(!progressLast){progressState.textContent='ابتدا گزارش را بارگذاری کنید.';return}
  try{await navigator.clipboard.writeText(progressExport.value);progressState.textContent='خلاصه گزارش کپی شد.'}
  catch{progressExport.focus();progressExport.select();progressState.textContent='خلاصه انتخاب شد؛ از گزینه Copy دستگاه استفاده کنید.'}
});
