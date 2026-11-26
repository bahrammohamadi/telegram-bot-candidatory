// Phase 6 integration build from the exact complete isolated Worker snapshot.
// Build only: deployment to the test Worker is a separate explicit action.
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
let source=read("../phase5/integration-deployed-snapshot-2026-11-02.mjs");
if(!source.endsWith("}};\n")||source.includes("--- TRUNCATED ---")||!source.includes('url.pathname==="/api/practice"'))throw Error("Invalid deployed Worker baseline");
const module=read("./quiz-api.mjs").replace("export async function handleQuiz","async function handleQuiz");
const handler=`
  if(url.pathname==="/api/quiz"&&request.method==="POST"){
    if(Number(request.headers.get("content-length")||0)>14000)return json({error:"REQUEST_TOO_LARGE"},413);
    let body;try{const raw=await request.text();if(raw.length>14000)return json({error:"REQUEST_TOO_LARGE"},413);body=JSON.parse(raw)}catch{return json({error:"BAD_JSON"},400)}
    const user=await telegramUser(body?.initData,env.TELEGRAM_BOT_TOKEN);
    if(!user)return json({error:"TELEGRAM_AUTH_REQUIRED"},401);
    try{return await handleQuiz(env.DB,user,body)}catch{return json({error:"QUIZ_DB_ERROR"},503)}
  }
`;
if(source.includes('/api/quiz'))throw Error("Duplicate quiz route");
source=source.replace("const json=",module+"\nconst json=");
source=source.replace('  if(url.pathname==="/api/practice"&&request.method==="POST"){',handler+'  if(url.pathname==="/api/practice"&&request.method==="POST"){');
const m=source.match(/^const TEST_PAGE=("(?:\\.|[^"\\])*");\n/);
if(!m)throw Error("Missing embedded HTML");
let html=JSON.parse(m[1]);
if(!html.includes('<section id="practice-panel"')||!html.includes("const practicePanel=document.getElementById('practice-panel')"))throw Error("Practice UI changed");
html=html.replace('<section id="practice-panel"',read("./quiz-panel.html")+'<section id="practice-panel"');
html=html.replace('<form id="practice-form">','<button id="open-quiz" type="button" class="secondary">آزمون‌های آموزشی و سنجش دانش</button><form id="practice-form">');
html=html.replace("const practicePanel=document.getElementById('practice-panel')",read("./quiz-ui.js")+"\nconst practicePanel=document.getElementById('practice-panel')");
html=html.replace("</style>",".quiz-card{border:1px solid #96a3b2;border-radius:12px;padding:12px;margin:10px 0;overflow-wrap:anywhere}.quiz-option{display:flex;align-items:flex-start;gap:10px;padding:9px 4px;font-weight:normal}.quiz-option input{min-height:unset;width:auto;flex:0 0 auto;margin-top:5px}#quiz-questions fieldset{max-width:100%;overflow-wrap:anywhere}#quiz-feedback a{display:inline-block;padding:8px 0}</style>");
source=source.replace(m[0],"const TEST_PAGE="+JSON.stringify(html)+";\n");
if(!source.includes('url.pathname==="/api/quiz"')||!source.includes('id=\\"quiz-panel\\"')||!source.includes('id=\\"practice-panel\\"'))throw Error("Incomplete quiz integration");
mkdirSync(new URL("./dist/",import.meta.url),{recursive:true});
writeFileSync(new URL("./dist/integration-quiz-worker.mjs",import.meta.url),source);
console.log("PASS: phase 6 quiz integration built with practice/calendar/goals/profile preserved");
