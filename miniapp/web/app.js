"use strict";
const tg=window.Telegram?.WebApp;tg?.ready();tg?.expand();
const initData=tg?.initData||"";
const endpoint=document.querySelector('meta[name="miniapp-api"]')?.content||"/";
const content=document.getElementById("content"),inner=document.getElementById("inner-panel"),homepage=document.getElementById("home-panel"),featured=document.getElementById("featured-lessons");
let state={lessons:[],quizzes:[],attempts:[],completed:[]},tab="home",searchTerm="";
function el(tag,text,cls){const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined&&text!==null)x.textContent=String(text);return x}
function clear(node=content){node.replaceChildren()}
function button(text,fn,cls="action"){const b=el("button",text,cls);b.type="button";b.addEventListener("click",fn);return b}
function empty(text){return el("div",text,"empty")}
function fail(err){clear();content.append(el("div",err.message||"خطا در دریافت اطلاعات","error"))}
function setMain(next){tab=next;homepage.hidden=tab!=="home";inner.hidden=tab==="home";document.querySelectorAll("[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));if(tab==="home")renderHome();else render()}
function card(title,description,buttonText,fn,number,completed){const article=el("article",null,"card");const head=el("div",null,"card-head");head.append(el("h3",title));head.append(el("span",completed?"✓":String(number||"✦"),"mini-icon"));article.append(head,el("p",description||""));if(buttonText)article.append(button(buttonText,fn,completed?"action outline":"action"));return article}
async function api(action,details={}){if(!initData)throw Error("برنامه را از منوی ربات در تلگرام باز کنید.");const r=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action,initData,...details})});let data;try{data=await r.json()}catch{throw Error("پاسخ سرور قابل خواندن نیست.")}if(!r.ok)throw Error(data.error==="Unauthorized"?"نشست تلگرام معتبر نیست؛ برنامه را ببندید و دوباره باز کنید.":data.error||"خطای ارتباط");return data}
function renderHome(){document.getElementById("stat-lessons").textContent=state.lessons.length.toLocaleString("fa-IR");document.getElementById("stat-completed").textContent=state.completed.length.toLocaleString("fa-IR");document.getElementById("stat-quizzes").textContent=state.quizzes.length.toLocaleString("fa-IR");clear(featured);const matches=state.lessons.filter(x=>x.title.includes(searchTerm)||x.summary.includes(searchTerm)).slice(0,4);const list=el("div",null,"cards");for(const lesson of matches)list.append(card(lesson.title,lesson.summary,"مطالعه درس",()=>openLesson(lesson.id),lesson.position,state.completed.includes(lesson.id)));featured.append(matches.length?list:empty("موضوعی با این عبارت پیدا نشد."))}
function render(){clear();const head=inner.querySelector("h2");head.textContent=({lessons:"آموزش‌ها",quizzes:"آزمون‌ها",progress:"پیشرفت من",profile:"پروفایل"})[tab]||"آموزش‌ها";
if(tab==="lessons"){const list=el("div",null,"cards");for(const x of state.lessons)list.append(card(x.title,x.summary,"مطالعه درس",()=>openLesson(x.id),x.position,state.completed.includes(x.id)));content.append(state.lessons.length?list:empty("هنوز آموزشی منتشر نشده است."));return}
if(tab==="quizzes"){const list=el("div",null,"cards");for(const q of state.quizzes)list.append(card(q.title,q.description,"شروع آزمون",()=>openQuiz(q.id)));content.append(state.quizzes.length?list:empty("آزمون مستقلی هنوز منتشر نشده است. محتوای آموزش‌ها در دسترس است."));return}
if(tab==="progress"){const section=el("div",null,"cards"),pct=state.lessons.length?Math.round(state.completed.length/state.lessons.length*100):0;const stat=el("article",null,"card");stat.append(el("h3","پیشرفت مطالعه"),el("p",state.completed.length+" درس از "+state.lessons.length+" درس تکمیل شده"));const track=el("div",null,"progress-track"),bar=el("div");bar.style.width=pct+"%";track.append(bar);stat.append(track,el("p",pct+"٪ مسیر مطالعه"));section.append(stat);if(state.attempts.length){for(const a of state.attempts.slice(0,10))section.append(card("نتیجه آزمون",a.score+" پاسخ درست از "+a.question_count+" سؤال",null,null))}content.append(section);return}
if(tab==="profile"){const c=el("div",null,"card");c.append(el("h3",state.user?.name||"کاربر تلگرام"),el("p","شناسه ورود شما با امضای تلگرام تأیید می‌شود. اطلاعات هویتی حساس دریافت نمی‌کنیم."));c.append(el("p","درس‌های تکمیل‌شده: "+state.completed.length.toLocaleString("fa-IR")));content.append(c)}
}
async function home(){try{const data=await api("home");state={lessons:data.lessons||[],quizzes:data.quizzes||[],attempts:data.attempts||[],completed:data.completed||[],user:data.user};document.getElementById("hello").textContent="سلام"+(data.user?.name?"، "+data.user.name:"")+" 👋";setMain(tab)}catch(e){homepage.hidden=true;inner.hidden=false;tab="lessons";fail(e);document.getElementById("inner-heading").querySelector("h2").textContent="خطا در بارگذاری اطلاعات";content.prepend(button("تلاش دوباره",home,"action"));}}
async function openLesson(id){setMain("lessons");clear();content.append(el("div","در حال بارگذاری…","loading"));try{const {lesson}=await api("lesson",{id});if(!lesson)throw Error("درس پیدا نشد.");clear();content.append(button("← بازگشت به آموزش‌ها",()=>setMain("lessons"),"back"));const c=el("article",null,"card");c.append(el("h3",lesson.title),el("p",lesson.summary),el("div",lesson.body,"body-text"));const done=state.completed.includes(id),mark=button(done?"✓ این درس تکمیل شده":"✓ پایان مطالعه و ثبت پیشرفت",async()=>{mark.disabled=true;try{await api("completeLesson",{id});if(!state.completed.includes(id))state.completed.push(id);mark.textContent="✓ این درس تکمیل شده";tg?.HapticFeedback?.notificationOccurred("success")}catch(e){mark.disabled=false;alert(e.message)}});mark.disabled=done;c.append(mark);content.append(c)}catch(e){fail(e)}}
async function openQuiz(id){
 setMain("quizzes");clear();content.append(el("div","در حال بارگذاری آزمون…","loading"));
 try{
  const {quiz,questions}=await api("quiz",{id});if(!questions?.length)throw Error("این آزمون هنوز سؤال ندارد.");
  const answers=Array(questions.length).fill(null);let index=0;
  function draw(){
   clear();
   content.append(button("← بازگشت به آزمون‌ها",()=>setMain("quizzes"),"back"));
   const track=el("div",null,"progress-track"),bar=el("div");
   bar.style.width=((index+1)/questions.length*100)+"%";track.append(bar);
   content.append(el("p","سؤال "+(index+1).toLocaleString("fa-IR")+" از "+questions.length.toLocaleString("fa-IR")+" • "+quiz.title,"meta"),track);
   const q=questions[index],panel=el("article",null,"card");
   panel.append(el("h3",q.prompt));
   q.options.forEach((option,idx)=>{
    const label=el("label",null,"option"),radio=el("input");
    radio.type="radio";radio.name="quiz-choice";radio.value=String(idx);radio.checked=answers[index]===idx;
    radio.addEventListener("change",()=>{answers[index]=idx;next.disabled=false;tg?.HapticFeedback?.selectionChanged()});
    label.append(radio,document.createTextNode(String(option)));panel.append(label);
   });
   content.append(panel);
   const row=el("div",null,"quiz-actions");
   if(index>0)row.append(button("قبلی",()=>{index--;draw()},"action outline"));
   const next=button(index===questions.length-1?"ثبت پاسخ‌ها":"سؤال بعدی",async()=>{
    if(answers[index]===null)return;
    if(index<questions.length-1){index++;draw();return}
    next.disabled=true;
    try{
     const result=await api("submit",{id,answers});
     clear();const resultPanel=el("article",null,"card");
     resultPanel.append(el("h3","آزمون به پایان رسید 🎉"),el("p","پاسخ‌های درست: "+result.score.toLocaleString("fa-IR")+" از "+result.total.toLocaleString("fa-IR")));
     const progress=el("div",null,"progress-track"),fill=el("div");fill.style.width=(result.score/result.total*100)+"%";progress.append(fill);resultPanel.append(progress);
     content.append(resultPanel,button("بازگشت به آزمون‌ها",async()=>{await home();setMain("quizzes")}));
     tg?.HapticFeedback?.notificationOccurred("success");
    }catch(e){next.disabled=false;alert(e.message)}
   });
   next.disabled=answers[index]===null;row.append(next);content.append(row);
  }
  draw();
 }catch(e){fail(e)}
}
document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>setMain(b.dataset.tab)));
document.querySelectorAll("[data-quick]").forEach(b=>b.addEventListener("click",()=>setMain(b.dataset.quick)));
document.querySelectorAll("[data-jump]").forEach(b=>b.addEventListener("click",()=>setMain(b.dataset.jump)));
document.getElementById("featured-start").addEventListener("click",()=>setMain("lessons"));
document.getElementById("search").addEventListener("input",e=>{searchTerm=e.target.value.trim();renderHome()});
home();