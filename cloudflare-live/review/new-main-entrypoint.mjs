import legacy from './legacy.mjs';
import modern from './preview.mjs';

// New application is the sole default UI and API. The old implementation
// remains reachable only via an explicit recovery path, not normal navigation.
export default {
 async fetch(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (path === '/legacy' || path.startsWith('/legacy/')) {
   // Operator recovery only; no public navigation links to this route.
   // Do not forward user credentials into a second database.
   return new Response('Legacy recovery requires a controlled rollback', {status:410, headers:{'cache-control':'no-store'}});
  }
  if (!env.REVIEW_DB || !env.TELEGRAM_BOT_TOKEN) {
   return new Response('New application temporarily unavailable', {status:503,headers:{'cache-control':'no-store'}});
  }
  // The new app is isolated from production legacy D1 and privileged bindings.
  const modernEnv = {DB:env.REVIEW_DB,TELEGRAM_BOT_TOKEN:env.TELEGRAM_BOT_TOKEN,AI_ENABLED:'false'};
  const upstream = await modern.fetch(request,modernEnv,ctx);
  const headers = new Headers(upstream.headers);
  headers.set('cache-control','no-store');
  return new Response(upstream.body,{status:upstream.status,headers});
 }
};
