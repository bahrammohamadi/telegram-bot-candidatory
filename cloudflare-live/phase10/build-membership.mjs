// Reproducible test-only integration of subscription demonstration + two-admin review.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
let src=read('../phase9/integration-deployed-snapshot-2026-11-02.mjs');
if(!src.endsWith('}};\n')||src.includes('--- TRUNCATED ---')||!src.includes('url.pathname==="/api/studio"'))throw Error('Wrong or truncated Worker baseline');
if(src.includes('url.pathname==="/api/membership"'))throw Error('Duplicate membership handler');
const module=read('./membership-api.mjs').replace('export async function handleMembership','async function handleMembership');
const handler=`
  if(url.pathname==="/api/membership"&&request.method==="POST"){
    if(Number(request.headers.get("content-length")||0)>9000)return json({error:"REQUEST_TOO_LARGE"},413);
    let body;try{const raw=await request.text();if(raw.length>9000)return json({error:"REQUEST_TOO_LARGE"},413);body=JSON.parse(raw)}catch{return json({error:"BAD_JSON"},400)}
    const user=await telegramUser(body?.initData,env.TELEGRAM_BOT_TOKEN);
    if(!user)return json({error:"TELEGRAM_AUTH_REQUIRED"},401);
    try{return await handleMembership(env.DB,user,body,env)}catch{return json({error:"MEMBERSHIP_DB_ERROR"},503)}
  }
`;
src=src.replace('const json=',module+'\nconst json=');
src=src.replace('  if(url.pathname==="/api/studio"&&request.method==="POST"){',handler+'  if(url.pathname==="/api/studio"&&request.method==="POST"){');
const m=src.match(/^const TEST_PAGE=("(?:\\.|[^"\\])*");\n/);
if(!m)throw Error('Embedded HTML missing');
let html=JSON.parse(m[1]);
if(!html.includes('<section id="dashboard"')||!html.includes('<section id="progress-panel"')||!html.includes("const studioPanel=document.getElementById('studio-panel')"))throw Error('Existing UI markers changed');
html=html.replace('<section id="progress-panel"',read('./membership-panel.html')+'<section id="progress-panel"');
html=html.replace('<div class="modules">','<button type="button" id="open-membership" class="secondary">اشتراک و مدیریت درخواست آزمایشی</button><div class="modules">');
html=html.replace("const studioPanel=document.getElementById('studio-panel')",read('./membership-ui.js')+"\nconst studioPanel=document.getElementById('studio-panel')");
html=html.replace('</style>',".membership-plans{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.membership-plans article,.membership-card{border:1px solid #96a3b2;border-radius:12px;padding:12px;margin:9px 0;overflow-wrap:anywhere}.membership-card{display:grid;gap:7px}.membership-card button{min-width:0}.membership-plans small{display:block}#membership-admin{border:1px solid #96a3b2;border-radius:12px;padding:10px}@media(max-width:340px){.membership-plans{grid-template-columns:1fr}}</style>");
src=src.replace(m[0],'const TEST_PAGE='+JSON.stringify(html)+';\n');
if(!src.includes('url.pathname==="/api/membership"')||!src.includes('id=\\"membership-panel\\"')||!src.includes('id=\\"studio-panel\\"'))throw Error('Membership integration incomplete');
mkdirSync(new URL('./dist/',import.meta.url),{recursive:true});
writeFileSync(new URL('./dist/integration-membership-worker.mjs',import.meta.url),src);
console.log('PASS: isolated demo membership UI/API built with all previous modules preserved');
