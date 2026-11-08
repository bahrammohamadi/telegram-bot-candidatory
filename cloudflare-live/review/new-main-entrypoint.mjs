// Canonical source of the new-main entrypoint deployed 2026-11-08.
// Cloudflare deployment: 3d172eb9-eca1-45e5-9070-760970d1f8c1
// Legacy module is bundled for rollback only, never dispatched by this router.
import legacy from './legacy.mjs';
import preview from './preview.mjs';
export default { async fetch(request,env,ctx){
 const u=new URL(request.url),p=u.pathname;
 if(!env.REVIEW_DB||!env.TELEGRAM_BOT_TOKEN)
  return new Response('New app temporarily unavailable',{status:503,headers:{'cache-control':'no-store'}});
 if(p==='/legacy'||p.startsWith('/legacy/'))
  return new Response('Archived',{status:410});
 if(p==='/review'||p==='/review/')
  return Response.redirect(new URL('/',u).toString(),302);
 const v=new URL(u);
 if(p.startsWith('/review/api/'))v.pathname=p.slice('/review'.length);
 const e={DB:env.REVIEW_DB,TELEGRAM_BOT_TOKEN:env.TELEGRAM_BOT_TOKEN,AI_ENABLED:'false'};
 const res=await preview.fetch(new Request(v.toString(),request),e,ctx);
 const h=new Headers(res.headers);h.set('cache-control','no-store');
 if(p==='/'||p==='/index.html'){
  let html=await res.text();
  html=html.replace(/<section class="main-review-notice"[\s\S]*?<\/section>/,'');
  html=html.replaceAll('پیش‌نمایش امکانات جدید کاندیداتوری','کاندیداتوری')
           .replaceAll('پرونده آزمایشی کاندیداتوری','کاندیداتوری')
           .replaceAll('نسخه جدید در حالت بازبینی','');
  return new Response(html,{status:res.status,headers:h});
 }
 return new Response(res.body,{status:res.status,headers:h});
}};
