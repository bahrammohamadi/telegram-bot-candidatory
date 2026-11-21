// Assemble isolated task tracking against the exact deployed phase-13 Worker source.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
let source=read('../phase13/integration-deployed-snapshot-2026-11-02.mjs');
if(source.length!==131042||!source.endsWith('}};\n')||!source.includes('url.pathname==="/api/assistant"'))throw Error('Wrong/incomplete deployed phase13 baseline');
if(source.includes('url.pathname==="/api/tasks"'))throw Error('Task API already installed');
const api=read('./tasks-api.mjs').replace('export async function handleTasks','async function handleTasks');
const route=`
  if(url.pathname==="/api/tasks"&&request.method==="POST"){
    if(Number(request.headers.get("content-length")||0)>11000)return json({error:"REQUEST_TOO_LARGE"},413);
    let body;try{const raw=await request.text();if(raw.length>11000)return json({error:"REQUEST_TOO_LARGE"},413);body=JSON.parse(raw)}catch{return json({error:"BAD_JSON"},400)}
    const user=await telegramUser(body?.initData,env.TELEGRAM_BOT_TOKEN);
    if(!user)return json({error:"TELEGRAM_AUTH_REQUIRED"},401);
    try{return await handleTasks(env.DB,user,body)}catch{return json({error:"TASKS_DB_ERROR"},503)}
  }
`;
source=source.replace('const json=',api+'\nconst json=');
const serverAnchor='  if(url.pathname==="/api/assistant"&&request.method==="POST"){';
if(!source.includes(serverAnchor))throw Error('Assistant API insertion marker absent');
source=source.replace(serverAnchor,route+serverAnchor);
const m=source.match(/^const TEST_PAGE=("(?:\\.|[^"\\])*");\n/);
if(!m)throw Error('Embedded HTML not found');
let html=JSON.parse(m[1]);
const section='<section id="assistant-panel"';
const anchor="const assistantPanel=document.getElementById('assistant-panel')";
const nav="if(b.dataset.module==='تقویم و جلسات'){openCalendar();return}";
const button='<button type="button" data-module="تمرین و آمادگی">';
if(![section,anchor,nav,button].every(x=>html.includes(x)))throw Error('Unexpected dashboard markers');
html=html.replace(section,read('./tasks-panel.html')+section);
html=html.replace(anchor,read('./tasks-ui.js')+'\n'+anchor);
html=html.replace(nav,nav+"if(b.dataset.module==='برنامه و پیگیری وظایف'){openTasks();return}");
html=html.replace(button,'<button type="button" data-module="برنامه و پیگیری وظایف">برنامه و پیگیری وظایف</button>'+button);
html=html.replace('</style>',".tasks-summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:12px 0}.task-metric,.task-card{border:1px solid #96a3b2;border-radius:12px;padding:12px;overflow-wrap:anywhere}.task-metric{display:grid;gap:7px}.task-metric strong{font-size:23px}.task-card{margin:10px 0;display:grid;gap:6px}.task-card p{margin:3px 0;white-space:pre-wrap}.task-overdue{font-weight:700}.task-actions{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}.task-actions button,.task-actions select{min-width:0;padding-inline:5px}.task-quota{grid-column:1/-1}@media(max-width:340px){.task-actions{grid-template-columns:1fr 1fr}.tasks-summary{grid-template-columns:1fr}}</style>");
source=source.replace(m[0],'const TEST_PAGE='+JSON.stringify(html)+';\n');
for(const key of ['/api/profile','/api/calendar','/api/goals','/api/practice','/api/quiz','/api/progress','/api/studio','/api/membership','/api/entitlements','/api/admin-console','/api/assistant','/api/tasks'])if(!source.includes(key))throw Error('API route lost: '+key);
if(!source.includes('id=\\"tasks-panel\\"')||!source.includes('id=\\"assistant-panel\\"'))throw Error('Task panel missing');
mkdirSync(new URL('./dist/',import.meta.url),{recursive:true});
writeFileSync(new URL('./dist/integration-tasks-worker.mjs',import.meta.url),source);
console.log('PASS: tasks API/UI added to isolated Mini App and 11 existing API routes preserved');
