"use strict";
// Operational workspace UI; relies on shared app.js helpers and signed api().
let opState={list:[],id:null,record:null};
function makeRow(title,detail){const x=el("div",null,"op-row");x.append(el("strong",title),el("small",detail||""));return x}
function detailsForm(title,fields,send){const d=el("details",null,"op-details"),summary=el("summary",title),form=el("form",null,"op-form");d.append(summary);
const inputs={};
for(const [key,label,type,choices] of fields){const wrap=el("label",null,"op-field");wrap.append(el("span",label));let input;
if(type==="textarea"){input=el("textarea");input.rows=5;input.maxLength=12000}
else if(type==="select"){input=el("select");for(const [value,text] of choices){const opt=el("option",text);opt.value=value;input.append(opt)}}
else {input=el("input");input.type=type||"text"}
input.required=true;input.name=key;wrap.append(input);form.append(wrap);inputs[key]=input}
const save=button("ذخیره",()=>{});save.type="submit";form.append(save);
form.addEventListener("submit",async ev=>{ev.preventDefault();save.disabled=true;try{const values=Object.fromEntries(Object.entries(inputs).map(([k,v])=>[k,v.value]));await send(values);form.reset()}catch(e){alert(e.message)}finally{save.disabled=false}});
d.append(form);return d}
async function renderWorkspace(){
 clear();content.append(el("div","در حال دریافت اطلاعات مدیریتی…","loading"));
 if(state.limitedAccess){clear();content.append(empty("برای مدیریت، از داخل تلگرام وارد شوید."));return}
 try{
  const r=await api("myWorkspaces");opState.list=r.workspaces||[];
  if(!opState.list.some(x=>x.id===opState.id))opState.id=opState.list[0]?.id||null;
  opState.record=opState.id?await api("workspaceSummary",{workspaceId:opState.id}):null;
  clear();
  const pending=await api("myInvites");
  if(pending.invitations?.length){
    const invitations=el("article",null,"card");invitations.append(el("h3","دعوت‌های دریافتی"));
    for(const invite of pending.invitations){
      const line=makeRow(invite.name,"نقش: "+invite.role);
      line.append(button("پذیرش دعوت",async()=>{try{await api("acceptInvite",{invitationId:invite.id});await renderWorkspace()}catch(e){alert(e.message)}},"action"));
      invitations.append(line);
    }
    content.append(invitations);
  }
  const intro=el("section",null,"admin-intro");
  intro.append(el("div","مرکز فرماندهی","admin-overline"),el("h3","مدیریت کاندیداتوری هوشمند"),el("p","آموزش، برنامه‌ریزی، مسئولیت‌ها و گزارش‌ها در یک نگاه"));
  content.append(intro);
  const head=el("article",null,"card");head.append(el("h3","فضاهای کاری"));
  if(opState.list.length){const select=el("select",null,"op-select");for(const w of opState.list){const opt=el("option",w.name+" — "+w.role);opt.value=w.id;opt.selected=w.id===opState.id;select.append(opt)}select.addEventListener("change",()=>{opState.id=select.value;renderWorkspace()});head.append(select)}
  head.append(detailsForm("＋ ایجاد فضای کاری",[["name","نام فضای کاری","text"],["jurisdiction","حوزه فعالیت","text"]],async x=>{await api("createWorkspace",x);opState.id=null;await renderWorkspace()}));
  content.append(head);
  if(r.platformAdmin){
    try{
      const summary=await api("platformSummary");
      const stats=el("div",null,"admin-metrics");
      for(const [title,value,icon] of [["کاربران",summary.summary.users,"♙"],["فضاهای کاری",summary.summary.workspaces,"▦"],["درس‌های منتشرشده",summary.summary.lessons,"▤"]]){
        const item=el("div",null,"admin-metric");item.append(el("span",icon,"admin-metric-icon"),el("strong",Number(value).toLocaleString("fa-IR")),el("small",title));stats.append(item)}
      content.append(stats);
      const series=Array.from({length:7},(_,i)=>{const d=new Date();d.setUTCDate(d.getUTCDate()-(6-i));return d.toISOString().slice(0,10)});
      const counts=series.map(day=>(summary.audit||[]).filter(a=>String(a.created_at||"").slice(0,10)===day).length);
      const max=Math.max(1,...counts);
      const graph=el("section",null,"card admin-chart");
      graph.append(el("h3","فعالیت‌های مدیریتی ۷ روز اخیر"));
      const plot=el("div",null,"activity-chart");
      series.forEach((day,i)=>{const column=el("div",null,"activity-column");
        const wrapper=el("div",null,"activity-bar-wrap");
        const bar=el("div",null,"activity-bar");bar.style.height=Math.max(5,Math.round((counts[i]/max)*100))+"%";bar.title=counts[i].toLocaleString("fa-IR")+" تغییر ثبت‌شده";
        wrapper.append(bar);column.append(wrapper,el("small",new Date(day+"T12:00:00Z").toLocaleDateString("fa-IR",{weekday:"short",timeZone:"UTC"})));plot.append(column)});
      graph.append(plot,el("p","این نمودار از آخرین رویدادهای ثبت‌شده سامانه ساخته می‌شود؛ مجموع آن ممکن است با کل فعالیت‌ها متفاوت باشد."));
      content.append(graph);
    }catch(e){content.append(el("div","آمار مدیریتی دریافت نشد؛ سایر امکانات در دسترس‌اند.","empty"))}
    const tools=el("div",null,"admin-tools");
    for(const [title,detail,symbol,fn] of [
      ["مدیریت درس‌ها","ایجاد و انتشار","▤",showPlatformCms],
      ["بانک آزمون","سؤال و ارزیابی","▣",showPlatformQuizzes],
      ["فضاهای کاری","مدیریت تیم‌ها","▦",showPlatformSpaces],
      ["آمار سامانه","گزارش کلی","▥",async()=>{const r=await api("platformSummary");const c=el("section",null,"card");c.append(el("h3","آمار سامانه"));for(const [k,v] of [["کاربران",r.summary.users],["فضاهای کاری",r.summary.workspaces],["درس‌های منتشرشده",r.summary.lessons]])c.append(makeRow(k,Number(v).toLocaleString("fa-IR")));content.prepend(c)}]
    ]){const tile=button("",()=>Promise.resolve(fn()).catch(e=>alert(e.message)),"admin-tool");tile.append(el("span",symbol,"admin-tool-icon"),el("strong",title),el("small",detail));tools.append(tile)}
    content.append(el("h3","ابزارهای مدیر سامانه","admin-section-title"),tools);content.append(button("درخواست‌های حریم خصوصی کاربران",showPrivacyAdmin,"action outline"));content.append(button("مرکز پشتیبانی کاربران",showAdminSupport,"action outline"));content.append(button("مدیریت بسته‌ها و دسترسی‌ها",showPlanAdmin,"action outline"));
  }
  if(r.platformAdmin){content.append(button("مدیریت محتوای آموزشی کل سامانه",showPlatformCms,"action"));content.append(button("مدیریت بانک آزمون‌ها",showPlatformQuizzes,"action outline"));content.append(button("فهرست فضاهای کاری",showPlatformSpaces,"action outline"));content.append(button("گزارش ادمین کل سامانه",async()=>{try{const p=await api("platformSummary");content.prepend(makeRow("آمار کل","کاربران: "+p.summary.users+" • فضاهای کاری: "+p.summary.workspaces))}catch(e){alert(e.message)}},"action outline"))}
  const ws=opState.record;
  if(!ws){content.append(empty("برای شروع، یک فضای کاری ایجاد کنید."));return}
  try{const entitlement=await api("workspacePlan",{workspaceId:opState.id});
    const plan=el("article",null,"card");plan.append(el("h3","بسته خدمات فعلی"),makeRow(entitlement.plan.name,"حداکثر "+entitlement.plan.max_members.toLocaleString("fa-IR")+" عضو فعال"));content.append(plan);
  }catch(e){content.append(el("p","بسته خدمات در دسترس نیست.","meta"))}
  const role=ws.workspace.role,edit=["owner","admin","editor"].includes(role),manager=["owner","admin"].includes(role);
  const overview=el("div",null,"admin-metrics");
  for(const [label,val,sym] of [["وظایف",ws.tasks.length,"✓"],["رویدادها",ws.events.length,"▣"],["تعهدات",ws.commitments.length,"▤"]]){const item=el("div",null,"admin-metric");item.append(el("span",sym,"admin-metric-icon"),el("strong",val.toLocaleString("fa-IR")),el("small",label));overview.append(item)}
  content.append(overview);
  const report=el("section",null,"card report-card");report.append(el("h3","گزارش وضعیت فضای کاری"));
  const done=(ws.tasks||[]).filter(x=>x.status==="done").length;
  report.append(makeRow("پیشرفت وظایف",(ws.tasks.length?Math.round(done/ws.tasks.length*100):0).toLocaleString("fa-IR")+"٪ — "+done+" از "+ws.tasks.length));const track=el("div",null,"progress-track"),fill=el("div");fill.style.width=(ws.tasks.length?Math.round(done/ws.tasks.length*100):0)+"%";track.append(fill);report.append(track);
  report.append(makeRow("جلسات ثبت‌شده",String(ws.events.length)));
  report.append(makeRow("تعهدات تکمیل‌شده",String(ws.commitments.filter(x=>x.status==="completed").length)+" از "+ws.commitments.length));
  if(["owner","admin"].includes(ws.workspace.role)){
    const amount=ws.expenses.reduce((v,x)=>v+Number(x.amount_minor||0),0);
    report.append(makeRow("جمع هزینه‌های ثبت‌شده",amount.toLocaleString("fa-IR")+" ریال"));
  }
  report.append(button("دریافت گزارش JSON",()=>{
    const safe={workspace:ws.workspace,generatedAt:new Date().toISOString(),tasks:ws.tasks,events:ws.events,commitments:ws.commitments};
    if(["owner","admin"].includes(ws.workspace.role))safe.expenses=ws.expenses;
    const blob=new Blob([JSON.stringify(safe,null,2)],{type:"application/json;charset=utf-8"});
    const link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download="candidatory-report.json";link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);
  },"action outline"));
  const csvButton=button("خروجی CSV وظایف",()=>{
    const rows=[["شناسه","عنوان","وضعیت","اولویت","مهلت","تاریخ ایجاد"],...(ws.tasks||[]).map(t=>[t.id,t.title,t.status,t.priority,t.due_date||"",t.created_at||""])];
    saveCSV(rows,"candidatory-tasks.csv");
  },"action outline");report.append(csvButton);
  if(["owner","admin"].includes(ws.workspace.role))report.append(button("خروجی CSV هزینه‌ها",()=>{
    const rows=[["شرح","مبلغ ریال","دسته","تاریخ"],...(ws.expenses||[]).map(e=>[e.description,e.amount_minor,e.category,e.spent_at])];
    saveCSV(rows,"candidatory-expenses.csv");
  },"action outline"));
  content.append(report);
  const blocks=[["وظایف",ws.tasks,"createTask",[["title","عنوان","text"],["description","توضیح","text"],["priority","اولویت","select",[["normal","عادی"],["high","بالا"],["low","پایین"]]]]],
  ["جلسات",ws.events,"createEvent",[["title","عنوان","text"],["startsAt","زمان","datetime-local"],["location","مکان","text"]]],
  ["تعهدات عمومی",ws.commitments,"createCommitment",[["title","عنوان","text"],["description","شرح","text"]]],
  ["ثبت هزینه‌ها",ws.expenses,"createExpense",[["description","شرح هزینه","text"],["amountMinor","مبلغ به ریال","number"],["spentAt","تاریخ میلادی","date"]]]];
  for(const [heading,rows,action,fields] of blocks){
    const card=el("section",null,"card");card.append(el("h3",heading));
    if(!rows?.length)card.append(el("p","موردی ثبت نشده است."));
    else for(const item of rows){const label=item.title||item.description||"",detail=item.status||item.starts_at||(item.amount_minor!=null?Number(item.amount_minor).toLocaleString("fa-IR")+" ریال":"");
      const row=makeRow(label,detail);if(action==="createTask"&&edit){const change=el("select",null,"op-select");for(const [code,title] of [["todo","انجام‌نشده"],["doing","در جریان"],["done","تکمیل"]]){const o=el("option",title);o.value=code;o.selected=item.status===code;change.append(o)}change.addEventListener("change",async()=>{try{await api("taskStatus",{workspaceId:opState.id,id:item.id,status:change.value});await renderWorkspace()}catch(e){alert(e.message)}});row.append(change)}card.append(row)}
    if(edit&&(action!=="createExpense"||manager))card.append(detailsForm("＋ افزودن",fields,async x=>{const input={...x,workspaceId:opState.id};if(action==="createExpense")input.amountMinor=Number(x.amountMinor);await api(action,input);await renderWorkspace()}));
    if(action==="createEvent" && (ws.events||[]).length)card.append(button("افزودن جلسات به تقویم (ICS)",()=>downloadCalendar(ws.events),"action outline"));
    content.append(card);
  }
  const library=el("section",null,"card");library.append(el("h3","کتابخانه اسناد و مدارک"));
  if(!ws.documents?.length)library.append(el("p","هنوز سندی ثبت نشده است."));
  for(const doc of ws.documents||[]){const row=makeRow(doc.title,doc.category+" • "+(doc.visibility==="managers"?"فقط مدیران":"اعضای تیم"));
    const open=button("مشاهده سند",()=>{try{const url=new URL(doc.source_url);if(url.protocol==="https:")window.open(url.href,"_blank","noopener,noreferrer")}catch{alert("لینک نامعتبر است")}},"action outline");row.append(open);
    if(manager)row.append(button("حذف پیوند",async()=>{if(!confirm("پیوند این سند حذف شود؟"))return;try{await api("deleteDocument",{workspaceId:opState.id,id:doc.id});await renderWorkspace()}catch(e){alert(e.message)}},"action outline"));
    library.append(row)}
  if(edit)library.append(detailsForm("＋ ثبت لینک سند",[["title","عنوان سند","text"],["category","گروه سند","text"],["sourceUrl","آدرس امن HTTPS","url"],["visibility","دسترسی","select",manager?[["members","اعضا"],["managers","فقط مدیران"]]:[["members","اعضا"]]]],async x=>{await api("createDocument",{workspaceId:opState.id,...x});await renderWorkspace()}));
  content.append(library);
  const notices=el("section",null,"card");notices.append(el("h3","اطلاعیه‌های داخلی"));
  if(!ws.notices?.length)notices.append(el("p","اطلاعیه‌ای ثبت نشده است."));
  for(const item of ws.notices||[])notices.append(makeRow(item.title,item.body));
  if(manager)notices.append(detailsForm("＋ اطلاعیه جدید",[["title","عنوان اطلاعیه","text"],["body","متن اطلاعیه","textarea"]],async x=>{await api("createNotice",{workspaceId:opState.id,...x});await renderWorkspace()}));
  content.append(notices);
  const docs=el("section",null,"card");docs.append(el("h3","محتوا و گردش تأیید"));
  if(!ws.drafts?.length)docs.append(el("p","هیچ پیش‌نویسی ثبت نشده است."));
  for(const draft of ws.drafts||[]){const row=makeRow(draft.title,draft.status+" — "+(draft.body||"").slice(0,85));
    if(edit){const sel=el("select",null,"op-select");for(const [value,label] of [["draft","پیش‌نویس"],["review","نیازمند بررسی"],["approved","تأییدشده"],["rejected","ردشده"]]){if(!manager&&["approved","rejected"].includes(value))continue;const opt=el("option",label);opt.value=value;opt.selected=draft.status===value;sel.append(opt)}
    sel.addEventListener("change",async()=>{try{await api("draftStatus",{workspaceId:opState.id,id:draft.id,status:sel.value});await renderWorkspace()}catch(e){alert(e.message)}});row.append(sel)}
    docs.append(row)}
  if(edit)docs.append(detailsForm("＋ مطلب جدید",[["title","عنوان مطلب","text"],["body","متن مطلب","text"]],async x=>{await api("createDraft",{workspaceId:opState.id,...x});await renderWorkspace()}));
  content.append(docs);
  if(manager){
    const members=el("section",null,"card");members.append(el("h3","اعضای تیم"));
    for(const member of ws.members||[])members.append(makeRow(member.display_name||String(member.telegram_id),member.role+" / "+member.status));
    members.append(detailsForm("＋ ارسال دعوت برای عضو ثبت‌شده",[["telegramId","شناسه عددی تلگرام","number"],["role","نقش","select",[["member","عضو"],["editor","ویرایشگر"],["admin","مدیر"],["auditor","بازرس"]]]],async x=>{await api("addMember",{workspaceId:opState.id,telegramId:Number(x.telegramId),role:x.role});await renderWorkspace()}));
    content.append(members);
    content.append(button("نمایش گزارش فعالیت‌ها",async()=>{try{const r=await api("auditTrail",{workspaceId:opState.id});const audit=el("article",null,"card");audit.append(el("h3","سوابق تغییرات"));for(const a of r.audit||[])audit.append(makeRow(a.action+" • "+a.record_type,a.created_at));content.append(audit)}catch(e){alert(e.message)}},"action outline"));
  }
 }catch(e){clear();content.append(el("div",e.message,"error"))}
}

