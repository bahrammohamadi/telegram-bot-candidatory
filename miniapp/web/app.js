"use strict";
const tg=window.Telegram?.WebApp;tg?.ready();tg?.expand();
const initData=tg?.initData||"";
const endpoint=document.querySelector('meta[name="miniapp-api"]')?.content||"/";
const content=document.getElementById("content"),inner=document.getElementById("inner-panel"),homepage=document.getElementById("home-panel"),featured=document.getElementById("featured-lessons");
let state={lessons:[],quizzes:[],attempts:[],completed:[],bookmarks:[],dailyGoal:1},tab="home",searchTerm="";
// UI state is local-only; authentication and permissions stay on the Worker.
let toastTimer;
function notify(message,type="success"){
 const node=document.getElementById("app-toast");if(!node)return;
 node.textContent=String(message);node.dataset.type=type;node.hidden=false;
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>{node.hidden=true},3500);
}
function applyTheme(next){
 const theme=next==="dark"?"dark":"light";
 document.documentElement.dataset.theme=theme;
 const toggle=document.getElementById("theme-toggle");
 if(toggle){toggle.textContent=theme==="dark"?"☀":"☾";toggle.setAttribute("aria-label",theme==="dark"?"فعال‌سازی حالت روشن":"فعال‌سازی حالت تیره")}
 document.querySelector('meta[name="theme-color"]')?.setAttribute("content",theme==="dark"?"#101f26":"#057f83");
 try{localStorage.setItem("candidatory-theme",theme)}catch{}
}
function setupUiControls(){
 let current;try{current=localStorage.getItem("candidatory-theme")}catch{}
 applyTheme(current==="dark"||current==="light"?current:tg?.colorScheme==="dark"?"dark":"light");
 document.getElementById("theme-toggle")?.addEventListener("click",()=>applyTheme(document.documentElement.dataset.theme==="dark"?"light":"dark"));
 document.getElementById("reload-app")?.addEventListener("click",async()=>{await home();notify("اطلاعات برنامه به‌روزرسانی شد.")});
 tg?.onEvent?.("themeChanged",()=>{let saved;try{saved=localStorage.getItem("candidatory-theme")}catch{}if(!saved)applyTheme(tg?.colorScheme)});
}
function renderResume(){
 const root=document.getElementById("learning-resume");if(!root)return;root.replaceChildren();
 const count=state.lessons.length,done=state.completed.length;
 if(!count)return;
 const pct=Math.round(done/count*100);
 const target=state.lessons.find(x=>!state.completed.includes(x.id));
 const container=el("div",null,"resume-card");
 const dial=el("div",null,"resume-dial");dial.style.setProperty("--pct",pct);dial.append(el("strong",pct.toLocaleString("fa-IR")+"٪"));
 const info=el("div",null,"resume-info");info.append(el("small",target?"درس بعدی شما":"مسیر یادگیری کامل شد"),el("strong",target?target.title:"تمام درس‌ها را به پایان رسانده‌اید."));
 info.append(button(target?"ادامه مطالعه ←":"مشاهده پیشرفت",()=>target?openLesson(target.id):setMain("progress"),"action"));
 container.append(dial,info);root.append(container);
}
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
function setMain(next){const changed=tab!==next;tab=next;homepage.hidden=tab!=="home";inner.hidden=tab==="home";document.querySelectorAll("[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));if(tab==="home")renderHome();else render();if(changed){const panel=tab==="home"?homepage:inner;panel.classList.remove("page-enter");void panel.offsetWidth;panel.classList.add("page-enter");window.scrollTo({top:0,behavior:"instant"});}}
function card(title,description,buttonText,fn,number,completed){const article=el("article",null,"card");const head=el("div",null,"card-head");head.append(el("h3",title));head.append(el("span",completed?"✓":String(number||"✦"),"mini-icon"));article.append(head,el("p",description||""));if(buttonText)article.append(button(buttonText,fn,completed?"action outline":"action"));return article}
async function api(action,details={}){if(!initData)throw Error("برنامه را از منوی ربات در تلگرام باز کنید.");const r=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action,initData,...details})});let data;try{data=await r.json()}catch{throw Error("پاسخ سرور قابل خواندن نیست.")}if(!r.ok)throw Error(data.error==="Unauthorized"?"نشست تلگرام معتبر نیست؛ برنامه را ببندید و دوباره باز کنید.":data.error||"خطای ارتباط");return data}
const launcherApps=[
  {id:"legal",label:"قوانین و مدارک",icon:"⚖️",theme:"indigo",hint:"منابع معتبر"},
  {id:"candidate",label:"پرونده من",icon:"🗂️",theme:"violet",hint:"مشخصات و مدارک"},
  {id:"lessons",label:"آموزش‌ها",icon:"📚",theme:"aqua",hint:"دوره و مطالعه"},
  {id:"quizzes",label:"آزمون‌ها",icon:"📝",theme:"violet",hint:"پرسش و نتیجه"},
  {id:"readiness",label:"خودارزیابی",icon:"🎯",theme:"coral",hint:"سنجش آمادگی"},
  {id:"ai",label:"دستیار هوشمند",icon:"✦",theme:"indigo",hint:"پرسش از AI"},
  {id:"progress",label:"پیشرفت من",icon:"📊",theme:"blue",hint:"هدف و گزارش"},
  {id:"bookmarks",label:"ذخیره‌شده‌ها",icon:"🔖",theme:"amber",hint:"درس‌های منتخب"},
  {id:"tasks",label:"وظایف",icon:"✅",theme:"green",hint:"پیگیری کارها",workspace:true},
  {id:"events",label:"جلسات",icon:"📅",theme:"blue",hint:"رویداد و تقویم",workspace:true},
  {id:"members",label:"تیم من",icon:"👥",theme:"violet",hint:"اعضا و دعوت",workspace:true},
  {id:"commitments",label:"برنامه‌ها",icon:"📋",theme:"aqua",hint:"پیگیری تعهدات",workspace:true},
  {id:"documents",label:"اسناد",icon:"📁",theme:"amber",hint:"بایگانی مدارک",workspace:true},
  {id:"expenses",label:"هزینه‌ها",icon:"💳",theme:"coral",hint:"دفتر مالی",workspace:true},
  {id:"notices",label:"اطلاعیه‌ها",icon:"📣",theme:"indigo",hint:"اعلان‌های تیم",workspace:true},
  {id:"reports",label:"گزارش‌ها",icon:"📈",theme:"green",hint:"خروجی عملکرد",workspace:true},
  {id:"support",label:"پشتیبانی",icon:"💬",theme:"blue",hint:"ثبت درخواست"},
  {id:"profile",label:"حساب من",icon:"👤",theme:"aqua",hint:"حریم خصوصی"}
];
function openLauncher(id){
  const app=launcherApps.find(x=>x.id===id);if(!app)return;
  tg?.HapticFeedback?.selectionChanged?.();
  if(app.workspace){
    if(typeof opState!=="undefined")opState.focusTool=id;
    setMain("workspace");return;
  }
  if(id==="candidate"){openCandidateProfile();return}
  if(id==="legal"){openLegalLibrary();return}
  if(id==="readiness"){openReadiness();return}
  if(id==="ai"){openStudyAssistant();return}
  if(id==="bookmarks"){
    setMain("profile");
    document.querySelector(".saved-lessons")?.scrollIntoView({block:"center",behavior:"smooth"});return;
  }
  if(id==="support"){
    setMain("profile");
    document.querySelector(".support-center")?.scrollIntoView({block:"center",behavior:"smooth"});return;
  }
  setMain(id);
}
// Original vector pictograms, bundled into app.js — no CDN, licensing, or image fetch.
const iconPaths={
 legal:'<path d="M24 7v34M9 15h30M13 15l-8 16h16l-8-16Zm22 0-8 16h16l-8-16ZM14 41h20"/>',
 candidate:'<rect x="7" y="8" width="34" height="33" rx="5"/><circle cx="18" cy="20" r="5"/><path d="M11 34c0-6 3-9 7-9s7 3 7 9M29 19h7m-7 7h7m-7 7h5"/>',
 lessons:'<path d="M24 15c-7-4-13-3-17-1v25c6-2 11-2 17 1 6-3 11-3 17-1V14c-5-2-11-3-17 1Z"/><path d="M24 15v25"/><path d="m11 21 9 2m8 0 9-2M11 28l9 2m8 0 9-2"/>',
 quizzes:'<rect x="10" y="8" width="28" height="36" rx="5"/><path d="M18 8v-3h12v3M17 20h13m-13 8h8m-8 7h5"/><path d="m29 33 3 3 6-7"/>',
 readiness:'<circle cx="24" cy="25" r="16"/><circle cx="24" cy="25" r="10"/><circle cx="24" cy="25" r="4"/><path d="m27 22 14-14m-8 1h8v8"/>',
 ai:'<path d="m24 5 4.2 14.8L43 24l-14.8 4.2L24 43l-4.2-14.8L5 24l14.8-4.2L24 5Z"/><path d="m39 5 1.4 4.5L45 11l-4.6 1.5L39 17l-1.4-4.5L33 11l4.6-1.5L39 5Z"/>',
 progress:'<path d="M9 41V29h7v12M21 41V19h7v22m5 0V9h7v32"/><path d="M6 43h37"/>',
 bookmarks:'<path d="M13 7h22a3 3 0 0 1 3 3v34L24 35 10 44V10a3 3 0 0 1 3-3Z"/><path d="m18 21 5 5 9-10"/>',
 tasks:'<rect x="8" y="9" width="32" height="32" rx="5"/><path d="m15 21 4 4 7-8m1 14h7M15 32h5"/>',
 events:'<rect x="7" y="12" width="34" height="30" rx="4"/><path d="M7 21h34M15 7v10M33 7v10m-18 12h7v6h-7z"/>',
 members:'<circle cx="19" cy="19" r="7"/><circle cx="34" cy="17" r="5"/><path d="M6 41v-5a13 13 0 0 1 26 0v5m1-17a12 12 0 0 1 9 12v4"/>',
 commitments:'<rect x="11" y="8" width="27" height="35" rx="4"/><path d="M18 8V5h13v3m-12 12h12m-12 8h12m-12 8h8"/><path d="m8 22 3 3 5-6"/>',
 documents:'<path d="M6 16V9a4 4 0 0 1 4-4h13l6 7h10a3 3 0 0 1 3 3v23a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V20Z"/><path d="M6 19h36M23 5v7h6"/>',
 expenses:'<rect x="5" y="13" width="38" height="28" rx="6"/><path d="M5 22h38m-30 9h9"/><circle cx="34" cy="32" r="4"/>',
 notices:'<path d="m9 23 26-12v26L9 26H5v-3Zm0 3 4 15h7l-3-12"/><path d="m39 18 5-4m-5 17 5 4"/>',
 reports:'<path d="M8 41V8m0 33h34"/><path d="m13 32 9-10 7 5 10-15"/><path d="M32 12h7v7"/>',
 support:'<path d="M8 11h32a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H21L11 45v-6H8a4 4 0 0 1-4-4V15a4 4 0 0 1 4-4Z"/><path d="M16 23h20m-20 8h13"/>',
 profile:'<circle cx="24" cy="17" r="9"/><path d="M8 44v-5c0-9 7-14 16-14s16 5 16 14v5"/>'
};
function makeVectorIcon(id){
 const ns="http://www.w3.org/2000/svg",svg=document.createElementNS(ns,"svg");
 svg.setAttribute("viewBox","0 0 48 48");svg.setAttribute("class","launcher-pictogram");
 svg.setAttribute("aria-hidden","true");svg.setAttribute("focusable","false");
 svg.innerHTML='<g fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">'+(iconPaths[id]||iconPaths.lessons)+'</g>';
 return svg;
}
function renderLauncher(){
  const root=document.getElementById("app-launcher");if(!root)return;
  root.replaceChildren();
  for(const [index,app] of launcherApps.entries()){
    const tile=el("button",null,"launcher-app");tile.style.setProperty("--launch-index",String(index));tile.type="button";tile.dataset.tool=app.id;
    const icon=el("span",null,"launcher-icon theme-"+app.theme);icon.append(makeVectorIcon(app.id));
    const label=el("strong",app.label),hint=el("small",app.hint);
    tile.append(icon,label,hint);
    tile.addEventListener("click",()=>{tile.classList.add("launcher-pressed");openLauncher(app.id)});root.append(tile);
  }
}

