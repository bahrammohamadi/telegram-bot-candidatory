import { vazirmatnRegularBase64 } from './vazirmatn-regular.mjs';

export const FONT_PATH = '/assets/fonts/vazirmatn-regular.woff2';
export const FONT_CSS = '@font-face{font-family:Vazirmatn;src:url("'+FONT_PATH+'") format("woff2");font-style:normal;font-weight:400;font-display:swap}html,body,body *,button,input,select,textarea,option{font-family:Vazirmatn,Tahoma,Arial,sans-serif!important;font-synthesis:weight style!important}';

// Only public font bytes; never access application bindings or user data.
export function serveFont(request) {
  if (new URL(request.url).pathname !== FONT_PATH) return null;
  if (!['GET','HEAD'].includes(request.method)) return new Response(null,{status:405,headers:{Allow:'GET, HEAD'}});
  const bytes = Uint8Array.from(atob(vazirmatnRegularBase64), c => c.charCodeAt(0));
  if (String.fromCharCode(...bytes.slice(0,4)) !== 'wOF2') throw new Error('Invalid WOFF2 signature');
  return new Response(request.method === 'HEAD' ? null : bytes,{headers:{
    'Content-Type':'font/woff2','Content-Length':String(bytes.length),
    'Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'
  }});
}

// Apply to HTML only after the existing handler has enforced access controls.
// Keep CSP and all other security headers intact; do not rewrite API responses.
export async function applyTypography(response) {
  if (!response.ok || !/^text\/html\b/i.test(response.headers.get('content-type') || '')) return response;
  const html = await response.text();
  const updated = html.replace(/<link\b[^>]*>/gi, tag => /https:\/\/fonts\.(?:googleapis|gstatic)\.com(?:\/|["'])/i.test(tag) ? '' : tag)
    .replace(/<\/head\s*>/i, '<style id="candidatory-self-hosted-font">'+FONT_CSS+'</style></head>');
  const headers = new Headers(response.headers);
  for (const name of ['content-length','etag','content-md5','content-encoding']) headers.delete(name);
  return new Response(updated,{status:response.status,statusText:response.statusText,headers});
}
