// Client UI never authorizes access: POST /api/tasks validates signed Telegram identity.
const tasksPanel=document.getElementById('tasks-panel');
const tasksForm=document.getElementById('tasks-form');
const tasksList=document.getElementById('tasks-list');
const tasksState=document.getElementById('tasks-state');
const tasksSummary=document.getElementById('tasks-summary');
const tasksFilter=document.getElementById('tasks-filter');
let taskItems=[],taskBusy=false;
const taskStatuses={open:'در انتظار انجام',doing:'در حال انجام',done:'انجام‌شده'};
const taskPriorities={low:'کم',normal:'معمولی',high:'زیاد'};
function taskUI(tag,content,className){
 const node=document.createElement(tag);
 if(content!==undefined)node.textContent=String(content);
 if(className)node.className=className;
 return node;
}
async function tasksApi(action,data={}){
 const response=await fetch('/api/tasks',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData,action,...data})});
 let result;try{result=await response.json()}catch{throw Error('پاسخ سرور معتبر نبود')}
 if(!response.ok){
  if(result.error==='TASK_QUOTA_LIMIT')throw Error('سقف ثبت وظایف در اشتراک آزمایشی تکمیل شده است.');
  if(result.error==='INVALID_TASK')throw Error('اطلاعات وظیفه معتبر نیست. عنوان، تاریخ و جزئیات را بررسی کنید.');
  throw Error(result.error||'TASKS_ERROR');
 }
 return result;
}
function tasksReset(){
 tasksForm.reset();document.getElementById('tasks-edit-id').value='';
 document.getElementById('tasks-save').textContent='ذخیره وظیفه';
}
function tasksShowList(){
 tasksList.replaceChildren();
 const filter=tasksFilter.value;
 const visible=taskItems.filter(t=>filter==='all'||(filter==='overdue'?Number(t.is_overdue)===1:t.status===filter));
 if(!visible.length){tasksList.append(taskUI('p','در این بخش وظیفه‌ای برای نمایش وجود ندارد.'));return}
 for(const t of visible){
  const card=taskUI('article',undefined,'task-card');card.setAttribute('role','listitem');
  card.append(taskUI('strong',t.title));
  card.append(taskUI('p','اولویت: '+(taskPriorities[t.priority]||t.priority)+' | وضعیت: '+(taskStatuses[t.status]||t.status)));
  if(t.details)card.append(taskUI('p',t.details));
  if(t.due_date)card.append(taskUI('p','مهلت: '+t.due_date+(Number(t.is_overdue)===1?' | عقب‌افتاده':''),Number(t.is_overdue)===1?'task-overdue':undefined));
  const actions=taskUI('div',undefined,'task-actions');
  const select=taskUI('select');select.setAttribute('aria-label','وضعیت '+t.title);
  for(const [value,label] of Object.entries(taskStatuses)){
   const option=taskUI('option',label);option.value=value;select.append(option);
  }
  select.value=t.status;
  select.addEventListener('change',async()=>{
   select.disabled=true;
   try{await tasksApi('status',{id:t.id,status:select.value});await tasksRefresh();tasksState.textContent='وضعیت وظیفه ثبت شد.'}
   catch(error){tasksState.textContent='تغییر وضعیت انجام نشد: '+error.message;select.value=t.status}
   finally{select.disabled=false}
  });
  const edit=taskUI('button','ویرایش');edit.type='button';edit.className='secondary';
  edit.addEventListener('click',()=>{
   tasksForm.elements.title.value=t.title;
   tasksForm.elements.details.value=t.details;
   tasksForm.elements.priority.value=t.priority;
   tasksForm.elements.due_date.value=t.due_date||'';
   document.getElementById('tasks-edit-id').value=t.id;
   document.getElementById('tasks-save').textContent='ذخیره تغییرات';
   tasksState.textContent='وظیفه برای ویرایش آماده شد.';
   tasksForm.scrollIntoView({behavior:'auto',block:'start'});
  });
  const remove=taskUI('button','حذف');remove.type='button';remove.className='secondary';
  remove.addEventListener('click',async()=>{
   if(!confirm('این وظیفه از محیط آزمایشی حذف شود؟'))return;
   remove.disabled=true;
   try{await tasksApi('delete',{id:t.id});if(document.getElementById('tasks-edit-id').value===t.id)tasksReset();await tasksRefresh();tasksState.textContent='وظیفه حذف شد.'}
   catch(error){tasksState.textContent='حذف ناموفق: '+error.message}
   finally{remove.disabled=false}
  });
  actions.append(select,edit,remove);
  card.append(actions);tasksList.append(card);
 }
}
async function tasksRefresh(){
 tasksState.textContent='در حال دریافت اطلاعات وظایف...';
 const [list,summary]=await Promise.all([tasksApi('list'),tasksApi('summary')]);
 taskItems=list.tasks;
 tasksSummary.replaceChildren();
 const metrics=[['کل',summary.summary.total],['باز',summary.summary.open],['در حال انجام',summary.summary.doing],['تکمیل‌شده',summary.summary.done],['عقب‌افتاده',summary.summary.overdue]];
 for(const [label,value] of metrics){
  const tile=taskUI('div',undefined,'task-metric');
  tile.append(taskUI('span',label),taskUI('strong',value));tasksSummary.append(tile);
 }
 tasksSummary.append(taskUI('p','سهمیه طرح '+(summary.plan==='professional'?'حرفه‌ای آزمایشی':'رایگان')+': '+summary.summary.total+' از '+summary.limit+' وظیفه | باقیمانده: '+summary.remaining,'task-quota'));
 tasksShowList();tasksState.textContent='وظایف به‌روز شدند.';
}
async function openTasks(){
 tasksPanel.hidden=false;dashboard.querySelector('.modules').hidden=true;
 try{await tasksRefresh()}catch(error){tasksState.textContent='دریافت وظایف ناموفق: '+error.message}
}
tasksForm.addEventListener('submit',async e=>{
 e.preventDefault();if(taskBusy)return;
 taskBusy=true;const save=document.getElementById('tasks-save');save.disabled=true;
 const data=Object.fromEntries(new FormData(tasksForm));
 const id=document.getElementById('tasks-edit-id').value;
 tasksState.textContent='در حال ثبت تغییرات...';
 try{
  await tasksApi(id?'update':'create',{...data,...(id?{id}:{})});
  tasksReset();await tasksRefresh();tasksState.textContent='وظیفه ذخیره شد.';
 }catch(error){tasksState.textContent='ثبت انجام نشد: '+error.message}
 finally{taskBusy=false;save.disabled=false}
});
document.getElementById('tasks-new').addEventListener('click',()=>{tasksReset();tasksState.textContent='فرم وظیفه جدید آماده شد.'});
document.getElementById('tasks-filter').addEventListener('change',tasksShowList);
document.getElementById('tasks-refresh').addEventListener('click',async()=>{try{await tasksRefresh()}catch(error){tasksState.textContent='بازخوانی ناموفق: '+error.message}});
document.getElementById('tasks-close').addEventListener('click',()=>{
 tasksPanel.hidden=true;dashboard.querySelector('.modules').hidden=false;status('بازگشت به میزکار آزمایشی.');
});
