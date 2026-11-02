// Reproducible isolated Worker build: combines verified deployed snapshot + practice module.
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
let source=read("../phase4/integration-deployed-snapshot-2026-11-01.mjs");
const module=read("./practice-api.mjs").replace("export const PRACTICE_EXERCISES","const PRACTICE_EXERCISES").replace("export async function handlePractice","async function handlePractice");
const route=`
  if(url.pathname==="/api/practice"&&request.method==="POST"){
    const len=Number(request.headers.get("content-length")||0);
    if(len>14000)return json({error:"REQUEST_TOO_LARGE"},413);
    let body;try{const raw=await request.text();if(raw.length>14000)return json({error:"REQUEST_TOO_LARGE"},413);body=JSON.parse(raw)}catch{return json({error:"BAD_JSON"},400)}
    const user=await telegramUser(body?.initData,env.TELEGRAM_BOT_TOKEN);
    if(!user)return json({error:"TELEGRAM_AUTH_REQUIRED"},401);
    try{return await handlePractice(env.DB,user,body)}catch{return json({error:"PRACTICE_DB_ERROR"},503)}
  }
`;
const anchor="const json=";
const serverAnchor='  if(url.pathname==="/api/goals"&&request.method==="POST"){';
if(!source.includes(anchor)||!source.includes(serverAnchor)||source.includes("/api/practice"))throw Error("Worker snapshot changed or practice already applied");
source=source.replace(anchor,module+"\n"+anchor).replace(serverAnchor,route+serverAnchor);
const m=source.match(/^const TEST_PAGE=("(?:\\.|[^"\\])*");\n/);
if(!m)throw Error("Embedded HTML not found");
let html=JSON.parse(m[1]);
const section='<section id="calendar-panel"';
const nav="if(b.dataset.module==='گزارش عملکرد'){openGoals();return}";
const inject="const goalsPanel=document.getElementById('goals-panel')";
if(!html.includes(section)||!html.includes(nav)||!html.includes(inject))throw Error("Unexpected dashboard UI");
html=html.replace("سایر بخش‌ها هنوز نمایشی‌اند.","تمرین سخنرانی و پرسش‌وپاسخ نیز به پایگاه داده آزمایشی متصل است؛ سایر بخش‌ها هنوز نمایشی‌اند.");
html=html.replace(section,read("./practice-panel.html")+section)
.replace(nav,nav+"if(b.dataset.module==='تمرین و آمادگی'){openPractice();return}")
.replace(inject,read("./practice-ui.js")+"\n"+inject);
source=source.replace(m[0],"const TEST_PAGE="+JSON.stringify(html)+";\n");
if(!source.includes('url.pathname==="/api/practice"')||!source.includes('id=\\"practice-panel\\"'))throw Error("Build missing practice API or UI");
mkdirSync(new URL("./dist/",import.meta.url),{recursive:true});
writeFileSync(new URL("./dist/integration-practice-worker.mjs",import.meta.url),source);
console.log("PASS: reproducible practice integration Worker built");
