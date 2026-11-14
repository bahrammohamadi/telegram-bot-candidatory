// Pure build step. Does not alter production or deployed integration Worker.
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
let source=read("../phase3/integration-auth-worker.mjs");
const module=read("./goals-api.mjs").replace("export async function handleGoals","async function handleGoals");
if(!source.includes("const json=")||!source.includes('if(url.pathname==="/api/calendar"'))throw Error("Unexpected integration Worker snapshot");
source=source.replace("const json=",module+"\nconst json=");
const handler=`
  if(url.pathname==="/api/goals"&&request.method==="POST"){
    if(Number(request.headers.get("content-length")||0)>10000)return json({error:"REQUEST_TOO_LARGE"},413);
    let b;try{b=await request.json()}catch{return json({error:"BAD_JSON"},400)}
    const user=await telegramUser(b?.initData,env.TELEGRAM_BOT_TOKEN);
    if(!user)return json({error:"TELEGRAM_AUTH_REQUIRED"},401);
    try{return await handleGoals(env.DB,user,b)}catch{return json({error:"GOALS_DB_ERROR"},503)}
  }
`;
source=source.replace('  if(url.pathname==="/api/calendar"&&request.method==="POST"){',handler+'  if(url.pathname==="/api/calendar"&&request.method==="POST"){');
const m=source.match(/^const TEST_PAGE=("(?:\\.|[^"\\])*");\n/);
if(!m)throw Error("Missing embedded HTML");
let html=JSON.parse(m[1]);
html=html.replace("بخش تقویم شخصی به پایگاه داده آزمایشی متصل است. سایر بخش‌ها هنوز نمایشی‌اند.","بخش تقویم و اهداف به پایگاه داده آزمایشی متصل‌اند. سایر بخش‌ها هنوز نمایشی‌اند.");
html=html.replace('<section id="calendar-panel"',read("./goals-panel.html")+'<section id="calendar-panel"');
html=html.replace("if(b.dataset.module==='تقویم و جلسات'){openCalendar();return}","if(b.dataset.module==='تقویم و جلسات'){openCalendar();return}if(b.dataset.module==='گزارش عملکرد'){openGoals();return}");
html=html.replace("const calendarPanel=document.getElementById('calendar-panel')",read("./goals-ui.js")+"\nconst calendarPanel=document.getElementById('calendar-panel')");
source=source.replace(m[0],"const TEST_PAGE="+JSON.stringify(html)+";\n");
mkdirSync(new URL("./dist/",import.meta.url),{recursive:true});
writeFileSync(new URL("./dist/integration-goals-worker.mjs",import.meta.url),source);
console.log("Built goals integration candidate (NOT DEPLOYED)");