async function showPlatformSpaces(){
 try{const r=await api("adminWorkspaces");clear();content.append(button("← مدیریت",renderWorkspace,"back"));
 const box=el("article",null,"card");box.append(el("h3","فهرست فضاهای کاری"));
 for(const w of r.workspaces||[])box.append(makeRow(w.name,w.jurisdiction+" • "+w.status));
 content.append(box);
 }catch(e){alert(e.message)}
}
async function showPlatformCms(){
 clear();content.append(el("div","در حال دریافت آموزش‌ها…","loading"));
 try{const data=await api("adminLessons");clear();content.append(button("← بازگشت",renderWorkspace,"back"));
 const panel=el("section",null,"card");panel.append(el("h3","مرکز مدیریت آموزش‌ها"));
 panel.append(detailsForm("＋ درس جدید",[["title","عنوان","text"],["summary","معرفی کوتاه","text"],["body","متن درس","textarea"],["position","ترتیب نمایش","number"]],async v=>{
 await api("adminSaveLesson",{title:v.title,summary:v.summary,body:v.body,position:Number(v.position)});await showPlatformCms()}));
 for(const lesson of data.lessons||[]){
  const row=makeRow(lesson.title,lesson.published?"منتشرشده":"پیش‌نویس");
  const publish=button(lesson.published?"توقف انتشار":"انتشار",async()=>{try{await api("adminPublishLesson",{id:lesson.id,published:!lesson.published});await showPlatformCms()}catch(e){alert(e.message)}},"action outline");row.append(publish);
  const edit=detailsForm("✎ ویرایش درس",[["title","عنوان","text"],["summary","خلاصه","text"],["body","محتوا","textarea"],["position","ترتیب","number"]],async v=>{
   await api("adminSaveLesson",{id:lesson.id,title:v.title,summary:v.summary,body:v.body,position:Number(v.position)});await showPlatformCms()});
  const inputs=edit.querySelectorAll("[name]");for(const input of inputs){if(input.name==="title")input.value=lesson.title;else if(input.name==="summary")input.value=lesson.summary;else if(input.name==="body")input.value=lesson.body;else if(input.name==="position")input.value=lesson.position}
  row.append(edit);panel.append(row);
 }
 content.append(panel);
 }catch(e){clear();content.append(el("div",e.message,"error"))}
}

