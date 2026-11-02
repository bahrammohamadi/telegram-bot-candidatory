// Reproducible phase 13 test Worker build, no production changes.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
let src=read('../phase12/integration-deployed-snapshot-2026-11-02.mjs');
if(src.length!==117990||!src.endsWith('}};\n')||!src.includes('url.pathname==="/api/admin-console"'))throw Error('Wrong or incomplete previous Worker snapshot');
if(src.includes('url.pathname==="/api/assistant"'))throw Error('Assistant already installed');
const mod=read('./assistant-api.mjs').replace('export async function handleAssistant','async function handleAssistant');
const route=`
  if(url.pathname==="/api/assistant"&&request.method==="POST"){
    if(Number(request.headers.get("content-length")||0)>5000)return json({error:"REQUEST_TOO_LARGE"},413);
    let body;try{const raw=await request.text();if(raw.length>5000)return json({error:"REQUEST_TOO_LARGE"},413);body=JSON.parse(raw)}catch{return json({error:"BAD_JSON"},400)}
    const user=await telegramUser(body?.initData,env.TELEGRAM_BOT_TOKEN);
    if(!user)return json({error:"TELEGRAM_AUTH_REQUIRED"},401);
    try{return await handleAssistant(env.DB,user,body,env)}catch{return json({error:"ASSISTANT_DB_ERROR"},503)}
  }
`;
src=src.replace('const json=',mod+'\nconst json=');
const anchor='  if(url.pathname==="/api/admin-console"&&request.method==="POST"){';
if(!src.includes(anchor))throw Error('Missing admin route');
src=src.replace(anchor,route+anchor);
const m=src.match(/^const TEST_PAGE=("(?:\\.|[^"\\])*");\n/);
if(!m)throw Error('Embedded HTML missing');
let html=JSON.parse(m[1]);
const section='<section id="membership-panel"';
const jsAnchor="const adminConsoleRoot=document.getElementById('admin-console-dashboard')";
const navigation="if(b.dataset.module==='تقویم و جلسات'){openCalendar();return}";
if(!html.includes(section)||!html.includes(jsAnchor)||!html.includes(navigation))throw Error('Unexpected app HTML anchors');
html=html.replace(section,read('./assistant-panel.html')+section);
html=html.replace(jsAnchor,read('./assistant-ui.js')+'\n'+jsAnchor);
html=html.replace(navigation,navigation+"if(b.dataset.module==='دستیار هوشمند'){openAssistant();return}");
html=html.replace('</style>',".assistant-option{display:block;padding:9px;border:1px solid #96a3b2;border-radius:10px;margin:7px 0}#assistant-result-text p{white-space:pre-wrap;overflow-wrap:anywhere}#assistant-form textarea{min-height:110px}#assistant-ai-state{border:1px solid #96a3b2;border-radius:10px;padding:10px}</style>");
src=src.replace(m[0],'const TEST_PAGE='+JSON.stringify(html)+';\n');
if(!src.includes('url.pathname==="/api/assistant"')||!src.includes('id=\\"assistant-panel\\"')||!src.includes('id=\\"studio-panel\\"'))throw Error('Assistant build incomplete');
const routes=['/api/profile','/api/calendar','/api/goals','/api/practice','/api/quiz','/api/progress','/api/studio','/api/membership','/api/entitlements','/api/admin-console'];
if(!routes.every(x=>src.includes(x)))throw Error('Prior features missing');
mkdirSync(new URL('./dist/',import.meta.url),{recursive:true});
writeFileSync(new URL('./dist/integration-assistant-worker.mjs',import.meta.url),src);
console.log('PASS: non-persistent assistant UI/API integrated, AI disabled unless explicitly enabled in Worker environment');
