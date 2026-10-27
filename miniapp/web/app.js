"use strict";
const tg=window.Telegram?.WebApp;tg?.ready();tg?.expand();
const initData=tg?.initData||"";
const endpoint=document.querySelector('meta[name="miniapp-api"]')?.content||"/";
const content=document.getElementById("content"),inner=document.getElementById("inner-panel"),homepage=document.getElementById("home-panel"),featured=document.getElementById("featured-lessons");
let state={lessons:[],quizzes:[],attempts:[],completed:[],bookmarks:[],dailyGoal:1},tab="home",searchTerm="";
function saveJsonFile(data,filename){const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json;charset=utf-8"});const u=URL.createObjectURL(blob);const a=document.createElement("a");a.href=u;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500)}
async function showMyPrivacy(target){try{const result=await api("myPrivacy");let list=target.querySelector(".privacy-list");if(!list){list=el("div",null,"privacy-list");target.append(list)}clear(list);for(const item of result.requests||[])list.append(el("p",item.request_type+" — "+item.status+" — "+item.created_at,"meta"))}catch(e){target.append(el("p","دریافت وضعیت درخواست‌ها ممکن نشد.","meta"))}}
async function showSupportTickets(container){
 try{const result=await api("mySupportTickets");let list=container.querySelector(".support-list");if(!list){list=el("div",null,"support-list");container.append(list)}clear(list);
 for(const t of result.tickets||[]){const item=el("div",null,"op-row");item.append(el("strong",t.subject),el("small","وضعیت: "+t.status));if(t.admin_reply)item.append(el("p","پاسخ: "+t.admin_reply));list.append(item)}
 }catch(e){container.append(el("p","دریافت درخواست‌های پشتیبانی ممکن نشد.","meta"))}
}
function GenCopyId(id){if(navigator.clipboard?.writeText)navigator.clipboard.writeText(String(id)).then(()=>alert("شناسه کپی شد")).catch(()=>alert(String(id)));else alert(String(id))}
function el(tag,text,cls){const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined&&text!==null)x.textContent=String(text);return x}
function clear(node=content){node.replaceChildren()}
function button(text,fn,cls="action"){const b=el("button",text,cls);b.type="button";b.addEventListener("click",fn);return b}
function empty(text){return el("div",text,"empty")}
function fail(err){clear();content.append(el("div",err.message||"خطا در دریافت اطلاعات","error"))}
function setMain(next){tab=next;homepage.hidden=tab!=="home";inner.hidden=tab==="home";document.querySelectorAll("[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));if(tab==="home")renderHome();else render()}
function card(title,description,buttonText,fn,number,completed){const article=el("article",null,"card");const head=el("div",null,"card-head");head.append(el("h3",title));head.append(el("span",completed?"✓":String(number||"✦"),"mini-icon"));article.append(head,el("p",description||""));if(buttonText)article.append(button(buttonText,fn,completed?"action outline":"action"));return article}
async function api(action,details={}){if(!initData)throw Error("برنامه را از منوی ربات در تلگرام باز کنید.");const r=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action,initData,...details})});let data;try{data=await r.json()}catch{throw Error("پاسخ سرور قابل خواندن نیست.")}if(!r.ok)throw Error(data.error==="Unauthorized"?"نشست تلگرام معتبر نیست؛ برنامه را ببندید و دوباره باز کنید.":data.error||"خطای ارتباط");return data}
function renderHome(){document.getElementById("stat-lessons").textContent=state.lessons.length.toLocaleString("fa-IR");document.getElementById("stat-completed").textContent=state.completed.length.toLocaleString("fa-IR");document.getElementById("stat-quizzes").textContent=state.quizzes.length.toLocaleString("fa-IR");clear(featured);const matches=state.lessons.filter(x=>x.title.includes(searchTerm)||x.summary.includes(searchTerm)).slice(0,4);const list=el("div",null,"cards");for(const lesson of matches)list.append(card(lesson.title,lesson.summary,"مطالعه درس",()=>openLesson(lesson.id),lesson.position,state.completed.includes(lesson.id)));featured.append(matches.length?list:empty("موضوعی با این عبارت پیدا نشد."))}
function render(){clear();const head=inner.querySelector("h2");head.textContent=({lessons:"آموزش‌ها",quizzes:"آزمون‌ها",progress:"پیشرفت من",profile:"پروفایل",workspace:"مدیریت"})[tab]||"آموزش‌ها";
if(tab==="workspace"){renderWorkspace();return}
if(tab==="lessons"){const list=el("div",null,"cards");for(const x of state.lessons)list.append(card(x.title,x.summary,"مطالعه درس",()=>openLesson(x.id),x.position,state.completed.includes(x.id)));content.append(state.lessons.length?list:empty("هنوز آموزشی منتشر نشده است."));return}
if(tab==="quizzes"){const list=el("div",null,"cards");for(const q of state.quizzes)list.append(card(q.title,q.description,"شروع آزمون",()=>openQuiz(q.id)));content.append(state.quizzes.length?list:empty("آزمون مستقلی هنوز منتشر نشده است. محتوای آموزش‌ها در دسترس است."));return}
if(tab==="progress"){const section=el("div",null,"cards"),pct=state.lessons.length?Math.round(state.completed.length/state.lessons.length*100):0;const stat=el("article",null,"card");stat.append(el("h3","پیشرفت مطالعه"),el("p",state.completed.length+" درس از "+state.lessons.length+" درس تکمیل شده"));const track=el("div",null,"progress-track"),bar=el("div");bar.style.width=pct+"%";track.append(bar);stat.append(track,el("p",pct+"٪ مسیر مطالعه"));section.append(stat);
const goalCard=el("article",null,"card");
goalCard.append(el("h3","هدف روزانه مطالعه"),el("p","هدف فعلی: "+state.dailyGoal.toLocaleString("fa-IR")+" درس در روز"));
const goalOptions=el("div",null,"quiz-actions");[1,2,3,4,5].forEach(n=>{const b=button(n.toLocaleString("fa-IR"),async()=>{if(state.limitedAccess)return alert("برای ذخیره هدف وارد تلگرام شوید.");try{await api("dailyGoal",{goal:n});state.dailyGoal=n;render()}catch(e){alert(e.message)}},"action outline");b.style.minWidth="0";goalOptions.append(b)});
goalCard.append(goalOptions);if(state.limitedAccess)goalCard.append(el("p","برای ذخیره هدف، ورود تلگرام لازم است."));
section.append(goalCard);
const achievement=el("article",null,"card");
const badges=[{title:"قدم اول",threshold:1},{title:"یادگیرنده پیگیر",threshold:3},{title:"نیمه راه",threshold:6},{title:"پایان مسیر",threshold:12}];
achievement.append(el("h3","نشان‌های یادگیری"));
const badgeRow=el("div",null,"badge-grid");
badges.forEach(b=>{const x=el("div",null,state.completed.length>=b.threshold?"earned":"locked");x.append(el("span",state.completed.length>=b.threshold?"🏅":"🔒"),el("small",b.title));badgeRow.append(x)});
achievement.append(badgeRow);section.append(achievement);
if(state.attempts.length){for(const a of state.attempts.slice(0,10))section.append(card("نتیجه آزمون",a.score+" پاسخ درست از "+a.question_count+" سؤال",null,null))}content.append(section);return}
if(tab==="profile"){const c=el("div",null,"card");c.append(el("h3",state.user?.name||"کاربر تلگرام"),el("p","شناسه ورود شما با امضای تلگرام تأیید می‌شود. اطلاعات هویتی حساس دریافت نمی‌کنیم."));c.append(el("p","درس‌های تکمیل‌شده: "+state.completed.length.toLocaleString("fa-IR")));if(state.user?.id){c.append(el("p","شناسه تلگرام شما: "+String(state.user.id)));c.append(button("کپی شناسه تلگرام",()=>GenCopyId(state.user.id),"action outline"))}content.append(c);
const saved=el("article",null,"card");saved.append(el("h3","درس‌های نشان‌شده"));
if(!state.bookmarks.length)saved.append(el("p","هنوز درسی نشان نکرده‌اید."));
else for(const lesson of state.lessons.filter(x=>state.bookmarks.includes(x.id)))saved.append(button("★ "+lesson.title,()=>openLesson(lesson.id),"action outline"));
content.append(saved);
content.append(button("به‌روزرسانی اطلاعات",home,"action outline"));
const privacy=el("section",null,"card");privacy.append(el("h3","حریم خصوصی و داده‌های من"));
privacy.append(el("p","می‌توانید نسخه‌ای از داده‌های آموزشی خود را دریافت کنید یا درخواست اصلاح یا حذف حساب ثبت کنید. ثبت درخواست، حذف خودکار نیست و ابتدا بررسی می‌شود."));
privacy.append(button("دریافت اطلاعات شخصی (JSON)",async()=>{
 try{const result=await api("myDataExport");saveJsonFile(result.data,"candidatory-my-data.json")}catch(e){alert(e.message)}
},"action outline"));
const request=button("ثبت درخواست حریم خصوصی",async()=>{
 try{const type=prompt("نوع درخواست: export یا delete یا correct","delete");if(type===null)return;
 if(!["export","delete","correct"].includes(type)){alert("نوع درخواست معتبر نیست.");return}
 const details=prompt("توضیحات تکمیلی (اختیاری)","");if(details===null)return;
 await api("requestPrivacy",{requestType:type,details});alert("درخواست ثبت شد و پس از بررسی پیگیری می‌شود.");await showMyPrivacy(privacy)
 }catch(e){alert(e.message)}
},"action outline");privacy.append(request);
content.append(privacy);if(!state.limitedAccess)showMyPrivacy(privacy);
const support=el("section",null,"card");support.append(el("h3","پشتیبانی و راهنمایی"),el("p","برای پیگیری سؤال فنی یا گزارش مشکل، درخواست پشتیبانی ثبت کنید."));
const details=el("details"),summary=el("summary","＋ درخواست جدید"),form=el("form");
const subject=el("input");subject.placeholder="عنوان درخواست";subject.minLength=3;subject.maxLength=200;subject.required=true;subject.className="notes-input";
const message=el("textarea",null,"notes-input");message.placeholder="شرح مشکل یا سؤال";message.rows=4;message.minLength=5;message.maxLength=3000;message.required=true;
const send=button("ارسال درخواست",()=>{});send.type="submit";
form.append(subject,message,send);details.append(summary,form);support.append(details);
form.addEventListener("submit",async event=>{event.preventDefault();send.disabled=true;try{await api("createSupportTicket",{subject:subject.value,message:message.value});form.reset();details.open=false;await showSupportTickets(support)}catch(e){alert(e.message)}finally{send.disabled=false}});
content.append(support);if(!state.limitedAccess)showSupportTickets(support);
}
}
async function home(){try{let data;try{data=await api("home")}catch(authError){const result=await fetch("/api/catalog",{cache:"no-store"});if(!result.ok)throw authError;const catalog=await result.json();data={...catalog,attempts:[],completed:[],bookmarks:[],dailyGoal:1,user:{name:""},limitedAccess:true}}state={lessons:data.lessons||[],quizzes:data.quizzes||[],attempts:data.attempts||[],completed:data.completed||[],user:data.user,limitedAccess:!!data.limitedAccess,bookmarks:data.bookmarks||[],dailyGoal:data.dailyGoal||1};document.getElementById("hello").textContent="سلام"+(data.user?.name?"، "+data.user.name:"")+" 👋";setMain(tab)}catch(e){homepage.hidden=true;inner.hidden=false;tab="lessons";fail(e);document.getElementById("inner-heading").querySelector("h2").textContent="خطا در بارگذاری اطلاعات";content.prepend(button("تلاش دوباره",home,"action"));}}
async function openLesson(id){setMain("lessons");clear();content.append(el("div","در حال بارگذاری…","loading"));try{const {lesson}=state.limitedAccess?await (await fetch("/api/lesson/"+id)).json():await api("lesson",{id});if(!lesson)throw Error("درس پیدا نشد.");clear();content.append(button("← بازگشت به آموزش‌ها",()=>setMain("lessons"),"back"));const c=el("article",null,"card");c.append(el("h3",lesson.title),el("p",lesson.summary),el("div",lesson.body,"body-text"));const done=state.completed.includes(id),mark=button(done?"✓ این درس تکمیل شده":"✓ پایان مطالعه و ثبت پیشرفت",async()=>{mark.disabled=true;try{await api("completeLesson",{id});if(!state.completed.includes(id))state.completed.push(id);mark.textContent="✓ این درس تکمیل شده";tg?.HapticFeedback?.notificationOccurred("success")}catch(e){mark.disabled=false;alert(e.message)}});mark.disabled=done||state.limitedAccess;if(state.limitedAccess)mark.textContent="ثبت پیشرفت نیازمند ورود معتبر تلگرام است";c.append(mark);
const isSaved=state.bookmarks.includes(id);
const bookmarkBtn=button(isSaved?"★ حذف از علاقه‌مندی‌ها":"☆ نشان‌کردن درس",async()=>{
 if(state.limitedAccess)return alert("برای ثبت علاقه‌مندی وارد تلگرام شوید.");
 bookmarkBtn.disabled=true;const newValue=!state.bookmarks.includes(id);
 try{await api("bookmark",{id,enabled:newValue});state.bookmarks=newValue?[...state.bookmarks,id]:state.bookmarks.filter(x=>x!==id);bookmarkBtn.textContent=newValue?"★ حذف از علاقه‌مندی‌ها":"☆ نشان‌کردن درس"}catch(e){alert(e.message)}finally{bookmarkBtn.disabled=false}
},"action outline");c.append(bookmarkBtn);
const noteLabel=el("h3","یادداشت شخصی من");c.append(noteLabel);
const notes=el("textarea",null,"notes-input");notes.placeholder="نکات مهمی که می‌خواهید به خاطر بسپارید…";notes.maxLength=2000;notes.rows=4;notes.disabled=state.limitedAccess;c.append(notes);
if(!state.limitedAccess){api("note",{id}).then(x=>{notes.value=x.note||""}).catch(()=>{notes.placeholder="بارگذاری یادداشت انجام نشد"});}
const save=button("ذخیره یادداشت",async()=>{save.disabled=true;try{await api("note",{id,note:notes.value});save.textContent="✓ ذخیره شد"}catch(e){alert(e.message)}finally{save.disabled=false}},"action outline");save.disabled=state.limitedAccess;c.append(save);
content.append(c)}catch(e){fail(e)}}
async function openQuiz(id){
 setMain("quizzes");clear();content.append(el("div","در حال بارگذاری آزمون…","loading"));
 try{
  const {quiz,questions}=state.limitedAccess?await (await fetch("/api/quiz/"+id)).json():await api("quiz",{id});if(!questions?.length)throw Error("این آزمون هنوز سؤال ندارد.");
  const answers=Array(questions.length).fill(null);let index=0;
  function draw(){
   clear();
   content.append(button("← بازگشت به آزمون‌ها",()=>setMain("quizzes"),"back"));
   const track=el("div",null,"progress-track"),bar=el("div");
   bar.style.width=((index+1)/questions.length*100)+"%";track.append(bar);
   const qheader=el("div",null,"quiz-header");qheader.append(el("strong","سؤال "+(index+1).toLocaleString("fa-IR")+" از "+questions.length.toLocaleString("fa-IR")),el("span",Math.round((index+1)/questions.length*100).toLocaleString("fa-IR")+"٪"));content.append(qheader,track);content.append(el("p",quiz.title,"meta"));
   const q=questions[index],panel=el("article",null,"card quiz-question");
   panel.append(el("div","آزمون آموزشی • پرسش "+(index+1).toLocaleString("fa-IR"),"quiz-topic"),el("h3",q.prompt));
   q.options.forEach((option,idx)=>{
    const label=el("label",null,"option"),radio=el("input");
    radio.type="radio";radio.name="quiz-choice";radio.value=String(idx);radio.checked=answers[index]===idx;
    radio.addEventListener("change",()=>{answers[index]=idx;next.disabled=false;tg?.HapticFeedback?.selectionChanged()});
    label.append(el("span",String.fromCharCode(65+idx),"option-letter"),radio,document.createTextNode(String(option)));panel.append(label);
   });
   content.append(panel);
   const hint=el("div",null,"quiz-hint");hint.append(el("span","✦","hint-icon"),el("p","پاسخ خود را انتخاب کنید. پس از پایان آزمون، نتیجه براساس پاسخ‌های ثبت‌شده محاسبه می‌شود."));content.append(hint);
   const row=el("div",null,"quiz-actions");
   if(index>0)row.append(button("قبلی",()=>{index--;draw()},"action outline"));
   const next=button(index===questions.length-1?"ثبت پاسخ‌ها":"سؤال بعدی",async()=>{
    if(answers[index]===null)return;
    if(index<questions.length-1){index++;draw();return}
    next.disabled=true;
    if(state.limitedAccess){alert("برای ثبت نتیجه آزمون، مینی‌اپ باید با نشست معتبر تلگرام باز شود.");next.disabled=false;return}
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