async function showPlatformQuizzes(){
 clear();content.append(el("div","در حال دریافت آزمون‌ها…","loading"));
 try{const result=await api("adminLessons");clear();content.append(button("← بازگشت",renderWorkspace,"back"));
 const box=el("section",null,"card");box.append(el("h3","مدیریت بانک آزمون‌ها"));
 box.append(detailsForm("＋ ساخت آزمون",[["title","عنوان آزمون","text"],["description","شرح","text"]],async values=>{await api("adminCreateQuiz",values);await showPlatformQuizzes()}));
 for(const quiz of result.quizzes||[]){
  const row=makeRow(quiz.title,quiz.published?"منتشر شده":"پیش‌نویس");
  row.append(button(quiz.published?"توقف انتشار":"انتشار",async()=>{try{await api("adminPublishQuiz",{id:quiz.id,published:!quiz.published});await showPlatformQuizzes()}catch(e){alert(e.message)}},"action outline"));
  if(!quiz.published)row.append(detailsForm("＋ افزودن سؤال",[["prompt","متن سؤال","textarea"],["options","گزینه‌ها؛ هر گزینه یک خط","textarea"],["correct","شماره گزینه صحیح (از ۱)","number"]],async values=>{
    const options=values.options.split("\n").map(x=>x.trim()).filter(Boolean);
    await api("adminAddQuestion",{quizId:quiz.id,prompt:values.prompt,options,correctIndex:Number(values.correct)-1});
    await showPlatformQuizzes();
  }));
  box.append(row);
 }
 content.append(box);
 }catch(e){clear();content.append(el("div",e.message,"error"))}
}

