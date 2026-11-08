import legacy from './legacy.mjs';
import preview from './preview.mjs';

// The original production Worker is untouched and remains the handler of all
// routes except /review and /review/api/*, using its original production D1.
const ENTRY='<a class="candidatory-review-entry" href="/review" aria-label="مشاهده پیش‌نمایش امکانات جدید کاندیداتوری">🧪 پیش‌نمایش امکانات جدید — برای دریافت نظر</a>';
const ENTRY_CSS=`
.candidatory-review-entry{display:block;text-align:center;min-height:44px;padding:12px;margin:10px 12px 4px;border:1px solid #168677;border-radius:12px;background:#eef9f5;color:#064f47;font-size:14px;font-weight:700;text-decoration:none;line-height:1.7}
.candidatory-review-entry:hover,.candidatory-review-entry:focus-visible{outline:3px solid #168677;outline-offset:2px}
@media(prefers-color-scheme:dark){.candidatory-review-entry{background:#18372f;color:#d9f9ec;border-color:#6cc5ad}}
\`;
const onlyReviewPaths=(p)=>p==='/review'||p==='/review/'||p.startsWith('/review/api/');

export default {
 async fetch(request,env,ctx){
  const url=new URL(request.url),path=url.pathname;
  if(onlyReviewPaths(path)){
   if(!env.REVIEW_DB||!env.TELEGRAM_BOT_TOKEN)
    return new Response('Preview is not configured',{status:503,headers:{'cache-control':'no-store'}});
   const newUrl=new URL(request.url);
   newUrl.pathname=path==='/review'||path==='/review/'?'/':path.slice('/review'.length);
   // Critically: no production DB, admin secrets or AI service can reach preview.
   const previewEnv={DB:env.REVIEW_DB,TELEGRAM_BOT_TOKEN:env.TELEGRAM_BOT_TOKEN,AI_ENABLED:'false'};
   const response=await preview.fetch(new Request(newUrl.toString(),request),previewEnv,ctx);
   const headers=new Headers(response.headers);
   headers.set('cache-control','no-store');
   headers.set('x-robots-tag','noindex, nofollow');
   return new Response(response.body,{status:response.status,headers});
  }
  if(request.method==='GET'&&(path==='/'||path==='/index.html')){
   const response=await legacy.fetch(request,env,ctx);
   if(!response.ok)return response;
   const html=await response.text();
   if(!html.includes('</header>'))return new Response('Review entry anchor unavailable',{status:503});
   const updated=html.replace('</header>',ENTRY+'</header>');
   return new Response(updated,{status:response.status,headers:response.headers});
  }
  if(request.method==='GET'&&path==='/style.css'){
   const response=await legacy.fetch(request,env,ctx);
   if(!response.ok)return response;
   const css=await response.text();
   return new Response(css+'\n'+ENTRY_CSS,{status:response.status,headers:response.headers});
  }
  return legacy.fetch(request,env,ctx);
 }
};
