/* Integration UI: routes reuse existing forms and authenticated API calls. */
(()=>{
 const home=document.getElementById('home-panel');
 const sections=[
 ['پرونده و اسناد',[['مشخصات و سوابق','candidate'],['مدارک تیم','documents'],['قوانین و منابع معتبر','legal']]],
 ['برنامه و وظایف',[['تقویم شخصی','calendar'],['برنامه عملیاتی','plans'],['وظایف تیم','tasks'],['جلسات تیم','events']]],
 ['دستیار هوشمند',[['پرسش از دستیار','ai'],['تحلیل اسناد','research'],['پشتیبانی','support']]],
 ['تمرین و آمادگی',[['آموزش‌ها','lessons'],['آزمون‌ها','quizzes'],['تمرین سخنرانی','speaking'],['پرسش و پاسخ','debate'],['تحلیل فن بیان','speechreview']]],
 ['گزارش عملکرد',[['پیشرفت من','progress'],['اهداف','goals'],['تصمیمات','decisions'],['گزارش تیم','reports']]],
 ['استودیوی محتوا',[['استودیوی خلاق','creative'],['قالب‌های کاری','templates'],['سفارش طراحی','designorders']]]
 ];
 const legacy=document.createElement('details');legacy.className='functional-legacy';
 const summary=document.createElement('summary');summary.textContent='امکانات تکمیلی';legacy.append(summary);
 for(const child of [...home.children])legacy.append(child);
 const shell=document.createElement('section');shell.className='functional-home';
 const title=document.createElement('h2');title.textContent='امروز از کجا شروع می‌کنید؟';shell.append(title);
 const note=document.createElement('p');note.textContent='ثبت اطلاعات و امکانات شخصی به ورود معتبر از تلگرام نیاز دارد.';shell.append(note);
 const grid=document.createElement('div');grid.className='functional-grid';shell.append(grid);
 const panel=document.createElement('section');panel.id='functional-section';panel.hidden=true;
 const heading=document.createElement('h3');heading.id='functional-heading';heading.tabIndex=-1;
 panel.setAttribute('aria-labelledby',heading.id);
 const rows=document.createElement('div');let origin;
 const close=button('بازگشت به بخش‌ها',()=>{panel.hidden=true;origin?.setAttribute('aria-expanded','false');origin?.focus()},'action outline');
 panel.append(heading,rows,close);shell.append(panel);
 for(const [label,items] of sections){
  const card=button(label,()=>{for(const b of grid.children)b.setAttribute('aria-expanded','false');origin=card;card.setAttribute('aria-expanded','true');heading.textContent=label;rows.replaceChildren();
   for(const [text,route] of items){const link=button(text,()=>openLauncher(route),'action outline');link.dataset.functionalRoute=route;rows.append(link)}
   panel.hidden=false;heading.focus();
  },'action outline');card.setAttribute('aria-controls',panel.id);card.setAttribute('aria-expanded','false');grid.append(card);
 }
 panel.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close.click()}});
 home.append(shell,legacy);
})();