async function showPrivacyAdmin(){
  clear();content.append(el("div","در حال بارگذاری درخواست‌ها…","loading"));
  try{
    const result=await api("adminPrivacyQueue");
    clear();content.append(button("← بازگشت به مدیریت",renderWorkspace,"back"));
    const card=el("section",null,"card");card.append(el("h3","درخواست‌های حریم خصوصی"));
    if(!result.requests?.length)card.append(el("p","درخواستی ثبت نشده است."));
    for(const req of result.requests||[]){
      const row=makeRow(req.request_type+" — "+req.telegram_id,req.status+" · "+req.created_at);
      const select=el("select",null,"op-select");
      for(const [value,label] of [["pending","در انتظار"],["reviewing","در بررسی"],["rejected","ردشده"]]){
        const opt=el("option",label);opt.value=value;opt.selected=value===req.status;select.append(opt)}
      select.addEventListener("change",async()=>{try{await api("adminPrivacyStatus",{requestId:req.id,status:select.value});await showPrivacyAdmin()}catch(e){alert(e.message)}});
      row.append(select);card.append(row);
    }
    content.append(card);
  }catch(e){clear();content.append(el("div",e.message,"error"))}
}

function saveCSV(rows,filename){
  const escape=value=>{let s=String(value??"");if(/^[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
  const csv="\uFEFF"+rows.map(row=>row.map(escape).join(",")).join("\r\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

async function showAdminSupport(){
 clear();content.append(el("div","در حال بارگذاری پشتیبانی…","loading"));
 try{
  const result=await api("adminSupportQueue");clear();content.append(button("← بازگشت به مدیریت",renderWorkspace,"back"));
  const panel=el("section",null,"card");panel.append(el("h3","درخواست‌های پشتیبانی"));
  if(!result.tickets?.length)panel.append(el("p","درخواستی ثبت نشده است."));
  for(const item of result.tickets||[]){
   const row=makeRow(item.subject,"شناسه کاربر: "+item.telegram_id+" • "+item.status);
   row.append(el("p",item.message));
   const response=el("textarea",null,"notes-input");response.rows=3;response.value=item.admin_reply||"";response.placeholder="پاسخ پشتیبانی";response.maxLength=3000;row.append(response);
   const select=el("select",null,"op-select");
   for(const [value,title] of [["open","باز"],["reviewing","در بررسی"],["resolved","پاسخ داده‌شده"],["closed","بسته"]]){
    const option=el("option",title);option.value=value;option.selected=value===item.status;select.append(option)
   }
   row.append(select,button("ثبت پاسخ",async()=>{try{await api("adminReplyTicket",{ticketId:item.id,status:select.value,reply:response.value});await showAdminSupport()}catch(e){alert(e.message)}},"action"));
   panel.append(row);
  }
  content.append(panel);
 }catch(e){clear();content.append(el("div",e.message,"error"))}
}

async function showPlanAdmin(){
 clear();content.append(el("div","در حال دریافت بسته‌ها…","loading"));
 try{
  const [result,ws]=await Promise.all([api("adminEntitlements"),api("adminWorkspaces")]);
  clear();content.append(button("← بازگشت به مدیریت",renderWorkspace,"back"));
  const box=el("section",null,"card");box.append(el("h3","بسته‌ها و دسترسی‌ها"),el("p","تعیین بسته صرفاً سطح دسترسی است و پرداخت خودکار یا خرید فعال نیست."));
  for(const plan of result.plans||[])box.append(makeRow(plan.name,"سقف اعضا: "+Number(plan.max_members).toLocaleString("fa-IR")+" • "+plan.description));
  if(ws.workspaces?.length){
   const fields=[["workspaceId","فضای کاری","select",ws.workspaces.map(x=>[x.id,x.name])],
   ["planId","انتخاب بسته","select",result.plans.map(x=>[x.id,x.name])]];
   box.append(detailsForm("＋ تخصیص بسته به فضای کاری",fields,async values=>{
      await api("adminAssignPlan",{workspaceId:values.workspaceId,planId:values.planId});await showPlanAdmin();
   }));
  }
  const assigned=el("section",null,"card");assigned.append(el("h3","بسته‌های تخصیص داده‌شده"));
  for(const item of result.entitlements||[])assigned.append(makeRow(item.workspace_name,item.plan_id));
  content.append(box,assigned);
 }catch(e){clear();content.append(el("div",e.message,"error"))}
}

function downloadCalendar(events){
 const safe=value=>String(value||"").replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\r?\n/g,"\\n");
 const toUTC=str=>{const date=new Date(str);return Number.isNaN(date.getTime())?null:date.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z")};
 const dateStamp=toUTC(new Date().toISOString());
 const lines=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Candidatory//Calendar//FA","CALSCALE:GREGORIAN"];
 for(const evt of events){const start=toUTC(evt.starts_at);if(!start)continue;
  lines.push("BEGIN:VEVENT","UID:"+safe(evt.id)+"@candidatory.local","DTSTAMP:"+dateStamp,"DTSTART:"+start,"SUMMARY:"+safe(evt.title),"LOCATION:"+safe(evt.location),"DESCRIPTION:"+safe(evt.description),"END:VEVENT");
 }
 lines.push("END:VCALENDAR");
 const blob=new Blob([lines.join("\r\n")+"\r\n"],{type:"text/calendar;charset=utf-8"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="candidatory-events.ics";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
