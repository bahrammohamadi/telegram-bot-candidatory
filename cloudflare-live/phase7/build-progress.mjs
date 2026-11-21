// Build-only: assemble phase 7 against exact, complete phase 6 deployed Worker snapshot.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
let source=read('../phase6/integration-deployed-snapshot-2026-11-02.mjs');
if(!source.endsWith('}};\n')||source.includes('--- TRUNCATED ---')||!source.includes('url.pathname==="/api/quiz"'))throw Error('Wrong or truncated baseline');
if(source.includes('url.pathname==="/api/progress"'))throw Error('Progress route already exists');
const api=read('./progress-api.mjs').replace('export async function handleProgress','async function handleProgress');
const route=`
  if(url.pathname==="/api/progress"&&request.method==="POST"){
    if(Number(request.headers.get("content-length")||0)>8000)return json({error:"REQUEST_TOO_LARGE"},413);
    let body;try{const raw=await request.text();if(raw.length>8000)return json({error:"REQUEST_TOO_LARGE"},413);body=JSON.parse(raw)}catch{return json({error:"BAD_JSON"},400)}
    const user=await telegramUser(body?.initData,env.TELEGRAM_BOT_TOKEN);
    if(!user)return json({error:"TELEGRAM_AUTH_REQUIRED"},401);
    try{return await handleProgress(env.DB,user,body)}catch{return json({error:"PROGRESS_DB_ERROR"},503)}
  }
`;
source=source.replace('const json=',api+'\nconst json=');
source=source.replace('  if(url.pathname==="/api/quiz"&&request.method==="POST"){',route+'  if(url.pathname==="/api/quiz"&&request.method==="POST"){');
const m=source.match(/^const TEST_PAGE=("(?:\\.|[^"\\])*");\n/);if(!m)throw Error('Embedded HTML missing');
let html=JSON.parse(m[1]);
const section='<section id="goals-panel"';
const marker='const goalsPanel=document.getElementById(\'goals-panel\')';
if(!html.includes(section)||!html.includes(marker))throw Error('Goals UI anchor changed');
html=html.replace(section,read('./progress-panel.html')+section);
html=html.replace('<h3>اهداف و پیگیری عملکرد</h3>','<h3>اهداف و پیگیری عملکرد</h3><button type="button" id="open-progress" class="secondary">مشاهده گزارش یکپارچه پیشرفت</button>');
html=html.replace(marker,read('./progress-ui.js')+'\n'+marker);
html=html.replace('</style>',".progress-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.progress-card,.progress-bar-card{border:1px solid #96a3b2;border-radius:12px;padding:12px;min-width:0;overflow-wrap:anywhere}.progress-number{font-size:21px;font-weight:700;padding:8px 0}.progress-bar-card{display:grid;gap:8px}.progress-bar-card progress{width:100%;height:18px;accent-color:#24554c}#progress-export{min-height:170px;font-size:12px;direction:rtl}.progress-card small{display:block}@media(max-width:340px){.progress-cards{grid-template-columns:1fr}}</style>");
source=source.replace(m[0],'const TEST_PAGE='+JSON.stringify(html)+';\n');
if(!source.includes('url.pathname==="/api/progress"')||!source.includes('id=\\"progress-panel\\"')||!source.includes('id=\\"quiz-panel\\"'))throw Error('Progress integration incomplete');
mkdirSync(new URL('./dist/',import.meta.url),{recursive:true});
writeFileSync(new URL('./dist/integration-progress-worker.mjs',import.meta.url),source);
console.log('PASS: progress Worker built with profile, goals, calendar, practice and quiz routes retained');
