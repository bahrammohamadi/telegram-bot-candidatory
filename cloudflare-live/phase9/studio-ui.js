// Factual editorial templates only, not AI and never auto-publish.
const studioPanel=document.getElementById('studio-panel');
const studioForm=document.getElementById('studio-form');
const studioList=document.getElementById('studio-list');
const studioMessage=document.getElementById('studio-message');
const studioTypes={
 service_update:'گزارش وضعیت خدمات عمومی',
 meeting_notice:'اطلاعیه جلسه عمومی',
 fact_correction:'اصلاح یا تکمیل اطلاعات',
 civic_education:'نکته آموزشی شهروندی'
};
async function studioApi(action,payload={}){
 const r=await fetch('/api/studio',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData,action,...payload})});
 let data;try{data=await r.json()}catch{throw Error('پاسخ سرور معتبر نبود')}
 if(!r.ok)throw Error(data.error||'STUDIO_ERROR');return data;
}
function studioTemplate(){
 const kind=studioForm.elements.kind.value;
 const title=studioForm.elements.title.value.trim();
 const facts=document.getElementById('studio-facts').value.trim();
 const source=studioForm.elements.source_url.value.trim();
 if(title.length<3){studioMessage.textContent='ابتدا عنوان مشخصی وارد کن.';return}
 const label=studioTypes[kind]||'اطلاع‌رسانی عمومی';
 const shared='\n\nاطلاعات قابل استناد:\n'+(facts||'［اطلاعات تأییدشده و قابل استناد را تکمیل کنید］');
 const ending='\n\nمنبع: '+(source||'［منبع اطلاعات را پیش از انتشار بررسی و درج کنید］');
 const tails={
  service_update:'\n\nوضعیت فعلی: ［وضعیت واقعی را وارد کنید］\nاقدام بعدی: ［گام بعدی و مسئول پیگیری را در صورت تأیید وارد کنید］',
  meeting_notice:'\n\nزمان و محل: ［تاریخ، ساعت و محل قطعی را وارد کنید］\nموضوع و شیوه حضور: ［جزئیات تأییدشده را وارد کنید］',
  fact_correction:'\n\nاطلاعات قبلی: ［ادعای دقیق قبلی را مشخص کنید］\nاصلاحیه و شواهد: ［اصلاحیه مستند را وارد کنید］',
  civic_education:'\n\nتوضیح آموزشی: ［مفهوم را از منبع معتبر و رسمی توضیح دهید］\nدامنه و محدودیت: ［شرایط و استثناها را با منبع ذکر کنید］'
 };
 studioForm.elements.body.value=label+'\n'+title+shared+tails[kind]+ending;
 studioForm.elements.status.value='draft';
 studioMessage.textContent='قالب اولیه ساخته شد. موارد داخل کروشه را با اطلاعات واقعی و مستند جایگزین و متن را ویرایش کن.';
}
function studioNew(){
 studioForm.reset();document.getElementById('studio-edit-id').value='';
 document.getElementById('studio-facts').value='';
 document.getElementById('studio-save').textContent='ذخیره پیش‌نویس';
 studioMessage.textContent='فرم برای پیش‌نویس تازه آماده شد.';
}
function studioRender(items){
 studioList.replaceChildren();
 if(!items.length){const p=document.createElement('p');p.textContent='هنوز پیش‌نویسی ذخیره نشده است.';studioList.append(p);return}
 for(const item of items){
  const card=document.createElement('article');card.setAttribute('role','listitem');card.className='studio-card';
  const heading=document.createElement('strong');heading.textContent=item.title;
  const note=document.createElement('p');note.textContent=(studioTypes[item.kind]||'محتوا')+' | '+(item.status==='reviewed'?'بررسی‌شده توسط کاربر':'پیش‌نویس')+' | '+item.updated_at;
  const preview=document.createElement('p');preview.textContent=item.body.length>230?item.body.slice(0,230)+'…':item.body;
  const edit=document.createElement('button');edit.type='button';edit.textContent='ویرایش';edit.className='secondary';
  edit.addEventListener('click',()=>{
   studioForm.elements.kind.value=item.kind;
   studioForm.elements.title.value=item.title;
   studioForm.elements.source_url.value=item.source_url;
   studioForm.elements.body.value=item.body;
   studioForm.elements.status.value=item.status;
   document.getElementById('studio-facts').value='';
   document.getElementById('studio-edit-id').value=item.id;
   document.getElementById('studio-save').textContent='ذخیره تغییرات';
   studioMessage.textContent='پیش‌نویس برای ویرایش بارگذاری شد؛ ذخیره را بزن.';
   studioForm.scrollIntoView({behavior:'auto',block:'start'});
  });
  const del=document.createElement('button');del.type='button';del.textContent='حذف';del.className='secondary';
  del.addEventListener('click',async()=>{
   if(!confirm('این پیش‌نویس آزمایشی حذف شود؟'))return;
   del.disabled=true;
   try{await studioApi('delete',{id:item.id});if(document.getElementById('studio-edit-id').value===item.id)studioNew();await studioLoad();studioMessage.textContent='پیش‌نویس حذف شد.'}
   catch(e){studioMessage.textContent='حذف ناموفق: '+e.message}
   finally{del.disabled=false}
  });
  card.append(heading,note,preview,edit,del);studioList.append(card);
 }
}
async function studioLoad(){
 studioMessage.textContent='در حال دریافت پیش‌نویس‌ها...';
 try{const result=await studioApi('list');studioRender(result.drafts);studioMessage.textContent='پیش‌نویس‌های آزمایشی بارگذاری شدند.'}
 catch(e){studioMessage.textContent='دریافت پیش‌نویس‌ها ناموفق: '+e.message}
}
async function openStudio(){
 studioPanel.hidden=false;dashboard.querySelector('.modules').hidden=true;
 await studioLoad();
}
document.getElementById('studio-compose').addEventListener('click',studioTemplate);
document.getElementById('studio-reset').addEventListener('click',studioNew);
studioForm.addEventListener('submit',async e=>{
 e.preventDefault();
 const button=document.getElementById('studio-save');button.disabled=true;
 const data=Object.fromEntries(new FormData(studioForm));data.source_url=data.source_url.trim();
 const id=document.getElementById('studio-edit-id').value;
 try{
  await studioApi(id?'update':'create',{...data,...(id?{id}:{})});
  studioNew();await studioLoad();studioMessage.textContent='متن در پایگاه داده آزمایشی ذخیره شد؛ هیچ انتشار خودکاری انجام نشد.';
 }catch(error){studioMessage.textContent='ذخیره ناموفق: '+error.message}
 finally{button.disabled=false}
});
document.getElementById('studio-copy').addEventListener('click',async()=>{
 const body=studioForm.elements.body.value;
 if(!body.trim()){studioMessage.textContent='متنی برای کپی وارد نشده است.';return}
 try{await navigator.clipboard.writeText(body);studioMessage.textContent='متن پیش‌نویس کپی شد.'}
 catch{studioForm.elements.body.focus();studioForm.elements.body.select();studioMessage.textContent='متن انتخاب شد؛ از گزینه Copy دستگاه استفاده کن.'}
});
document.getElementById('studio-close').addEventListener('click',()=>{
 studioPanel.hidden=true;dashboard.querySelector('.modules').hidden=false;status('بازگشت به میزکار آزمایشی.');
});
