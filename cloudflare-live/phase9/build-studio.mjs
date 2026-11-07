// Phase 9 isolated studio integration from complete deployed phase 8 Worker snapshot.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
let source=read('../phase8/integration-deployed-snapshot-2026-11-02.mjs');
if(!source.endsWith('}};\n')||source.includes('--- TRUNCATED ---')||!source.includes('url.pathname==="/api/progress"'))throw Error('Wrong or truncated Worker snapshot');
if(source.includes('url.pathname==="/api/studio"'))throw Error('Studio already exists in Worker');
const module=read('./studio-api.mjs').replace('export async function handleStudio','async function handleStudio');
const route=`
  if(url.pathname==="/api/studio"&&request.method==="POST"){
    if(Number(request.headers.get("content-length")||0)>14000)return json({error:"REQUEST_TOO_LARGE"},413);
    let data;try{const raw=await request.text();if(raw.length>14000)return json({error:"REQUEST_TOO_LARGE"},413);data=JSON.parse(raw)}catch{return json({error:"BAD_JSON"},400)}
    const user=await telegramUser(data?.initData,env.TELEGRAM_BOT_TOKEN);
    if(!user)return json({error:"TELEGRAM_AUTH_REQUIRED"},401);
    try{return await handleStudio(env.DB,user,data)}catch{return json({error:"STUDIO_DB_ERROR"},503)}
  }
`;
source=source.replace('const json=',module+'\nconst json=');
source=source.replace('  if(url.pathname==="/api/progress"&&request.method==="POST"){',route+'  if(url.pathname==="/api/progress"&&request.method==="POST"){');
const m=source.match(/^const TEST_PAGE=("(?:\\.|[^"\\])*");\n/);
if(!m)throw Error('Embedded HTML missing');
let html=JSON.parse(m[1]);
const section='<section id="calendar-panel"';
const jsAnchor="const progressPanel=document.getElementById('progress-panel')";
const nav="if(b.dataset.module==='تمرین و آمادگی'){openPractice();return}";
if(!html.includes(section)||!html.includes(jsAnchor)||!html.includes(nav)||!html.includes('data-module="استودیوی محتوا"'))throw Error('Dashboard anchors changed');
html=html.replace(section,read('./studio-panel.html')+section);
html=html.replace(jsAnchor,read('./studio-ui.js')+'\n'+jsAnchor);
html=html.replace(nav,nav+"if(b.dataset.module==='استودیوی محتوا'){openStudio();return}");
html=html.replace('سایر بخش‌ها هنوز نمایشی‌اند.','بخش استودیوی محتوای اطلاع‌رسانی عمومی نیز به پایگاه داده آزمایشی متصل است؛ سایر قابلیت‌های تکمیل‌نشده صرفاً نمایشی‌اند.');
html=html.replace('</style>',".studio-card{border:1px solid #96a3b2;border-radius:12px;padding:12px;margin:10px 0;overflow-wrap:anywhere;display:grid;gap:7px}.studio-card p{white-space:pre-wrap;overflow-wrap:anywhere}.studio-card button{min-width:0}#studio-form{gap:12px}#studio-body{min-height:220px}</style>");
source=source.replace(m[0],'const TEST_PAGE='+JSON.stringify(html)+';\n');
if(!source.includes('url.pathname==="/api/studio"')||!source.includes('id=\\"studio-panel\\"')||!source.includes('id=\\"progress-panel\\"'))throw Error('Studio build incomplete');
mkdirSync(new URL('./dist/',import.meta.url),{recursive:true});
writeFileSync(new URL('./dist/integration-studio-worker.mjs',import.meta.url),source);
console.log('PASS: studio Worker built; profile/calendar/goals/practice/quiz/progress/print preserved');
