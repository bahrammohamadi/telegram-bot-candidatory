const webapp=window.Telegram?.WebApp;webapp?.ready();webapp?.expand();const initData=webapp?.initData||'';const $=id=>document.getElementById(id);let state=null;
const message=t=>{$('message').textContent=t};
async function api(path,options={}){if(!initData)throw Error('برای ورود، برنامه را از داخل تلگرام باز کنید.');const r=await fetch('/api/'+path,{...options,headers:{'content-type':'application/json','X-Telegram-Init-Data':initData,...options.headers}});const result=await r.json();if(!r.ok)throw Error(result.error||'ارتباط ناموفق بود');return result;}
function switchTab(name){document.querySelectorAll('.tabs button').forEach(b=>b.setAttribute('aria-current',b.dataset.tab===name?'page':'false'));document.querySelectorAll('.panel').forEach(e=>e.classList.toggle('active',e.id===name));}
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));
function render(){if(!state)return;$('score').textContent=state.lastAssessment?state.lastAssessment.score+'٪':'ثبت نشده';$('assessmentScore').textContent=state.lastAssessment?state.lastAssessment.score+' از ۱۰۰':'ثبت نشده';$('openTasks').textContent=String(state.tasks.filter(t=>t.status==='open').length);
const list=$('taskList');list.replaceChildren();const summary=$('homeTasks');summary.textContent=state.tasks.length?state.tasks.filter(t=>t.status==='open').slice(0,3).map(t=>t.title).join(' • ')||'همه وظایف انجام شده‌اند':'هنوز وظیفه‌ای ثبت نشده است';
for(const t of state.tasks){const row=document.createElement('div');row.className='task';const span=document.createElement('span');span.textContent=t.title;const button=document.createElement('button');button.textContent=t.status==='done'?'بازگشایی':'انجام شد';button.addEventListener('click',async()=>{try{await api('tasks/'+encodeURIComponent(t.id),{method:'PATCH',body:JSON.stringify({status:t.status==='done'?'open':'done'})});await refresh()}catch(e){message(e.message)}});row.append(span,button);list.append(row);}
if(state.profile){for(const [k,v] of Object.entries(state.profile)){const el=$('profileForm').elements.namedItem(k);if(el)el.value=v||'';}}}
async function refresh(){state=await api('overview');render();}
$('profileForm').addEventListener('submit',async e=>{e.preventDefault();const b=Object.fromEntries(new FormData(e.currentTarget).entries());try{await api('profile',{method:'POST',body:JSON.stringify(b)});await refresh();message('پروفایل ذخیره شد.')}catch(err){message(err.message)}});
$('taskForm').addEventListener('submit',async e=>{e.preventDefault();const title=new FormData(e.currentTarget).get('title');try{await api('tasks',{method:'POST',body:JSON.stringify({title})});e.currentTarget.reset();await refresh();message('وظیفه ثبت شد.')}catch(err){message(err.message)}});
$('openBot').addEventListener('click',()=>{webapp?.openTelegramLink('https://t.me/candidatoryiran_bot')});
if(initData)refresh().catch(e=>message(e.message));else message('برای دریافت اطلاعات و استفاده از امکانات، Mini App را داخل تلگرام اجرا کنید.');
let academy=null;
async function loadAcademy(){try{academy=await api('courses');renderAcademy();}catch(e){message(e.message)}}
function renderAcademy(){
 if(!academy)return;
 const summary=$('academySummary');summary.replaceChildren();
 for(const [label,value] of [['تعداد دوره‌ها',academy.courses.length],['آزمون‌های گذرانده',academy.completed.length]]){
  const card=document.createElement('article'),l=document.createElement('small'),v=document.createElement('strong');
  l.textContent=label;v.textContent=String(value);card.append(l,v);summary.append(card);
 }
 const filter=$('categoryFilter');if(filter.options.length===1){for(const category of new Set(academy.courses.map(c=>c.category))){const opt=document.createElement('option');opt.value=category;opt.textContent=category;filter.append(opt)}}
 const list=$('courseList');list.replaceChildren();
 for(const course of academy.courses.filter(c=>!filter.value||filter.value===c.category)){
  const card=document.createElement('article'),head=document.createElement('h3'),info=document.createElement('p'),btn=document.createElement('button');
  head.textContent=course.title+(academy.completed.includes(course.id)?' ✓':'');
  info.textContent=course.category+' · '+course.minutes+' دقیقه · '+course.summary;
  btn.type='button';btn.textContent='مشاهده درس و آزمون';btn.addEventListener('click',()=>showCourse(course));
  card.append(head,info,btn);list.append(card);
 }
}
function showCourse(course){
 const panel=$('lessonDetail');panel.hidden=false;panel.replaceChildren();
 const title=document.createElement('h3');title.textContent=course.title;panel.append(title);
 for(const section of course.sections){const h=document.createElement('h4'),p=document.createElement('p');h.textContent=section.title;p.textContent=section.body;panel.append(h,p)}
 const q=document.createElement('h4');q.textContent=course.quiz.question;panel.append(q);
 course.quiz.options.forEach((answer,index)=>{const b=document.createElement('button');b.type='button';b.className='quiz-choice';b.textContent=answer;b.addEventListener('click',async()=>{try{const result=await api('courses/complete',{method:'POST',body:JSON.stringify({courseId:course.id,answer:index})});message(result.passed?'آزمون با موفقیت گذرانده شد.':'پاسخ درست نیست؛ نکات درس را مرور کنید.');if(result.passed){await loadAcadem();}}catch(e){message(e.message)}});panel.append(b)});
 panel.scrollIntoView({behavior:'auto',block:'start'});
}
async function loadAcadem(){academy=await api('courses');renderAcademy();}
$('categoryFilter').addEventListener('change',renderAcademy);
document.querySelector('[data-tab="academy"]').addEventListener('click',()=>{if(!academy)loadAcademy()});
