const quizPanel=document.getElementById('quiz-panel'),quizCatalog=document.getElementById('quiz-catalog'),quizForm=document.getElementById('quiz-form'),quizQuestions=document.getElementById('quiz-questions'),quizResult=document.getElementById('quiz-result'),quizHistory=document.getElementById('quiz-history'),quizStatus=document.getElementById('quiz-status');
let quizActive=null,quizBusy=false;
async function quizApi(action,payload={}){
 const r=await fetch('/api/quiz',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData,action,...payload})});
 let data;try{data=await r.json()}catch{throw Error('پاسخ سرور معتبر نیست')}
 if(!r.ok)throw Error(data.error||'QUIZ_ERROR');return data;
}
function quizElement(tag,textContent,className){
 const e=document.createElement(tag);if(textContent!==undefined)e.textContent=String(textContent);if(className)e.className=className;return e;
}
function quizClearResult(){
 quizResult.hidden=true;document.getElementById('quiz-feedback').replaceChildren();
}
async function quizLoad(){
 quizCatalog.replaceChildren();quizHistory.replaceChildren();
 quizStatus.textContent='در حال بارگذاری آزمون‌ها و سوابق...';
 try{
  const [catalog,history]=await Promise.all([quizApi('catalog'),quizApi('history')]);
  if(!catalog.quizzes.length)quizCatalog.append(quizElement('p','هنوز آزمون منتشرشده‌ای وجود ندارد.'));
  for(const item of catalog.quizzes){
   const card=quizElement('article');card.className='quiz-card';
   card.append(quizElement('strong',item.title),quizElement('p',item.description+' — '+item.question_count+' سؤال'));
   const button=quizElement('button','شروع آزمون');button.type='button';button.addEventListener('click',()=>quizStart(item.id));card.append(button);quizCatalog.append(card);
  }
  const completed=history.attempts.length;
  if(!completed)quizHistory.append(quizElement('p','هنوز آزمونی ثبت نکرده‌اید.'));
  for(const item of history.attempts){
   const card=quizElement('article');card.className='quiz-card';
   card.append(quizElement('strong',item.title),quizElement('p','نتیجه: '+item.score+' از '+item.question_count+' — '+item.submitted_at));
   const button=quizElement('button','مشاهده پاسخ‌های این نوبت');button.className='secondary';button.type='button';button.addEventListener('click',()=>quizReview(item.attempt_id));card.append(button);quizHistory.append(card);
  }
  quizStatus.textContent='آزمون‌ها و سوابق بارگذاری شدند. آخرین ۵۰ نتیجه نمایش داده می‌شود.';
 }catch(e){quizStatus.textContent='خطا در بارگذاری آزمون‌ها: '+e.message}
}
async function quizStart(quizId){
 if(quizBusy)return;quizBusy=true;quizStatus.textContent='در حال دریافت سؤال‌های آزمون...';
 try{
  const data=await quizApi('start',{quiz_id:quizId});
  quizActive={id:data.quiz.id,questions:data.questions};
  quizQuestions.replaceChildren();document.getElementById('quiz-form-title').textContent=data.quiz.title;
  for(const question of data.questions){
   const field=quizElement('fieldset');field.style.cssText='min-width:0;border:1px solid #96a3b2;border-radius:12px;padding:12px';
   const legend=quizElement('legend',question.position+'. '+question.prompt);field.append(legend);
   question.options.forEach((choice,index)=>{
    const label=quizElement('label');label.className='quiz-option';
    const input=document.createElement('input');input.type='radio';input.name='quiz-question-'+question.id;input.value=String(index);input.required=true;
    label.append(input,quizElement('span',choice));field.append(label);
   });
   quizQuestions.append(field);
  }
  quizForm.hidden=false;quizCatalog.hidden=true;quizClearResult();
  quizStatus.textContent='برای هر سؤال یک پاسخ انتخاب کن.';
 }catch(e){quizStatus.textContent='دریافت سؤال‌ها ناموفق: '+e.message}
 finally{quizBusy=false}
}
function quizDisplayFeedback(result){
 quizForm.hidden=true;quizCatalog.hidden=true;
 const label=quizElement('strong','امتیاز: '+result.score+' از '+result.question_count);
 const score=document.getElementById('quiz-score');score.replaceChildren(label);
 const list=document.getElementById('quiz-feedback');list.replaceChildren();
 for(const entry of result.feedback){
  const card=quizElement('article');card.className='quiz-card';
  card.append(quizElement('strong',entry.prompt));
  card.append(quizElement('p',entry.is_correct?'پاسخ شما درست بود.':'پاسخ شما نیاز به بازبینی دارد.'));
  card.append(quizElement('p','پاسخ درست: '+entry.correct_answer));
  if(entry.rationale)card.append(quizElement('p','توضیح آموزشی: '+entry.rationale));
  if(entry.source_url){
   try{
    const url=new URL(entry.source_url);
    if(url.protocol==='https:'&&['www.unesco.org','www.oecd.org','legalinstruments.oecd.org'].includes(url.hostname)){
     const a=quizElement('a','منبع آموزشی');a.href=url.href;a.target='_blank';a.rel='noopener noreferrer';card.append(a);
    }
   }catch{}
  }
  list.append(card);
 }
 quizResult.hidden=false;quizStatus.textContent='نتیجه از سرور دریافت شد؛ پاسخ‌های درست و منابع آموزشی قابل مشاهده‌اند.';
}
quizForm.addEventListener('submit',async e=>{
 e.preventDefault();if(!quizActive||quizBusy)return;
 const answers={};
 for(const question of quizActive.questions){
  const chosen=quizForm.querySelector('input[name="quiz-question-'+question.id+'"]:checked');
  if(!chosen){quizStatus.textContent='لطفاً همه سؤال‌ها را پاسخ بده.';return}
  answers[String(question.id)]=Number(chosen.value);
 }
 quizBusy=true;const btn=document.getElementById('quiz-submit');btn.disabled=true;quizStatus.textContent='در حال ثبت و محاسبه نتیجه در سرور...';
 try{
  const data=await quizApi('submit',{quiz_id:quizActive.id,answers});
  quizDisplayFeedback(data);await quizLoad();quizStatus.textContent='نتیجه ثبت شد و توضیح هر پاسخ در همین صفحه نمایش داده شده است.';
 }catch(error){quizStatus.textContent='ثبت آزمون ناموفق: '+error.message}
 finally{quizBusy=false;btn.disabled=false}
});
document.getElementById('quiz-cancel').addEventListener('click',()=>{quizForm.hidden=true;quizCatalog.hidden=false;quizActive=null;quizStatus.textContent='آزمون بدون ثبت نتیجه بسته شد.'});
document.getElementById('quiz-result-close').addEventListener('click',()=>{quizClearResult();quizActive=null;quizCatalog.hidden=false;quizStatus.textContent='می‌توانی آزمون دیگری را شروع کنی.'});
async function quizReview(attemptId){
 if(quizBusy)return;quizBusy=true;quizStatus.textContent='در حال بازیابی پاسخ‌های ثبت‌شده...';
 try{const data=await quizApi('review',{attempt_id:attemptId});quizDisplayFeedback(data)}
 catch(e){quizStatus.textContent='بازیابی نتیجه ناموفق: '+e.message}
 finally{quizBusy=false}
}
async function openQuiz(){
 practiceStop();practicePanel.hidden=true;quizPanel.hidden=false;quizForm.hidden=true;quizCatalog.hidden=false;quizClearResult();
 await quizLoad();
}
document.getElementById('quiz-close').addEventListener('click',()=>{
 quizPanel.hidden=true;quizForm.hidden=true;quizCatalog.hidden=false;quizClearResult();quizActive=null;practicePanel.hidden=false;
 status('بازگشت به تمرین و آمادگی.');
});
document.getElementById('open-quiz').addEventListener('click',openQuiz);