let quickSlideIndex=0;
const quickSlides=[
 {title:"یادگیری را آسان شروع کن",description:"اولین درس ناتمام را بخوان و پیشرفت را ثبت کن.",cta:"ادامه مطالعه",icon:"📖",run:()=>{const lesson=state.lessons.find(x=>!state.completed.includes(x.id));lesson?openLesson(lesson.id):setMain("lessons")}},
 {title:"آزمون و تمرین",description:"آزمون‌های منتشرشده را انجام بده و نتیجه بگیر.",cta:"شروع آزمون",icon:"✅",run:()=>setMain("quizzes")},
 {title:"کارها را منظم کن",description:"یک فضای کاری بساز و وظایف و جلسات را مدیریت کن.",cta:"ورود به مدیریت",icon:"📋",run:()=>setMain("workspace")}
];
function paintQuickSlide(){
 const host=document.getElementById("quick-slide"),dots=document.getElementById("quick-dots");if(!host||!dots)return;
 host.replaceChildren();dots.replaceChildren();const x=quickSlides[quickSlideIndex],body=el("div",null,"slide-body");
 body.append(el("h2",x.title),el("p",x.description),button(x.cta,x.run,"slide-action"));
 const art=el("span",x.icon,"slide-art");art.setAttribute("aria-hidden","true");host.append(body,art);
 quickSlides.forEach((slide,i)=>{const dot=button("",()=>{quickSlideIndex=i;paintQuickSlide()},"slide-dot"+(i===quickSlideIndex?" active":""));dot.setAttribute("aria-label","اسلاید "+(i+1));dots.append(dot)});
 host.classList.remove("slide-enter");void host.offsetWidth;host.classList.add("slide-enter");
}
function moveQuickSlide(n){quickSlideIndex=(quickSlideIndex+n+quickSlides.length)%quickSlides.length;paintQuickSlide()}
function showGettingStarted(){
 setMain("home");document.querySelector(".getting-started")?.remove();
 const root=el("section",null,"card getting-started");root.append(el("h3","شروع کار در ۳ قدم"));
 for(const [title,description,click,cta] of [
 ["۱. یک درس بخوان","به آموزش‌ها برو و یک درس را کامل کن.",()=>setMain("lessons"),"آموزش‌ها"],
 ["۲. آزمون بده","چند سؤال جواب بده و نتیجه را ببین.",()=>setMain("quizzes"),"آزمون‌ها"],
 ["۳. کارها را ثبت کن","یک فضای کاری ایجاد کن و اولین وظیفه را بنویس.",()=>setMain("workspace"),"مدیریت"]
 ]){const item=el("article",null,"guide-step");item.append(el("strong",title),el("p",description),button(cta,click,"action outline"));root.append(item)}
 root.append(button("بستن راهنما",()=>root.remove(),"action outline"));document.getElementById("app-launcher").before(root);root.scrollIntoView({block:"start",behavior:"smooth"});
}
async function openLegalLibrary(){
 setMain("profile");clear();content.append(el("div","در حال دریافت منابع و مقررات…","loading"));
 try{
  const data=await api("legalLibrary");clear();
  content.append(button("← بازگشت به پرونده",openCandidateProfile,"back"));
  const head=el("section",null,"card legal-intro");
  head.append(el("h3","مرکز قوانین و منابع انتخابات"),el("p","منابع مرتبط با نوع انتخابات شما در این بخش گردآوری می‌شوند. پیش از اقدام، متن و تاریخ اطلاعیه را در سایت رسمی بررسی کنید."));content.append(head);
  const items=data.resources||[];
  if(!items.length){
    const box=el("section",null,"card");
    box.append(el("h3","منبع تأییدشده‌ای هنوز منتشر نشده"),el("p","برای جلوگیری از اطلاعات اشتباه، لینک یا مهلت تأییدنشده به‌عنوان قانون قطعی نمایش داده نمی‌شود. ابتدا در پرونده، نوع انتخابات را ثبت کنید؛ منابع معتبر پس از بررسی مدیر اینجا ظاهر می‌شوند."));
    box.append(button("ویرایش نوع انتخابات",openCandidateProfile,"action"));content.append(box);return;
  }
  const topics={registration:"ثبت‌نام",documents:"مدارک",deadlines:"مهلت‌ها",finance:"مالی",general:"منابع عمومی"};
  const count=items.filter(x=>x.acknowledged).length;
  const overview=el("section",null,"card");
  overview.append(el("h3","مطالعه منابع"),el("p",count.toLocaleString("fa-IR")+" از "+items.length.toLocaleString("fa-IR")+" منبع مرور شده"));
  const track=el("div",null,"progress-track"),fill=el("div");fill.style.width=Math.round(count/items.length*100)+"%";track.append(fill);overview.append(track);content.append(overview);
  for(const item of items){
    const card=el("article",null,"card legal-source");
    card.append(el("strong",item.title),el("small",(topics[item.topic]||item.topic)+" • "+item.issuer));
    if(item.source_date)card.append(el("p","تاریخ منبع: "+item.source_date,"meta"));
    if(item.reviewed_at)card.append(el("p","تاریخ بررسی در برنامه: "+item.reviewed_at,"meta"));
    if(item.notes)card.append(el("p",item.notes));
    const link=button("بازکردن منبع",()=>{try{const u=new URL(item.source_url);if(u.protocol!=="https:")throw Error();window.open(u.href,"_blank","noopener,noreferrer")}catch{notify("آدرس منبع معتبر نیست.","error")}},"action outline");
    const toggle=button(item.acknowledged?"✓ مطالعه شده":"علامت‌گذاری به‌عنوان مطالعه‌شده",async()=>{
      toggle.disabled=true;
      try{await api("legalAcknowledge",{id:item.id,acknowledged:!Boolean(item.acknowledged)});await openLegalLibrary()}
      catch(e){notify(e.message,"error");toggle.disabled=false}
    },"action");
    card.append(link,toggle);content.append(card);
  }
 }catch(e){fail(e)}
}

