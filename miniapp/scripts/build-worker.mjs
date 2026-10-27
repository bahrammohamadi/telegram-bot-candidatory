import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const root=resolve("miniapp");
const html=readFileSync(resolve(root,"web/index.html"),"utf8");
const css=readFileSync(resolve(root,"web/style.css"),"utf8");
const app=readFileSync(resolve(root,"web/app.js"),"utf8");
const ops=readFileSync(resolve(root,"web/ops-ui.js"),"utf8");
const api=readFileSync(resolve(root,"cloudflare/worker.js"),"utf8");
if(!api.includes("export default {")) throw new Error("Worker entrypoint not found");
const prefix=`// Deterministically generated from miniapp/web/* and miniapp/cloudflare/worker.js.
const SITE_HTML=${JSON.stringify(html)};
const SITE_CSS=${JSON.stringify(css)};
const SITE_APP=${JSON.stringify(app)};
const SITE_OPS=${JSON.stringify(ops)};
${api.replace("export default {","const apiHandler = {")}
`;
const router=`export default {
  async fetch(request,env) {
    const p=new URL(request.url).pathname;
    if(request.method==="GET" && p.startsWith("/api/")) return apiHandler.fetch(request,env);
    if(request.method==="GET") {
      const files={
        "/":[SITE_HTML,"text/html; charset=utf-8"],
        "/index.html":[SITE_HTML,"text/html; charset=utf-8"],
        "/style.css":[SITE_CSS,"text/css; charset=utf-8"],
        "/app.js":[SITE_APP,"text/javascript; charset=utf-8"],
        "/ops-ui.js":[SITE_OPS,"text/javascript; charset=utf-8"]
      };
      const asset=files[p];
      if(!asset) return new Response("Not found",{status:404});
      return new Response(asset[0],{headers:{
        "content-type":asset[1],
        "x-content-type-options":"nosniff",
        "referrer-policy":"no-referrer",
        "content-security-policy":"default-src 'none'; script-src 'self' https://telegram.org; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'self' https://web.telegram.org https://*.telegram.org",
        "cache-control":"no-cache"
      }});
    }
    return apiHandler.fetch(request,env);
  }
};
`;
writeFileSync(resolve(root,"cloudflare/site-worker.js"),prefix+router);
console.info("Built standalone Cloudflare Mini App Worker");
