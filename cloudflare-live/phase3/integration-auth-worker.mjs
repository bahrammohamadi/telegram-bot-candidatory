const TEST_PAGE="<!doctype html><html lang=\"fa\" dir=\"rtl\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1,viewport-fit=cover\"><meta name=\"color-scheme\" content=\"light dark\"><title>آزمایش پرونده کاندیداتوری</title><style>:root{font-family:Tahoma,Arial,sans-serif;color-scheme:light dark}body{margin:0;padding:24px 14px;background:var(--tg-theme-bg-color,#f5f6f8);color:var(--tg-theme-text-color,#172536)}main{max-width:530px;margin:auto}h1{font-size:21px}p{line-height:1.9}[hidden]{display:none!important}form{display:grid;gap:13px}label{display:grid;gap:6px;font-weight:bold;font-size:14px}input,textarea,select,button{font:inherit;box-sizing:border-box;min-height:46px;border-radius:12px;border:1px solid #96a3b2;padding:10px;background:var(--tg-theme-secondary-bg-color,#fff);color:var(--tg-theme-text-color,#172536);width:100%}textarea{min-height:95px}button{background:#24554c;color:#fff;font-weight:bold;border:0}button:disabled{opacity:.55}#msg{padding:14px;border-radius:10px;background:var(--tg-theme-secondary-bg-color,#fff);overflow-wrap:anywhere}small{opacity:.7}button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid #c5a56c}</style></head><body><main><h1>پرونده آزمایشی کاندیداتوری</h1><p>این صفحه فقط برای آزمایش امن ثبت و ویرایش پروفایل است و به اطلاعات نسخه اصلی دسترسی ندارد.</p><div id=\"msg\" role=\"status\" aria-live=\"polite\">در حال بررسی ورود تلگرام...</div><form id=\"form\" hidden><label>نوع انتخابات<select name=\"election_type\"><option value=\"council\">شوراهای اسلامی</option><option value=\"parliament\">مجلس</option><option value=\"presidency\">ریاست جمهوری</option><option value=\"other\">سایر</option></select></label><label>مرحله<select name=\"stage\"><option value=\"planning\">برنامه‌ریزی</option><option value=\"registration\">ثبت‌نام</option><option value=\"operations\">اجرا</option><option value=\"report\">گزارش</option></select></label><label>حوزه انتخابیه<input name=\"district\" maxlength=\"200\" required></label><label>معرفی کوتاه<textarea name=\"professional_summary\" maxlength=\"2000\"></textarea></label><button type=\"submit\" id=\"save\">ذخیره آزمایشی</button><button type=\"button\" id=\"reload\">بارگذاری دوباره</button><small>داده‌های این محیط آزمایشی ممکن است پاک شوند. اطلاعات واقعی و حساس وارد نکنید.</small></form></main><script src=\"https://telegram.org/js/telegram-web-app.js\"></script><script>const msg=document.getElementById('msg'),form=document.getElementById('form'),tg=window.Telegram?.WebApp;const initData=tg?.initData||'';function status(s){msg.textContent=s}async function request(action,profile){const r=await fetch('/api/profile',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData,action,profile,details:{}})});const data=await r.json();if(!r.ok)throw Error(data.reason?data.error+' ('+data.reason+')':data.error||'API_ERROR');return data}async function load(){form.hidden=true;status('در حال اعتبارسنجی ورود تلگرام...');try{const data=await request('get');if(data.profile)for(const [k,v]of Object.entries(data.profile))if(form.elements.namedItem(k))form.elements.namedItem(k).value=v;form.hidden=false;status('اتصال معتبر است. اطلاعات پروفایل بارگذاری شد.')}catch(e){let hint='';try{const d=await fetch('/api/bot-info').then(r=>r.json());hint=d.botUsername?' ربات متصل به سرور: @'+d.botUsername:d.telegramTokenValid===false?' توکن ربات سرور نامعتبر یا باطل‌شده است.':'';}catch{}status('احراز هویت ناموفق: '+e.message+'.'+hint+' دکمه مینی‌اپ باید متعلق به همان رباتی باشد که توکنش در Cloudflare ثبت شده است.')}}if(!initData){status('برای ورود معتبر، این صفحه باید از داخل مینی‌اپ ربات آزمایشی تلگرام باز شود.');}else{tg?.ready();load()}form.addEventListener('submit',async e=>{e.preventDefault();const b=document.getElementById('save');b.disabled=true;status('در حال ذخیره...');try{const profile=Object.fromEntries(new FormData(form));await request('save',profile);status('ذخیره در پایگاه داده آزمایشی موفق بود.')}catch(err){status('ذخیره ناموفق: '+err.message)}finally{b.disabled=false}});document.getElementById('reload').addEventListener('click',load);</script></body></html>";
// Isolated authenticated integration API. Never deploy to production or public preview.
const json=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer"}});
const enc=new TextEncoder();
const hex=b=>[...new Uint8Array(b)].map(n=>n.toString(16).padStart(2,"0")).join("");
async function telegramUser(initData,token,trace={}){
  const fail=(reason)=>{trace.reason=reason;return null};
  if(typeof initData!=="string"||initData.length<30||initData.length>8192||!token)return fail("MISSING_OR_INVALID_INIT_DATA");
  const p=new URLSearchParams(initData);
  if([...p.keys()].length!==new Set(p.keys()).size||!p.has("hash")||!p.has("auth_date")||!p.has("user"))return fail("INVALID_INIT_DATA_FIELDS");
  const expected=p.get("hash");
  if(!/^[a-f0-9]{64}$/i.test(expected))return fail("INVALID_HASH_FORMAT");
  // Bot-token HMAC includes the signature field when Telegram supplies it.
  // Excluding signature applies only to third-party Ed25519 verification.
  p.delete("hash");
  const check=[...p.entries()].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>k+"="+v).join("\n");
  const key=await crypto.subtle.importKey("raw",enc.encode("WebAppData"),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const secret=await crypto.subtle.sign("HMAC",key,enc.encode(token));
  const signing=await crypto.subtle.importKey("raw",secret,{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const actual=hex(await crypto.subtle.sign("HMAC",signing,enc.encode(check)));
  let difference=0;for(let i=0;i<64;i++)difference|=actual.charCodeAt(i)^expected.toLowerCase().charCodeAt(i);
  if(difference)return fail("SIGNATURE_MISMATCH");
  const auth=Number(p.get("auth_date")),now=Math.floor(Date.now()/1000);
  if(!Number.isSafeInteger(auth)||auth>now+60||now-auth>3600)return fail("AUTH_DATE_EXPIRED");
  let user;try{user=JSON.parse(p.get("user"))}catch{return fail("INVALID_USER_JSON")}
  if(!Number.isSafeInteger(user?.id)||user.id<=0)return fail("INVALID_USER_ID");
  return {id:user.id,name:typeof user.first_name==="string"?user.first_name.slice(0,100):"",username:typeof user.username==="string"?user.username.slice(0,100):null};
}
export default {async fetch(request,env){
  const url=new URL(request.url);
  if(request.method==='GET'&&url.pathname==='/')return new Response(TEST_PAGE,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','content-security-policy':"default-src 'none'; script-src 'unsafe-inline' https://telegram.org; connect-src 'self'; style-src 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors https://web.telegram.org https://*.telegram.org"}});
  if(request.method==="GET"&&url.pathname==="/api/bot-info"){
    if(!env.TELEGRAM_BOT_TOKEN)return json({telegramTokenValid:false,botUsername:null});
    try{
      const response=await fetch("https://api.telegram.org/bot"+env.TELEGRAM_BOT_TOKEN+"/getMe",{signal:AbortSignal.timeout(5000)});
      const data=await response.json();
      return json({telegramTokenValid:data.ok===true,botUsername:data.ok===true?String(data.result?.username||""):null});
    }catch{return json({telegramTokenValid:null,botUsername:null,error:"TELEGRAM_LOOKUP_UNAVAILABLE"},503)}
  }
  if(request.method==="GET"&&url.pathname==="/health"){
    try{const x=await env.DB.prepare("SELECT count(*) AS n FROM sqlite_master WHERE type='table' AND name='candidate_users'").first();
      return json({service:"candidatory-integration",mode:"authenticated-test",schemaReady:x?.n===1,telegramSecretConfigured:!!env.TELEGRAM_BOT_TOKEN,production:false});
    }catch{return json({error:"DB_UNAVAILABLE"},503)}
  }
  if(url.pathname!=="/api/profile"||request.method!=="POST")return json({error:"NOT_FOUND"},404);
  if(Number(request.headers.get("content-length")||0)>12000)return json({error:"REQUEST_TOO_LARGE"},413);
  let body;try{body=await request.json()}catch{return json({error:"BAD_JSON"},400)}
  const authTrace={};
  const user=await telegramUser(body?.initData,env.TELEGRAM_BOT_TOKEN,authTrace);
  if(!user)return json({error:"TELEGRAM_AUTH_REQUIRED",reason:authTrace.reason||"UNKNOWN"},401);
  if(body.action==="get"){
    try{const p=await env.DB.prepare("SELECT election_type,district,stage,professional_summary FROM candidate_profiles WHERE telegram_id=?").bind(user.id).first();
      const d=await env.DB.prepare("SELECT details_json FROM candidate_profile_details WHERE telegram_id=?").bind(user.id).first();
      return json({ok:true,profile:p||null,details:d?JSON.parse(d.details_json):{}});
    }catch{return json({error:"DB_ERROR"},503)}
  }
  if(body.action!=="save")return json({error:"UNKNOWN_ACTION"},400);
  const p=body.profile,d=body.details;
  if(!p||typeof p!=="object"||Array.isArray(p)||!["council","parliament","presidency","other"].includes(p.election_type)||!["planning","registration","operations","report"].includes(p.stage)||typeof p.district!=="string"||p.district.length>200||typeof p.professional_summary!=="string"||p.professional_summary.length>2000||!d||typeof d!=="object"||Array.isArray(d))return json({error:"INVALID_PROFILE"},400);
  const keys=Object.keys(d);if(keys.length>30||keys.some(k=>k==="__proto__"||k==="constructor"||k.length>64||typeof d[k]!=="string"||d[k].length>1000))return json({error:"INVALID_DETAILS"},400);
  const details=JSON.stringify(d);if(details.length>5000)return json({error:"INVALID_DETAILS"},400);
  try{
    await env.DB.batch([
      env.DB.prepare("INSERT INTO candidate_users(telegram_id,display_name,username) VALUES(?,?,?) ON CONFLICT(telegram_id) DO UPDATE SET display_name=excluded.display_name,username=excluded.username,updated_at=CURRENT_TIMESTAMP").bind(user.id,user.name,user.username),
      env.DB.prepare("INSERT INTO candidate_profiles(telegram_id,election_type,district,stage,professional_summary) VALUES(?,?,?,?,?) ON CONFLICT(telegram_id) DO UPDATE SET election_type=excluded.election_type,district=excluded.district,stage=excluded.stage,professional_summary=excluded.professional_summary,updated_at=CURRENT_TIMESTAMP").bind(user.id,p.election_type,p.district,p.stage,p.professional_summary),
      env.DB.prepare("INSERT INTO candidate_profile_details(telegram_id,details_json) VALUES(?,?) ON CONFLICT(telegram_id) DO UPDATE SET details_json=json_patch(candidate_profile_details.details_json,excluded.details_json),updated_at=CURRENT_TIMESTAMP").bind(user.id,details)
    ]);
    return json({ok:true,saved:true});
  }catch{return json({error:"SAVE_FAILED"},503)}
}};
