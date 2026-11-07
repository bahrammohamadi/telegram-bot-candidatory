// Reproducible test-only phase 11 build using the exact phase-10 deployed Worker snapshot.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
let src=read('../phase10/integration-deployed-snapshot-2026-11-02.mjs');
if(src.length!==99872||!src.endsWith('}};\n')||!src.includes('url.pathname==="/api/membership"'))throw Error('Phase 10 baseline differs or is incomplete');
if(src.includes('url.pathname==="/api/entitlements"'))throw Error('Entitlements already present');
const module=read('./demo-entitlements.mjs')
.replace('export const DEMO_PLAN_LIMITS','const DEMO_PLAN_LIMITS')
.replace('export async function effectiveDemoPlan','async function effectiveDemoPlan')
.replace('export async function readDemoEntitlements','async function readDemoEntitlements')
.replace('export async function enforceDemoQuota','async function enforceDemoQuota');
src=src.replace('const json=',module+'\nconst json=');
const entitlementsRoute=`
  if(url.pathname==="/api/entitlements"&&request.method==="POST"){
    if(Number(request.headers.get("content-length")||0)>9000)return json({error:"REQUEST_TOO_LARGE"},413);
    let body;try{const raw=await request.text();if(raw.length>9000)return json({error:"REQUEST_TOO_LARGE"},413);body=JSON.parse(raw)}catch{return json({error:"BAD_JSON"},400)}
    const user=await telegramUser(body?.initData,env.TELEGRAM_BOT_TOKEN);
    if(!user)return json({error:"TELEGRAM_AUTH_REQUIRED"},401);
    if(body?.action!=="status")return json({error:"UNKNOWN_ACTION"},400);
    try{return json(await readDemoEntitlements(env.DB,user))}catch{return json({error:"ENTITLEMENTS_DB_ERROR"},503)}
  }
`;
src=src.replace('  if(url.pathname==="/api/membership"&&request.method==="POST"){',entitlementsRoute+'  if(url.pathname==="/api/membership"&&request.method==="POST"){');
function guardRoute(path,variable,action,key){
 const anchor='  if(url.pathname==="/api/'+path+'"&&request.method==="POST"){';
 const start=src.indexOf(anchor);
 if(start<0)throw Error('Missing API route '+path);
 let next=src.indexOf('\n  if(url.pathname===',start+anchor.length);
 if(next<0)next=src.indexOf('\n  if(url.pathname!==',start+anchor.length);
 if(next<0)next=src.lastIndexOf('\n}};');
 if(next<start)throw Error('Missing route boundary '+path);
 let body=src.slice(start,next);
 const auth='if(!user)return json({error:"TELEGRAM_AUTH_REQUIRED"},401);';
 if(body.split(auth).length!==2)throw Error('Expected exactly one signed auth check in '+path);
 const gate=`\n    if(${variable}?.action==="${action}"){try{const denied=await enforceDemoQuota(env.DB,user,"${key}");if(denied)return denied}catch{return json({error:"ENTITLEMENTS_DB_ERROR"},503)}}`;
 body=body.replace(auth,auth+gate);
 src=src.slice(0,start)+body+src.slice(next);
}
guardRoute('calendar','b','create','calendar');
guardRoute('goals','b','create','goals');
guardRoute('practice','body','create','practice');
guardRoute('studio','data','create','studio');
guardRoute('quiz','body','submit','quiz_daily');
const match=src.match(/^const TEST_PAGE=("(?:\\.|[^"\\])*");\n/);
if(!match)throw Error('Missing embedded UI');
let html=JSON.parse(match[1]);
if(!html.includes('id="membership-panel"')||!html.includes("const membershipPanel=document.getElementById('membership-panel')"))throw Error('Membership UI anchors absent');
html=html.replace('<div id="membership-summary"></div>','<div id="membership-summary"></div><section id="membership-limits" class="panel" aria-live="polite"></section>');
const updater=`
async function membershipReadQuotas(){
 const target=document.getElementById('membership-limits');target.textContent='در حال دریافت سهمیه‌های نسخه آزمایشی...';
 try{
  const response=await fetch('/api/entitlements',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData,action:'status'})});
  const data=await response.json();if(!response.ok)throw Error(data.error||'ENTITLEMENTS_ERROR');
  const names={goals:'اهداف',calendar:'تقویم',practice:'تمرین‌های ذخیره‌شده',studio:'پیش‌نویس‌های محتوا',quiz_daily:'دفعات آزمون در ۲۴ ساعت'};
  target.replaceChildren();const heading=document.createElement('h4');heading.textContent='سهمیه‌های '+(data.plan==='professional'?'حرفه‌ای آزمایشی':'رایگان');target.append(heading);
  for(const [key,label] of Object.entries(names)){
   const row=document.createElement('p');row.textContent=label+': '+data.usage[key]+' استفاده‌شده از '+data.limits[key]+' | باقیمانده: '+data.remaining[key];target.append(row);
  }
  const note=document.createElement('small');note.textContent='محدودیت‌ها در سرور اعمال می‌شوند. این طرح‌ها صرفاً آزمایشی هستند و هیچ پرداخت واقعی انجام نمی‌شود.';target.append(note);
 }catch(error){target.textContent='سهمیه‌ها در دسترس نیستند: '+error.message}
}
`;
const jsAnchor="const membershipPanel=document.getElementById('membership-panel')";
html=html.replace(jsAnchor,updater+'\n'+jsAnchor);
const after="if(data.is_admin)await membershipAdminRefresh();";
if(!html.includes(after))throw Error('Membership refresh marker missing');
html=html.replace(after,after+'await membershipReadQuotas();');
src=src.replace(match[0],'const TEST_PAGE='+JSON.stringify(html)+';\n');
if(!src.includes('url.pathname==="/api/entitlements"')||!src.includes('id=\\"membership-limits\\"'))throw Error('Failed to integrate quotas');
const preserved=['/api/profile','/api/calendar','/api/goals','/api/practice','/api/quiz','/api/progress','/api/studio','/api/membership'];
if(!preserved.every(x=>src.includes(x)))throw Error('Missing previous API module');
mkdirSync(new URL('./dist/',import.meta.url),{recursive:true});
writeFileSync(new URL('./dist/integration-entitlements-worker.mjs',import.meta.url),src);
console.log('PASS: test subscription quotas built and 8 existing modules retained');