const candidateGuides={
 profile:{why:"اطلاعات ثبت‌شده را بررسی کنید تا نوع انتخابات و حوزه فعالیت اشتباه نباشد.",steps:["نوع انتخابات و نام حوزه را با اطلاعات خودتان تطبیق دهید.","مرحله فعالیت و سوابق را مرور و در صورت نیاز اصلاح کنید.","نسخه نهایی را ذخیره کنید."],output:"پرونده شخصی دقیق و به‌روز"},
 official_rules:{why:"مقررات، بخشنامه‌ها و تاریخ‌های هر دوره ممکن است تغییر کنند.",steps:["مرکز قوانین و منابع را باز کنید.","آخرین اطلاعیه مرجع رسمی مرتبط با نوع انتخابات را پیدا کنید.","تاریخ، مرجع صادرکننده و اصلاحیه‌های احتمالی را کنترل کنید.","اگر منبعی در برنامه موجود نیست، بررسی را مستقیماً در مرجع رسمی ادامه دهید."],output:"منبع رسمیِ بررسی‌شده با تاریخ بررسی"},
 eligibility:{why:"شرایط و مدارک بسته به نوع و دوره انتخابات متفاوت است؛ این برنامه صلاحیت افراد را تأیید نمی‌کند.",steps:["نوع انتخابات و دوره مربوط را مشخص کنید.","فهرست شرایط و مدارک را فقط از مرجع رسمی همان انتخابات استخراج کنید.","مدارک خود را با فهرست رسمی تطبیق دهید.","ابهام‌ها را با مرجع مسئول یا کارشناس حقوقی بررسی کنید."],output:"فهرست مدارک موردنیاز و موارد نیازمند پیگیری"},
 timeline:{why:"از دست دادن مهلت‌ها می‌تواند باعث ناتمام ماندن کار اداری شود.",steps:["مهلت‌ها را از اطلاعیه رسمی همان دوره بخوانید.","تاریخ آغاز و پایان هر مرحله را در تقویم ثبت کنید.","برای هر مهلت مسئول پیگیری و زمان بازبینی تعیین کنید.","در صورت تغییر اطلاعیه، تاریخ ثبت‌شده را اصلاح کنید."],output:"تقویم دارای مهلت‌های تأییدشده"},
 security:{why:"اطلاعات پرونده و اعضای تیم باید فقط در دسترس افراد مجاز باشد.",steps:["ورود دومرحله‌ای تلگرام و امنیت دستگاه را بررسی کنید.","نقش و دسترسی اعضای فضای کاری را مرور کنید.","مجوز دسترسی افراد غیرضروری را غیرفعال کنید.","از فرستادن رمز و توکن در پیام‌ها خودداری کنید."],output:"فهرست دسترسی‌های بازبینی‌شده"},
 activity_plan:{why:"کارهای اجرایی وقتی قابل پیگیری‌اند که مسئول و وضعیت مشخص داشته باشند.",steps:["سه فعالیت ضروری و قانونی این هفته را مشخص کنید.","برای هر فعالیت یک وظیفه با عنوان واضح ایجاد کنید.","مسئول انجام و مهلت را تعیین کنید.","در پایان هفته وظایف تکمیل‌شده و باقی‌مانده را مرور کنید."],output:"برنامه کاری قابل پیگیری"}
};
const electionNames={council:"شوراهای شهر و روستا",parliament:"مجلس شورای اسلامی",presidency:"ریاست‌جمهوری",other:"سایر انتخابات"};
const stageNames={planning:"آماده‌سازی",registration:"ثبت‌نام و مدارک",operations:"فعالیت‌های مجاز",report:"گزارش و آرشیو"};
async function openCandidateProfile(editMode=false){
 setMain("profile");clear();
 content.append(el("div","در حال دریافت پرونده…","loading"));
 try{
  const r=await api("candidateProfile");clear();
  content.append(button("← بازگشت به پروفایل",()=>setMain("profile"),"back"));
  const profile=r.profile;
  if(profile&&!editMode){
   const card=el("section",null,"card candidate-summary");
   card.append(el("h3","پرونده هوشمند من"),el("p","پرونده شما ذخیره شده است. برای اصلاح اطلاعات از «ویرایش پرونده» استفاده کنید.","meta"));
   for(const [label,value] of [["نوع انتخابات",electionNames[profile.election_type]||"نامشخص"],["مرحله فعالیت",stageNames[profile.stage]||"نامشخص"],["حوزه فعالیت",profile.district],["سوابق و تخصص",profile.professional_summary||"ثبت نشده"]]){
    const row=el("div",null,"candidate-summary-row");row.append(el("small",label),el("strong",value));card.append(row);
   }
   card.append(button("✎ ویرایش پرونده",()=>openCandidateProfile(true),"action outline"));
   card.append(button("⚖️ قوانین و منابع مرتبط",openLegalLibrary,"action outline"));
   content.append(card);
  }else{
   const panel=el("section",null,"card candidate-profile");
   panel.append(el("h3",profile?"ویرایش پرونده کاندیدا":"ساخت پرونده هوشمند کاندیدا"),el("p","فقط اطلاعات ضروری را وارد کنید. این فرم برای ثبت برنامه شخصی است و تأیید صلاحیت قانونی محسوب نمی‌شود."));
   const controls={};
   for(const [key,label,options,current] of [
    ["electionType","نوع انتخابات",Object.entries(electionNames),profile?.election_type],
    ["stage","مرحله فعالیت",Object.entries(stageNames),profile?.stage]
   ]){
    const wrap=el("label",null,"candidate-field"),select=el("select",null,"op-select");wrap.append(el("span",label));
    for(const [value,name] of options){const option=el("option",name);option.value=value;select.append(option)}
    select.value=current||options[0][0];wrap.append(select);panel.append(wrap);controls[key]=select;
   }
   for(const [key,label,value] of [["district","حوزه فعالیت",profile?.district||""],["professionalSummary","توضیح کوتاه درباره سوابق و تخصص",profile?.professional_summary||""]]){
    const wrap=el("label",null,"candidate-field"),input=key==="district"?el("input"):el("textarea");
    input.value=value;input.maxLength=key==="district"?120:500;input.placeholder=key==="district"?"مثلاً نام شهر یا حوزه انتخابیه":"خلاصه تجربه و زمینه تخصصی";wrap.append(el("span",label),input);panel.append(wrap);controls[key]=input;
   }
   const save=button(profile?"ذخیره تغییرات پرونده":"ایجاد پرونده و چک‌لیست",async()=>{
    save.disabled=true;
    try{await api("saveCandidateProfile",{electionType:controls.electionType.value,stage:controls.stage.value,district:controls.district.value.trim(),professionalSummary:controls.professionalSummary.value.trim()});candidateHomeCache=null;notify("پرونده ذخیره شد.");await openCandidateProfile()}
    catch(e){notify(e.message,"error");save.disabled=false}
   },"action");
   panel.append(save);
   if(profile)panel.append(button("انصراف از ویرایش",()=>openCandidateProfile(),"action outline"));
   content.append(panel);
  }
  if(profile){
   const checklist=el("section",null,"card candidate-checklist"),items=r.checklist||[],done=items.filter(x=>x.status==="done").length;
   checklist.append(el("h3","راهنمای اقدام‌های پرونده"),el("p","روی «جزئیات و راهنما» بزنید، مراحل را بررسی کنید و سپس انجام‌شدن اقدام را ثبت کنید."));
   checklist.append(el("p",done.toLocaleString("fa-IR")+" از "+items.length.toLocaleString("fa-IR")+" مورد تکمیل شده","meta"));
   const track=el("div",null,"progress-track"),fill=el("div");fill.style.width=(items.length?done/items.length*100:0)+"%";track.append(fill);checklist.append(track);
   for(const item of items){
    const guide=candidateGuides[item.item_key]||{why:"این مورد را طبق رویه معتبر مربوط بررسی کنید.",steps:["شرح فعالیت را بررسی کنید.","مدارک یا خروجی مربوط را آماده کنید."],output:"نتیجه اقدام"};
    const details=el("details",null,"candidate-guide"),summary=el("summary",null,"candidate-guide-summary");
    summary.append(el("span",item.status==="done"?"✓":"○","candidate-guide-status"),el("strong",item.label),el("small","جزئیات و راهنما"));
    details.append(summary);
    const body=el("div",null,"candidate-guide-body");
    body.append(el("strong","چرا مهم است؟"),el("p",guide.why));
    body.append(el("strong","مراحل انجام"));
    const list=el("ol");for(const step of guide.steps)list.append(el("li",step));body.append(list);
    body.append(el("strong","خروجی مورد انتظار"),el("p",guide.output));
    if(item.item_key==="official_rules"||item.item_key==="eligibility")body.append(button("مشاهده مرکز قوانین",openLegalLibrary,"action outline"));
    const update=button(item.status==="done"?"بازگرداندن به انجام‌نشده":"تأیید می‌کنم این اقدام را انجام داده‌ام",async()=>{
     const next=item.status==="done"?"todo":"done";
     if(next==="done"&&!confirm("آیا این اقدام را مطابق راهنما انجام داده‌اید؟"))return;
     update.disabled=true;
     try{await api("updateCandidateChecklist",{itemKey:item.item_key,status:next});candidateHomeCache=null;notify("وضعیت اقدام ذخیره شد.");await openCandidateProfile()}
     catch(e){notify(e.message,"error");update.disabled=false}
    },"action");
    body.append(update);details.append(body);checklist.append(details);
   }
   checklist.append(el("p",r.note||"این موارد پیشنهادهای مدیریتی‌اند، نه الزامات قطعی قانونی.","meta"));
   checklist.append(button("انتقال اقدام‌های باقی‌مانده به وظایف تیم",async()=>{
    try{
     const w=await api("myWorkspaces"),spaces=(w.workspaces||[]).filter(x=>["owner","admin","editor"].includes(x.role));
     if(!spaces.length){notify("ابتدا از بخش مدیریت یک فضای کاری بسازید.","error");return}
     const selected=spaces[0];if(!confirm("اقدام‌های باقی‌مانده به فضای کاری «"+selected.name+"» اضافه شوند؟"))return;
     const summary=await api("workspaceSummary",{workspaceId:selected.id}),existing=new Set((summary.tasks||[]).map(t=>t.title));let added=0;
     for(const item of items.filter(x=>x.status!=="done")){
      const title="پرونده کاندیدا: "+item.label;if(existing.has(title))continue;
      await api("createTask",{workspaceId:selected.id,title,description:(candidateGuides[item.item_key]?.steps||[]).join(" | ").slice(0,1200),priority:"normal"});added++;
     }
     notify(added.toLocaleString("fa-IR")+" وظیفه اضافه شد.");
    }catch(e){notify(e.message,"error")}
   },"action outline"));
   content.append(checklist);
  }
 }catch(e){fail(e)}
}
let candidateHomeCache=null;
let candidateHomePending=null;
async function refreshCandidateHome(){
 const slot=document.getElementById("candidate-home-status");if(!slot)return;
 slot.replaceChildren();
 if(state.limitedAccess){const panel=el("div",null,"candidate-home-mini");panel.append(el("strong","پرونده نامزدی من"),el("p","از تلگرام وارد شوید تا پرونده شخصی و چک‌لیست قابل ذخیره داشته باشید."));slot.append(panel);return}
 try{
  const result=candidateHomeCache||(candidateHomePending||=api("candidateProfile").then(x=>{candidateHomeCache=x;return x}).finally(()=>{candidateHomePending=null}));
  const data=await result,p=data.profile,items=data.checklist||[];
  const panel=el("div",null,"candidate-home-mini");
  if(!p){panel.append(el("strong","پرونده نامزدی هنوز ساخته نشده"),el("p","نوع انتخابات و حوزه فعالیت را ثبت کنید تا کارهایتان مرتب شود."));panel.append(button("شروع پرونده شخصی",openCandidateProfile,"action"))}
  else{
    const done=items.filter(x=>x.status==="done").length;
    panel.append(el("strong","پرونده من • "+p.district),el("p",done.toLocaleString("fa-IR")+" از "+items.length.toLocaleString("fa-IR")+" اقدام پیشنهادی انجام شده"));
    const track=el("div",null,"progress-track"),bar=el("div");bar.style.width=(items.length?done/items.length*100:0)+"%";track.append(bar);panel.append(track,button("مشاهده و تکمیل",openCandidateProfile,"action outline"));
  }
  slot.append(panel);
 }catch(e){slot.replaceChildren()}
}
function renderHome(){document.getElementById("stat-lessons").textContent=state.lessons.length.toLocaleString("fa-IR");document.getElementById("stat-completed").textContent=state.completed.length.toLocaleString("fa-IR");document.getElementById("stat-quizzes").textContent=state.quizzes.length.toLocaleString("fa-IR");clear(featured);const matches=state.lessons.filter(x=>x.title.includes(searchTerm)||x.summary.includes(searchTerm)).slice(0,4);const list=el("div",null,"cards");for(const lesson of matches)list.append(card(lesson.title,lesson.summary,"مطالعه درس",()=>openLesson(lesson.id),lesson.position,state.completed.includes(lesson.id)));featured.append(matches.length?list:empty("موضوعی با این عبارت پیدا نشد."));renderResume();renderLauncher();paintQuickSlide();refreshCandidateHome()}
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
const readinessCard=el("article",null,"card");
readinessCard.append(el("h3","خودارزیابی آمادگی فردی"),el("p","۶ سؤال درباره مقررات، شفافیت، برنامه‌ریزی، امنیت و پاسخ‌گویی. امتیاز، خوداظهاری آموزشی است و نتیجه انتخابات را پیش‌بینی نمی‌کند."));
readinessCard.append(button("شروع خودارزیابی",openReadiness,"action"));
if(!state.limitedAccess)readinessCard.append(button("سوابق ارزیابی",showReadinessHistory,"action outline"));
section.append(readinessCard);
const assistantCard=el("article",null,"card");assistantCard.append(el("h3","دستیار آموزشی هوشمند"),el("p","پرسش‌های عمومی درباره آموزش، مدیریت، برنامه‌ریزی، امنیت و شفافیت را با کمک هوش مصنوعی بررسی کنید. حداکثر ۳ پرسش در روز."));
assistantCard.append(button("گفت‌وگو با دستیار آموزشی",openStudyAssistant,"action"));section.append(assistantCard);
if(state.attempts.length){for(const a of state.attempts.slice(0,10))section.append(card("نتیجه آزمون",a.score+" پاسخ درست از "+a.question_count+" سؤال",null,null))}content.append(section);return}
if(tab==="profile"){content.append(button("🗂️ پرونده هوشمند و چک‌لیست من",openCandidateProfile,"action"));const c=el("div",null,"card");c.append(el("h3",state.user?.name||"کاربر تلگرام"),el("p","شناسه ورود شما با امضای تلگرام تأیید می‌شود. اطلاعات هویتی حساس دریافت نمی‌کنیم."));c.append(el("p","درس‌های تکمیل‌شده: "+state.completed.length.toLocaleString("fa-IR")));if(state.user?.id){c.append(el("p","شناسه تلگرام شما: "+String(state.user.id)));c.append(button("کپی شناسه تلگرام",()=>GenCopyId(state.user.id),"action outline"))}content.append(c);
const saved=el("article",null,"card saved-lessons");saved.append(el("h3","درس‌های نشان‌شده"));
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
const support=el("section",null,"card support-center");support.append(el("h3","پشتیبانی و راهنمایی"),el("p","برای پیگیری سؤال فنی یا گزارش مشکل، درخواست پشتیبانی ثبت کنید."));
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
async function openLesson(id){setMain("lessons");clear();content.append(el("div","در حال بارگذاری…","loading"));try{const {lesson}=state.limitedAccess?await (await fetch("/api/lesson/"+id)).json():await api("lesson",{id});if(!lesson)throw Error("درس پیدا نشد.");clear();content.append(button("← بازگشت به آموزش‌ها",()=>setMain("lessons"),"back"));const c=el("article",null,"card");c.append(el("h3",lesson.title),el("p",lesson.summary),el("div",lesson.body,"body-text"));const done=state.completed.includes(id),mark=button(done?"✓ این درس تکمیل شده":"✓ پایان مطالعه و ثبت پیشرفت",async()=>{mark.disabled=true;try{await api("completeLesson",{id});if(!state.completed.includes(id))state.completed.push(id);mark.textContent="✓ این درس تکمیل شده";notify("پیشرفت مطالعه ثبت شد.");tg?.HapticFeedback?.notificationOccurred("success")}catch(e){mark.disabled=false;alert(e.message)}});mark.disabled=done||state.limitedAccess;if(state.limitedAccess)mark.textContent="ثبت پیشرفت نیازمند ورود معتبر تلگرام است";c.append(mark);
const isSaved=state.bookmarks.includes(id);
const bookmarkBtn=button(isSaved?"★ حذف از علاقه‌مندی‌ها":"☆ نشان‌کردن درس",async()=>{
 if(state.limitedAccess)return alert("برای ثبت علاقه‌مندی وارد تلگرام شوید.");
 bookmarkBtn.disabled=true;const newValue=!state.bookmarks.includes(id);
 try{await api("bookmark",{id,enabled:newValue});state.bookmarks=newValue?[...state.bookmarks,id]:state.bookmarks.filter(x=>x!==id);bookmarkBtn.textContent=newValue?"★ حذف از علاقه‌مندی‌ها":"☆ نشان‌کردن درس";notify(newValue?"درس به علاقه‌مندی‌ها اضافه شد.":"درس از علاقه‌مندی‌ها حذف شد.")}catch(e){alert(e.message)}finally{bookmarkBtn.disabled=false}
},"action outline");c.append(bookmarkBtn);
const noteLabel=el("h3","یادداشت شخصی من");c.append(noteLabel);
const notes=el("textarea",null,"notes-input");notes.placeholder="نکات مهمی که می‌خواهید به خاطر بسپارید…";notes.maxLength=2000;notes.rows=4;notes.disabled=state.limitedAccess;c.append(notes);
if(!state.limitedAccess){api("note",{id}).then(x=>{notes.value=x.note||""}).catch(()=>{notes.placeholder="بارگذاری یادداشت انجام نشد"});}
const save=button("ذخیره یادداشت",async()=>{save.disabled=true;try{await api("note",{id,note:notes.value});save.textContent="✓ ذخیره شد";notify("یادداشت خصوصی ذخیره شد.")}catch(e){alert(e.message)}finally{save.disabled=false}},"action outline");save.disabled=state.limitedAccess;c.append(save);
content.append(c)}catch(e){fail(e)}}
async function openStudyAssistant(){
 setMain("progress");clear();
 content.append(button("← بازگشت به پیشرفت",()=>setMain("progress"),"back"));
 const panel=el("section",null,"card");panel.append(el("h3","دستیار آموزشی هوشمند"),el("p","پرسش خود را درباره مفاهیم آموزشی و مسئولیت‌های عمومی بنویسید. پرسش‌ها در پایگاه داده ذخیره نمی‌شوند؛ برای پردازش به مدل Cloudflare ارسال خواهند شد."));
 const textarea=el("textarea",null,"notes-input");textarea.rows=5;textarea.placeholder="مثلاً: یک روش ساده برای مستندسازی و پیگیری وظایف تیم چیست؟";textarea.maxLength=600;textarea.minLength=5;
 const send=button("پرسیدن از دستیار",async()=>{
  if(textarea.value.trim().length<5)return alert("حداقل ۵ کاراکتر وارد کنید.");
  send.disabled=true;send.textContent="در حال دریافت پاسخ…";
  try{const result=await api("studyAssistant",{question:textarea.value.trim()});let old=panel.querySelector(".ai-answer");if(old)old.remove();
   const answer=el("div",null,"ai-answer");answer.append(el("h3","پاسخ دستیار"),el("p",result.answer),el("p",result.disclaimer||"پاسخ را با منابع معتبر بررسی کنید."),el("small","سهمیه باقی‌مانده امروز: "+(result.dailyRemaining??0).toLocaleString("fa-IR")));panel.append(answer);
  }catch(e){alert(e.message)}finally{send.disabled=false;send.textContent="پرسیدن از دستیار"}
 },"action");
 panel.append(textarea,send);content.append(panel);
}
async function openReadiness(){
 setMain("progress");clear();content.append(el("div","در حال دریافت پرسش‌ها…","loading"));
 try{
  const result=await api("readinessQuestions");const questions=result.questions||[];
  if(!questions.length)throw Error("پرسشنامه هنوز آماده نشده است.");
  let index=0;const answers=Array(questions.length).fill(null);
  function draw(){
   clear();content.append(button("← بازگشت به پیشرفت",()=>setMain("progress"),"back"));
   const pct=(index+1)/questions.length*100,track=el("div",null,"progress-track"),fill=el("div");fill.style.width=pct+"%";track.append(fill);
   content.append(el("p","پرسش "+(index+1).toLocaleString("fa-IR")+" از "+questions.length.toLocaleString("fa-IR"),"meta"),track);
   const q=questions[index],panel=el("section",null,"card quiz-question");panel.append(el("div",q.title,"quiz-topic"),el("h3",q.question));
   q.options.forEach((label,n)=>{
     const item=el("label",null,"option"),radio=el("input");radio.type="radio";radio.name="readiness";radio.value=String(n);radio.checked=answers[index]===n;
     radio.addEventListener("change",()=>{answers[index]=n;next.disabled=false});
     item.append(el("span",String.fromCharCode(65+n),"option-letter"),radio,document.createTextNode(label));panel.append(item);
   });
   content.append(panel);
   const nav=el("div",null,"quiz-actions");
   if(index>0)nav.append(button("قبلی",()=>{index--;draw()},"action outline"));
   const next=button(index===questions.length-1?"ثبت خودارزیابی":"سؤال بعدی",async()=>{
     if(answers[index]===null)return;
     if(index<questions.length-1){index++;draw();return}
     next.disabled=true;
     try{const report=await api("submitReadiness",{answers});clear();
       const c=el("section",null,"card");c.append(el("h3","نتیجه خودارزیابی"),el("p",report.score.toLocaleString("fa-IR")+" از "+report.maximum.toLocaleString("fa-IR")+" امتیاز"));
       for(const item of report.sections||[])c.append(el("p",item.category+": "+item.score.toLocaleString("fa-IR")+" امتیاز"));
       c.append(el("p",report.notice||"این یک ابزار خوداظهاری آموزشی است."));content.append(c,button("بازگشت به پیشرفت",()=>setMain("progress"),"action"));
     }catch(e){next.disabled=false;alert(e.message)}
   });next.disabled=answers[index]===null;nav.append(next);content.append(nav);
  }draw();
 }catch(e){fail(e)}
}
async function showReadinessHistory(){
 clear();content.append(el("div","در حال دریافت سوابق…","loading"));
 try{const r=await api("myReadiness");clear();content.append(button("← بازگشت به پیشرفت",()=>setMain("progress"),"back"));
 const list=el("section",null,"card");list.append(el("h3","سوابق خودارزیابی"));
 if(!r.results?.length)list.append(el("p","هنوز ارزیابی ثبت نشده است."));
 for(const x of r.results||[])list.append(el("p",x.submitted_at+" — "+x.score+" از "+x.max_score));
 content.append(list);
 }catch(e){fail(e)}
}
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
document.getElementById("quick-prev")?.addEventListener("click",()=>moveQuickSlide(-1));
document.getElementById("quick-next")?.addEventListener("click",()=>moveQuickSlide(1));
document.getElementById("guided-start")?.addEventListener("click",showGettingStarted);
const carousel=document.querySelector(".quick-carousel");
if(carousel){let x0=null;carousel.addEventListener("touchstart",e=>{x0=e.touches[0]?.clientX??null},{passive:true});carousel.addEventListener("touchend",e=>{if(x0===null)return;const dx=(e.changedTouches[0]?.clientX??x0)-x0;if(Math.abs(dx)>55)moveQuickSlide(dx>0?-1:1);x0=null},{passive:true})}
document.getElementById("search").addEventListener("input",e=>{searchTerm=e.target.value.trim();renderHome()});
setupUiControls();
home();