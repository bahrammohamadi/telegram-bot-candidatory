// Generated standalone Cloudflare Mini App bundle. Source assets in miniapp/web/.
const SITE_HTML="<!doctype html>\n<html lang=\"fa\" dir=\"rtl\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1,viewport-fit=cover\"><meta name=\"theme-color\" content=\"#14283d\"><title>کاندیداتوری هوشمند</title><link rel=\"stylesheet\" href=\"./style.css\"><script src=\"https://telegram.org/js/telegram-web-app.js\"></script><meta name=\"miniapp-api\" content=\"/\"></head>\n<body><main class=\"app\">\n<header><div class=\"brand\"><span class=\"mark\">ک</span><div><strong>کاندیداتوری هوشمند</strong><small>آموزش • تحلیل • پیشرفت</small></div></div><span class=\"pill\">مینی‌اپ</span></header>\n<section class=\"hero\"><div class=\"eyebrow\">مرکز آموزش کاندیداها</div><h1 id=\"greeting\">خوش آمدید</h1><p>مسیر آمادگی و آموزش خود را اینجا دنبال کنید.</p><div id=\"summary\" class=\"hero-summary\">در حال دریافت اطلاعات…</div></section>\n<nav class=\"tabs\" aria-label=\"بخش‌ها\"><button class=\"active\" data-tab=\"lessons\">آموزش‌ها</button><button data-tab=\"quizzes\">آزمون‌ها</button><button data-tab=\"history\">سوابق من</button></nav>\n<section id=\"content\" aria-live=\"polite\"><div class=\"loading\">در حال بارگذاری…</div></section>\n<footer>کاندیداتوری هوشمند • نسخه آزمایشی</footer>\n</main><script src=\"./app.js\" defer></script></body></html>";
const SITE_CSS=":root{font-family:Tahoma,\"Segoe UI\",sans-serif;color:#173043;background:#f4f7f7;font-synthesis:none}*{box-sizing:border-box}body{margin:0}.app{max-width:640px;margin:auto;min-height:100dvh;padding:calc(20px + env(safe-area-inset-top)) 16px calc(30px + env(safe-area-inset-bottom))}header,.brand{display:flex;align-items:center;gap:12px}header{justify-content:space-between;margin-bottom:20px}.brand strong{display:block;font-size:15px}.brand small{display:block;color:#82929d;font-size:11px;margin-top:5px}.mark{display:grid;place-items:center;width:43px;height:43px;border-radius:14px;background:#18364c;color:#fff;font-size:23px;font-weight:700}.pill{border-radius:30px;background:#e0ebe8;padding:7px 13px;font-size:11px;color:#2f6e62}.hero{background:linear-gradient(130deg,#173449,#275d61);padding:26px 22px;border-radius:24px;color:white;box-shadow:0 16px 30px #1a435229}.eyebrow{opacity:.7;font-size:11px}.hero h1{font-size:23px;margin:14px 0 9px}.hero p{font-size:12px;line-height:1.9;opacity:.85}.hero-summary{font-size:12px;border-top:1px solid #ffffff25;padding-top:14px;margin-top:19px}.tabs{display:flex;gap:8px;margin:22px 0 16px}.tabs button{flex:1;border:0;border-radius:13px;padding:13px 4px;background:white;color:#647986;font-weight:700;cursor:pointer}.tabs button.active{background:#17394a;color:white}.cards{display:grid;gap:12px}.card{background:white;border:1px solid #e5eeee;border-radius:18px;padding:19px;box-shadow:0 4px 14px #1c3e4808}.card h2{font-size:16px;margin:0 0 12px}.card p{font-size:13px;color:#607584;line-height:1.9;margin:0 0 13px}.meta{font-size:11px;color:#98a6ac}.action{border:0;border-radius:12px;background:#247367;color:white;padding:12px 19px;font-weight:bold;cursor:pointer}.action:disabled{opacity:.5}.back{border:0;background:transparent;color:#356d67;padding:9px 0 17px;font-weight:bold;cursor:pointer}.body-text{line-height:2.15;white-space:pre-line;font-size:14px}.option{display:block;padding:13px;margin:9px 0;border:1px solid #dce8e8;border-radius:12px;cursor:pointer}.option:has(input:checked){border-color:#247367;background:#eff8f5}.option input{margin-left:9px}.loading,.empty,.error{background:white;padding:25px 18px;border-radius:16px;text-align:center;color:#718590;line-height:2}.error{color:#a52d38}footer{text-align:center;color:#a4b0b7;font-size:11px;padding-top:35px}@media(prefers-color-scheme:dark){:root{color:#e1edec;background:#101e28}.card,.tabs button,.loading,.empty,.error{background:#1b303a;color:#e1edec;border-color:#29424b}.tabs button.active{background:#39756b}.card p{color:#b2c6ca}.option{border-color:#3f5b62}.option:has(input:checked){background:#274b47}}";
const SITE_JS="\"use strict\";\nconst tg=window.Telegram?.WebApp;tg?.ready();tg?.expand();\nconst initData=tg?.initData||\"\";\nconst endpoint=window.MINIAPP_API_URL||document.querySelector('meta[name=\"miniapp-api\"]')?.content||\"\";\nconst content=document.getElementById(\"content\"),summary=document.getElementById(\"summary\");\nlet state={lessons:[],quizzes:[],attempts:[]},tab=\"lessons\";\nfunction el(tag,text,cls){const x=document.createElement(tag);if(cls)x.className=cls;if(text!=null)x.textContent=String(text);return x}\nfunction clear(){content.replaceChildren()}\nfunction error(message){clear();content.append(el(\"div\",message,\"error\"))}\nfunction button(text,fn,cls=\"action\"){const b=el(\"button\",text,cls);b.type=\"button\";b.addEventListener(\"click\",fn);return b}\nasync function api(action,details={}){if(!initData)throw Error(\"این برنامه باید از داخل تلگرام باز شود.\");if(!endpoint)throw Error(\"آدرس API هنوز تنظیم نشده است.\");const r=await fetch(endpoint,{method:\"POST\",headers:{\"content-type\":\"application/json\"},body:JSON.stringify({action,initData,...details})});let data;try{data=await r.json()}catch{throw Error(\"پاسخ نامعتبر از سرور\")};if(!r.ok)throw Error(data.error||\"خطای ارتباط با سرور\");return data}\nasync function home(){try{const data=await api(\"home\");state=data;document.getElementById(\"greeting\").textContent=(data.user?.name?\"سلام، \"+data.user.name:\"خوش آمدید\");summary.textContent=`${state.lessons.length} آموزش • ${state.quizzes.length} آزمون • ${state.attempts.length} نتیجه ثبت‌شده`;render()}catch(e){error(e.message);summary.textContent=\"امکان اتصال وجود ندارد\"}}\nfunction render(){clear();document.querySelectorAll(\"[data-tab]\").forEach(b=>b.classList.toggle(\"active\",b.dataset.tab===tab));const list=el(\"div\",null,\"cards\");const items=tab===\"lessons\"?state.lessons:tab===\"quizzes\"?state.quizzes:state.attempts;if(!items.length){content.append(el(\"div\",\"هنوز محتوایی در این بخش منتشر نشده است.\",\"empty\"));return}for(const item of items){const card=el(\"article\",null,\"card\");const title=tab===\"history\"?\"نتیجه آزمون \"+item.quiz_id:item.title;card.append(el(\"h2\",title));const desc=tab===\"history\"?`${item.score} پاسخ درست از ${item.question_count} سؤال`:(item.summary||item.description||\"\");card.append(el(\"p\",desc));if(tab!==\"history\")card.append(button(tab===\"lessons\"?\"مطالعه درس\":\"شروع آزمون\",()=>tab===\"lessons\"?openLesson(item.id):openQuiz(item.id)));else card.append(el(\"small\",new Date(item.submitted_at).toLocaleString(\"fa-IR\"),\"meta\"));list.append(card)}content.append(list)}\nasync function openLesson(id){clear();content.append(el(\"div\",\"در حال بارگذاری…\",\"loading\"));try{const {lesson}=await api(\"lesson\",{id});if(!lesson)throw Error(\"درس یافت نشد\");clear();content.append(button(\"بازگشت\",render,\"back\"));const card=el(\"article\",null,\"card\");card.append(el(\"h2\",lesson.title));card.append(el(\"p\",lesson.summary));card.append(el(\"div\",lesson.body,\"body-text\"));content.append(card)}catch(e){error(e.message)}}\nasync function openQuiz(id){clear();content.append(el(\"div\",\"در حال بارگذاری…\",\"loading\"));try{const {quiz,questions}=await api(\"quiz\",{id});if(!questions?.length)throw Error(\"این آزمون هنوز سؤال ندارد.\");clear();content.append(button(\"بازگشت\",render,\"back\"));const form=el(\"form\",null,\"cards\");form.append(el(\"h2\",quiz.title));for(let i=0;i<questions.length;i++){let q=questions[i],card=el(\"section\",null,\"card\");card.append(el(\"h2\",`${i+1}. ${q.prompt}`));q.options.forEach((option,j)=>{const label=el(\"label\",null,\"option\"),input=el(\"input\");input.type=\"radio\";input.name=\"question-\"+i;input.value=String(j);label.append(input,document.createTextNode(String(option)));card.append(label)});form.append(card)}const submit=button(\"ثبت پاسخ و مشاهده نتیجه\",()=>{});submit.type=\"submit\";form.append(submit);form.addEventListener(\"submit\",async ev=>{ev.preventDefault();const answers=questions.map((_,i)=>{const value=form.querySelector('input[name=\"question-'+i+'\"]:checked');return value?Number(value.value):null});if(answers.some(a=>a===null)){alert(\"لطفاً به تمام سؤال‌ها پاسخ دهید.\");return}submit.disabled=true;try{const result=await api(\"submit\",{id,answers});clear();content.append(el(\"div\",`نتیجه شما: ${result.score} از ${result.total}`,\"card\"));content.append(button(\"بازگشت به داشبورد\",home))}catch(e){alert(e.message);submit.disabled=false}});content.append(form)}catch(e){error(e.message)}}\ndocument.querySelectorAll(\"[data-tab]\").forEach(b=>b.addEventListener(\"click\",()=>{tab=b.dataset.tab;render()}));\nhome();";
// Candidatory Telegram Mini App API — Cloudflare Workers + D1
// Telegram signed initData is authenticated on every request; no public D1 binding.
const enc = new TextEncoder();
function reply(value, status=200) { return new Response(JSON.stringify(value),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","access-control-allow-origin":"*","access-control-allow-methods":"POST, OPTIONS","access-control-allow-headers":"content-type"}}); }
async function verify(initData,token){
 if(!token) throw new Error("NOT_CONFIGURED");
 if(typeof initData!=="string"||initData.length>8192) throw new Error("UNAUTHORIZED");
 const p=new URLSearchParams(initData),hash=p.get("hash")||"", ts=Number(p.get("auth_date"));
 if(!/^[0-9a-f]{64}$/.test(hash)||!Number.isFinite(ts)||Math.abs(Date.now()/1000-ts)>3600) throw new Error("UNAUTHORIZED");
 const data=[...p.entries()].filter(([k])=>k!=="hash"&&k!=="signature").sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>k+"="+v).join("\n");
 const base=await crypto.subtle.importKey("raw",enc.encode("WebAppData"),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const secret=await crypto.subtle.sign("HMAC",base,enc.encode(token));
 const key=await crypto.subtle.importKey("raw",secret,{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const signed=new Uint8Array(await crypto.subtle.sign("HMAC",key,enc.encode(data)));
 const provided=new Uint8Array(hash.match(/../g).map(h=>parseInt(h,16)));
 let diff=0;for(let i=0;i<32;i++)diff|=signed[i]^provided[i];
 if(diff)throw new Error("UNAUTHORIZED");
 let user;try{user=JSON.parse(p.get("user")||"null")}catch{throw new Error("UNAUTHORIZED")}
 if(!user||!Number.isSafeInteger(user.id)||user.id<=0)throw new Error("UNAUTHORIZED");
 return user;
}
const validId=v=>Number.isSafeInteger(Number(v))&&Number(v)>0&&String(Number(v))===String(v);
const apiHandler = {
 async fetch(request,env){
  if(request.method==="OPTIONS")return reply({});
  if(request.method!=="POST")return reply({error:"Method not allowed"},405);
  if(Number(request.headers.get("content-length")||0)>16384)return reply({error:"Too large"},413);
  if(!env.DB)return reply({error:"Service not configured"},503);
  try{
   const payload=await request.json();
   const user=await verify(payload.initData,env.TELEGRAM_BOT_TOKEN);
   const id=user.id, bucket=Math.floor(Date.now()/60000);
   const rl=await env.DB.prepare("INSERT INTO request_limits(telegram_id,window_bucket,request_count) VALUES(?,?,1) ON CONFLICT(telegram_id,window_bucket) DO UPDATE SET request_count=request_count+1 RETURNING request_count").bind(id,bucket).first();
   if(rl.request_count>60)return reply({error:"Too many requests"},429);
   await env.DB.prepare("INSERT INTO candidate_users(telegram_id,display_name,username) VALUES(?,?,?) ON CONFLICT(telegram_id) DO UPDATE SET display_name=excluded.display_name,username=excluded.username,updated_at=CURRENT_TIMESTAMP").bind(id,String(user.first_name||"").slice(0,100),user.username||null).run();
   const action=payload.action;
   if(action==="home"){
    const [lessons,quizzes,attempts]=await Promise.all([
     env.DB.prepare("SELECT id,title,summary,position FROM lessons WHERE published=1 ORDER BY position,id LIMIT 100").all(),
     env.DB.prepare("SELECT id,title,description FROM quizzes WHERE published=1 ORDER BY id LIMIT 100").all(),
     env.DB.prepare("SELECT id,quiz_id,score,question_count,submitted_at FROM quiz_attempts WHERE telegram_id=? ORDER BY submitted_at DESC LIMIT 20").bind(id).all()
    ]);
    return reply({user:{id,name:String(user.first_name||"").slice(0,100)},lessons:lessons.results,quizzes:quizzes.results,attempts:attempts.results});
   }
   if(action==="lesson"){
    if(!validId(payload.id))return reply({error:"Invalid ID"},400);
    const lesson=await env.DB.prepare("SELECT id,title,summary,body FROM lessons WHERE published=1 AND id=?").bind(Number(payload.id)).first();
    return lesson?reply({lesson}):reply({error:"Not found"},404);
   }
   if(action==="quiz"){
    if(!validId(payload.id))return reply({error:"Invalid ID"},400);
    const q=await env.DB.prepare("SELECT id,title FROM quizzes WHERE published=1 AND id=?").bind(Number(payload.id)).first();
    if(!q)return reply({error:"Not found"},404);
    const rows=await env.DB.prepare("SELECT id,prompt,options_json,position FROM quiz_questions WHERE quiz_id=? ORDER BY position,id LIMIT 100").bind(q.id).all();
    return reply({quiz:q,questions:rows.results.map(({options_json,...r})=>({...r,options:JSON.parse(options_json)}))});
   }
   if(action==="submit"){
    if(!validId(payload.id)||!Array.isArray(payload.answers)||payload.answers.length>100||!payload.answers.every(a=>Number.isInteger(a)&&a>=0&&a<=7))return reply({error:"Invalid answers"},400);
    const q=await env.DB.prepare("SELECT id FROM quizzes WHERE published=1 AND id=?").bind(Number(payload.id)).first();
    if(!q)return reply({error:"Not found"},404);
    const rows=await env.DB.prepare("SELECT id,correct_index,options_json FROM quiz_questions WHERE quiz_id=? ORDER BY position,id LIMIT 100").bind(q.id).all();
    const questions=rows.results;
    if(!questions.length||questions.length!==payload.answers.length)return reply({error:"Incomplete submission"},400);
    if(!questions.every((x,i)=>payload.answers[i]<JSON.parse(x.options_json).length))return reply({error:"Invalid option"},400);
    const score=questions.reduce((v,x,i)=>v+(x.correct_index===payload.answers[i]?1:0),0);
    await env.DB.prepare("INSERT INTO quiz_attempts(id,quiz_id,telegram_id,answers_json,score,question_count) VALUES(?,?,?,?,?,?)").bind(crypto.randomUUID(),q.id,id,JSON.stringify(payload.answers),score,questions.length).run();
    return reply({score,total:questions.length});
   }
   return reply({error:"Unknown action"},400);
  }catch(e){
   if(e?.message==="UNAUTHORIZED")return reply({error:"Unauthorized"},401);
   if(e?.message==="NOT_CONFIGURED")return reply({error:"Telegram bot token not configured"},503);
   console.error("Candidatory API error",e?.name||"Error");
   return reply({error:"Internal error"},500);
  }
 }
};

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(request.method==="GET"){
      let body,kind;
      if(url.pathname==="/"||url.pathname==="/index.html"){body=SITE_HTML;kind="text/html; charset=utf-8";}
      else if(url.pathname==="/style.css"){body=SITE_CSS;kind="text/css; charset=utf-8";}
      else if(url.pathname==="/app.js"){body=SITE_JS;kind="text/javascript; charset=utf-8";}
      else return new Response("Not found",{status:404});
      return new Response(body,{headers:{"content-type":kind,"x-content-type-options":"nosniff","referrer-policy":"no-referrer","content-security-policy":"default-src 'none'; script-src 'self' https://telegram.org; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'self' https://web.telegram.org https://*.telegram.org; form-action 'none'","cache-control":url.pathname==="/"?"no-cache":"public, max-age=300"}});
    }
    return apiHandler.fetch(request,env);
  }
};