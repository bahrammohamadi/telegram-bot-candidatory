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
  const head=el("article",null,"card");head.append(el("h3","فضاهای کاری"));
  if(opState.list.length){const select=el("select",null,"op-select");for(const w of opState.list){const opt=el("option",w.name+" — "+w.role);opt.value=w.id;opt.selected=w.id===opState.id;select.append(opt)}select.addEventListener("change",()=>{opState.id=select.value;renderWorkspace()});head.append(select)}
  head.append(detailsForm("＋ ایجاد فضای کاری",[["name","نام فضای کاری","text"],["jurisdiction","حوزه فعالیت","text"]],async x=>{await api("createWorkspace",x);opState.id=null;await renderWorkspace()}));
  content.append(head);
  if(r.platformAdmin){content.append(button("مدیریت محتوای آموزشی کل سامانه",showPlatformCms,"action"));content.append(button("فهرست فضاهای کاری",showPlatformSpaces,"action outline"));content.append(button("گزارش ادمین کل سامانه",async()=>{try{const p=await api("platformSummary");content.prepend(makeRow("آمار کل","کاربران: "+p.summary.users+" • فضاهای کاری: "+p.summary.workspaces))}catch(e){alert(e.message)}},"action outline"))}
  const ws=opState.record;
  if(!ws){content.append(empty("برای شروع، یک فضای کاری ایجاد کنید."));return}
  const role=ws.workspace.role,edit=["owner","admin","editor"].includes(role),manager=["owner","admin"].includes(role);
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
    content.append(card);
  }
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
