// Phase 13: neutral civic administration helper. AI calls are opt-in, OFF by default.
// No private profile data, Telegram ID, raw messages or generated answers are stored in usage ledger.
const ASSISTANT_TASKS=Object.freeze({
  agenda:{name:'دستور جلسه خدمات عمومی',steps:['هدف جلسه و نتیجه مورد انتظار را در یک جمله تعریف کنید.','موضوع‌های قابل بررسی را با زمان‌بندی و مسئول هر مورد فهرست کنید.','برای هر مصوبه، مسئول پیگیری، مهلت و راه گزارش پیشرفت ثبت کنید.','صورت‌جلسه را برای بازبینی و تایید مشارکت‌کنندگان آماده کنید.']},
  project:{name:'گزارش پیشرفت یک پروژه',steps:['عنوان پروژه، مرجع داده و تاریخ گزارش را مشخص کنید.','وضعیت برنامه‌ریزی‌شده و واقعی را با اعداد دارای منبع مقایسه کنید.','موانع و اقدامات اصلاحی را بدون نتیجه‌گیری بدون سند بیان کنید.','گام بعدی، مسئول و زمان بازبینی را ثبت کنید.']},
  verification:{name:'بررسی یک ادعای عمومی',steps:['ادعای دقیق و قابل سنجش را از برداشت شخصی جدا کنید.','منبع اولیه، تاریخ، روش جمع‌آوری و زمینه خبر را بررسی کنید.','با منبع مستقل دوم یا متن رسمی مقابله کنید.','اگر مدرک کافی نیست، نتیجه را «تأییدنشده» بنویسید.']},
  learning:{name:'برنامه آموزش و تمرین',steps:['یک مهارت قابل سنجش و سطح فعلی را مشخص کنید.','سه تمرین کوتاه با زمان مشخص و منابع آموزشی معتبر انتخاب کنید.','پیشرفت را با نمونه قابل بررسی یا خودارزیابی شفاف ثبت کنید.','پس از بازبینی، یک بهبود مشخص برای نوبت بعد تعیین کنید.']},
  citizen:{name:'پیگیری درخواست‌های عمومی',steps:['درخواست را بدون ثبت اطلاعات خصوصی غیرضروری دسته‌بندی کنید.','مسئول رسیدگی، شماره پیگیری و مهلت پاسخ را مشخص کنید.','وضعیت اقدام را با تاریخ و مستندات قابل ارائه به‌روز کنید.','اگر نتیجه قطعی نیست، عدم قطعیت و گام بعدی را صریح اعلام کنید.']}
});
const ASSISTANT_MODEL='@cf/meta/llama-3.1-8b-instruct-fp8-fast';
const assistantReply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const assistantToday=()=>new Date().toISOString().slice(0,10);
async function assistantUsage(db,uid){
 const day=assistantToday();
 const [self,global]=await Promise.all([
  db.prepare('SELECT COUNT(*) AS n FROM assistant_usage_v1 WHERE telegram_id=? AND day_utc=?').bind(uid,day).first(),
  db.prepare('SELECT COUNT(*) AS n FROM assistant_usage_v1 WHERE day_utc=?').bind(day).first()
 ]);
 return {self:Number(self?.n||0),global:Number(global?.n||0),day};
}
function assistantPII(text){
 return /[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?\d[\s()-]?){10,}|(?:https?:\/\/|t\.me\/)/i.test(text);
}
export async function handleAssistant(db,user,body,env){
 const aiEnabled=env.AI_ENABLED==='true'&&!!env.AI&&typeof env.AI.run==='function';
 const task=ASSISTANT_TASKS[body?.task];
 const action=body?.action;
 if(action==='status'){
  const plan=await effectiveDemoPlan(db,user.id);
  const usage=await assistantUsage(db,user.id);
  const limit=plan==='professional'?6:2;
  return assistantReply({ok:true,ai_available:aiEnabled,mode:aiEnabled?'ai_opt_in':'guided_only',plan,used_today:usage.self,remaining_today:Math.max(0,limit-usage.self),daily_user_limit:limit,daily_global_limit:20,ai_model:aiEnabled?ASSISTANT_MODEL:null,storing_messages:false,real_payments_enabled:false});
 }
 if(action==='guide'){
  if(!task)return assistantReply({error:'INVALID_TASK'},400);
  const clean=typeof body.topic==='string'?body.topic.trim():'';
  if(clean.length>180)return assistantReply({error:'TOPIC_TOO_LONG'},400);
  return assistantReply({ok:true,engine:'static_guidance_no_ai',title:task.name,topic:clean||null,steps:task.steps,source_note:'این چک‌لیست راهنمای عمومی است؛ اطلاعات و قوانین را از منابع معتبر بررسی کنید.'});
 }
 if(action!=='ask')return assistantReply({error:'UNKNOWN_ACTION'},400);
 if(!aiEnabled)return assistantReply({error:'AI_NOT_ENABLED',message:'مدل هوش مصنوعی در محیط آزمایشی هنوز فعال نشده است؛ راهنمای بدون هزینه API قابل استفاده است.'},503);
 if(!task||typeof body.question!=='string'||body.question.trim().length<10||body.question.length>700||assistantPII(body.question))return assistantReply({error:'INVALID_OR_PRIVATE_INPUT'},400);
 const plan=await effectiveDemoPlan(db,user.id),limit=plan==='professional'?6:2;
 const usage=await assistantUsage(db,user.id);
 if(usage.self>=limit||usage.global>=20)return assistantReply({error:'AI_DAILY_LIMIT',remaining_today:0},429);
 const id=crypto.randomUUID();
 try{
  await db.batch([
   db.prepare('INSERT INTO candidate_users(telegram_id,display_name,username) VALUES(?,?,?) ON CONFLICT(telegram_id) DO NOTHING').bind(user.id,user.name,user.username),
   db.prepare("INSERT INTO assistant_usage_v1(id,telegram_id,day_utc,mode) VALUES(?,?,?,'ai')").bind(id,user.id,usage.day)
  ]);
 }catch{return assistantReply({error:'AI_DAILY_LIMIT_OR_DB_ERROR'},429)}
 try{
  const result=await env.AI.run(ASSISTANT_MODEL,{
   messages:[
    {role:'system',content:'شما راهنمای آموزشی و مدیریتی بی‌طرف فارسی هستید. تنها درباره مدیریت جلسات عمومی، ثبت و گزارش فعالیت‌ها، سواد رسانه‌ای، پیگیری خدمات عمومی و برنامه تمرین پاسخ بده. برای ادعاهای قابل بررسی منبع رسمی درخواست کن؛ قانون، شماره، مهلت، رأی یا خبر را بدون منبع نساز. درباره تبلیغات سیاسی شخصی‌سازی‌شده، هدف‌گیری رأی‌دهندگان یا دستکاری نظر گروه‌های خاص راهنمایی نده. از کاربر داده شخصی و اطلاعات محرمانه نخواه. پاسخ حداکثر ۲۵۰ واژه فارسی و با گام‌های عملی کوتاه باشد.'},
    {role:'user',content:'نوع درخواست: '+task.name+'\nپرسش عمومی: '+body.question.trim()}
   ],max_tokens:360,temperature:0.2
  });
  const answer=typeof result?.response==='string'?result.response.trim():'';
  if(!answer||answer.length>6000)return assistantReply({error:'AI_RESPONSE_INVALID'},502);
  return assistantReply({ok:true,engine:'cloudflare_workers_ai',answer,usage_recorded:true,caveat:'پاسخ مدل ممکن است خطا داشته باشد؛ پیش از استفاده عمومی، مطالب و منابع را بررسی کنید.'});
 }catch{
  return assistantReply({error:'AI_PROVIDER_UNAVAILABLE',message:'پاسخ مدل فعلاً در دسترس نیست؛ تلاش ناموفق در سهمیه روزانه ثبت شده است.'},503);
 }
}
