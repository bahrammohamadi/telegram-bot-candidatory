/* Six candidate sections. Private actions remain protected by the preview API. */
(()=>{
 const home=document.querySelector('.candidate-home-v2'),root=document.getElementById('home-panel');if(!home)return;
 const legacy=home.querySelector('.candidate-legacy'),container=document.createElement('div');container.className='candidate-legacy-content';legacy.append(container);
 for(const child of [...root.children])if(child!==home)container.append(child);
 legacy.querySelector('summary').textContent='امکانات تکمیلی و پیش‌نمایش مدیریت';
 const panel=document.getElementById('candidate-section-detail'),heading=document.getElementById('candidate-section-heading'),intro=document.getElementById('candidate-section-intro'),links=document.getElementById('candidate-section-links'),feedback=document.getElementById('candidate-v2-feedback'),close=document.getElementById('candidate-section-close');
 panel.setAttribute('role','region');panel.setAttribute('aria-labelledby',heading.id);heading.tabIndex=-1;close.textContent='بازگشت به بخش‌ها';
 const sections={
 profile:{title:'پرونده و اسناد',note:'ثبت و ویرایش به حساب آزمایشی احرازشده نیاز دارد؛ اطلاعات شخصی در این پیش‌نمایش دریافت نمی‌شود.',items:[['مشخصات و سوابق'],['مدارک و اسناد'],['وضعیت تکمیل پرونده']]},
 workspace:{title:'برنامه و وظایف',note:'ثبت برنامه‌های شخصی پس از فعال‌شدن ورود آزمایشی در دسترس قرار می‌گیرد.',items:[['تقویم و جلسات'],['فهرست وظایف'],['پیگیری فعالیت‌ها']]},
 assistant:{title:'دستیار هوشمند',note:'پاسخ هوش مصنوعی و منابع اختصاصی در این نسخه فعال نیستند.',items:[['پرسش از دستیار'],['قوانین و منابع معتبر'],['مشاهده راهنمای شروع','guide']]},
 quizzes:{title:'تمرین و آمادگی',note:'فهرست‌های نمونه قابل مشاهده‌اند؛ شرکت در آزمون و ثبت نتیجه به ورود آزمایشی نیاز دارد.',items:[['فهرست آموزش‌های نمونه','lessons'],['فهرست آزمون‌های نمونه','quizzes'],['تمرین سخنرانی'],['تمرین پرسش و پاسخ'],['تحلیل فن بیان']]},
 progress:{title:'گزارش عملکرد',note:'گزارش نمونه فقط داده‌های ساختگی را نشان می‌دهد و گزارش شخصی شما نیست.',items:[['مشاهده گزارش نمونه','dashboard'],['اهداف و پیشرفت شخصی'],['تصمیمات و گزارش‌های من']]},
 studio:{title:'استودیوی محتوا',note:'تولید و ذخیره محتوا پس از اتصال حساب آزمایشی و سرویس‌های مربوط فعال می‌شود.',items:[['طرح و پوستر'],['متن و سناریو'],['آرشیو محتوا']]}
 };
 const icons={profile:'M3 7h6l2-3h10v16H3z',workspace:'M5 5h14v16H5zM8 2v6M16 2v6M5 10h14M8 14h2M14 14h2',assistant:'M5 6h14v12H8l-3 3zM9 11h.01M15 11h.01',quizzes:'M9 4a3 3 0 0 1 6 0v8a3 3 0 0 1-6 0zM5 11v1a7 7 0 0 0 14 0v-1M12 19v3M8 22h8',progress:'M4 3v18h17M8 17v-5M13 17V8M18 17V5',studio:'m4 16 12-12 4 4L8 20H4zM13 7l4 4'};
 const buttons=[...home.querySelectorAll('[data-candidate-target]')];let origin=null;
 function closePanel(focus=true){panel.hidden=true;buttons.forEach(b=>b.setAttribute('aria-expanded','false'));if(focus)origin?.focus();}
 function route(target){
 if(target==='guide'){document.getElementById('first-visit-guide').dispatchEvent(new Event('candidate:guide'));return;}
 if(target==='dashboard'){legacy.open=true;const d=document.getElementById('staging-dashboard');d.tabIndex=-1;d.focus();d.scrollIntoView({block:'start',behavior:'auto'});return;}
 closePanel(false);document.querySelector('.bottom-nav [data-tab="'+target+'"]').click();
 }
 for(const b of buttons){
 const key=b.dataset.candidateTarget,svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),p=document.createElementNS(svg.namespaceURI,'path');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');p.setAttribute('d',icons[key]);svg.append(p);b.querySelector('span').replaceChildren(svg);
 b.setAttribute('aria-controls',panel.id);b.setAttribute('aria-expanded','false');
 b.addEventListener('click',()=>{
 const s=sections[key];origin=b;buttons.forEach(x=>x.setAttribute('aria-expanded',String(x===b)));heading.textContent=s.title;intro.textContent=s.note;feedback.textContent=s.note;links.replaceChildren();
 for(const [label,target] of s.items){const row=document.createElement(target?'button':'div'),title=document.createElement('strong'),status=document.createElement('small');row.className='candidate-section-item';title.textContent=label;status.textContent=target?'مشاهده ←':'در این پیش‌نمایش غیرفعال';row.append(title,status);if(target){row.type='button';row.dataset.candidateRoute=target;row.addEventListener('click',()=>route(target));}else row.dataset.unavailable='true';links.append(row);}
 panel.hidden=false;heading.focus({preventScroll:true});panel.scrollIntoView({block:'nearest',behavior:'auto'});
 });}
 close.addEventListener('click',()=>closePanel());panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closePanel();}});
 document.querySelector('.bottom-nav [data-tab="home"]').addEventListener('click',()=>closePanel(false));
 document.querySelector('.candidate-hero p').textContent='بخش موردنیازت را انتخاب کن؛ وضعیت هر ابزار مشخص است.';
 document.querySelector('[data-candidate-target="quizzes"] small').textContent='آموزش، سخنرانی و ارزیابی';
 document.querySelector('[data-candidate-target="progress"] small').textContent='گزارش نمونه و مسیر پیشرفت';
 feedback.textContent='این نسخه برای بررسی مسیرهاست؛ ثبت اطلاعات شخصی هنوز فعال نیست.';
})();
