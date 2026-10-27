"use strict";
// Operational workspace UI; relies on shared app.js helpers and signed api().
let opState={list:[],id:null,record:null};
function makeRow(title,detail){const x=el("div",null,"op-row");x.append(el("strong",title),el("small",detail||""));return x}
function detailsForm(title,fields,send){const d=el("details",null,"op-details"),summary=el("summary",title),form=el("form",null,"op-form");d.append(summary);
const inputs={};
for(const [key,label,type,choices] of fields){const wrap=el("label",null,"op-field");wrap.append(el("span",label));let input;
if(type==="select"){input=el("select");for(const [value,text] of choices){const opt=el("option",text);opt.value=value;input.append(opt)}}
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
  const head=el("article",null,"card");head.append(el("h3","فضاهای کاری"));
  if(opState.list.length){const select=el("select",null,"op-select");for(const w of opState.list){const opt=el("option",w.name+" — "+w.role);opt.value=w.id;opt.selected=w.id===opState.id;select.append(opt)}select.addEventListener("change",()=>{opState.id=select.value;renderWorkspace()});head.append(select)}
  head.append(detailsForm("＋ ایجاد فضای کاری",[["name","نام فضای کاری","text"],["jurisdiction","حوزه فعالیت","text"]],async x=>{await api("createWorkspace",x);opState.id=null;await renderWorkspace()}));
  content.append(head);
  if(r.platformAdmin){content.append(button("گزارش ادمین کل سامانه",async()=>{try{const p=await api("platformSummary");content.prepend(makeRow("آمار کل","کاربران: "+p.summary.users+" • فضاهای کاری: "+p.summary.workspaces))}catch(e){alert(e.message)}},"action outline"))}
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
  if(manager){
    const members=el("section",null,"card");members.append(el("h3","اعضای تیم"));
    for(const member of ws.members||[])members.append(makeRow(member.display_name||String(member.telegram_id),member.role+" / "+member.status));
    members.append(detailsForm("＋ افزودن عضو ثبت‌شده",[["telegramId","شناسه عددی تلگرام","number"],["role","نقش","select",[["member","عضو"],["editor","ویرایشگر"],["admin","مدیر"],["auditor","بازرس"]]]],async x=>{await api("addMember",{workspaceId:opState.id,telegramId:Number(x.telegramId),role:x.role});await renderWorkspace()}));
    content.append(members);
    content.append(button("نمایش گزارش فعالیت‌ها",async()=>{try{const r=await api("auditTrail",{workspaceId:opState.id});const audit=el("article",null,"card");audit.append(el("h3","سوابق تغییرات"));for(const a of r.audit||[])audit.append(makeRow(a.action+" • "+a.record_type,a.created_at));content.append(audit)}catch(e){alert(e.message)}},"action outline"));
  }
 }catch(e){clear();content.append(el("div",e.message,"error"))}
}
