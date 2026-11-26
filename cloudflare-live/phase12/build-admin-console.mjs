// Build only: extend the complete isolated phase-11 Worker with read-only admin diagnostics.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
let source=read('../phase11/integration-deployed-snapshot-2026-11-02.mjs');
if(source.length!==105553||!source.endsWith('}};\n')||!source.includes('url.pathname==="/api/entitlements"')||!source.includes('url.pathname==="/api/membership"'))throw Error('Unexpected phase 11 baseline');
if(source.includes('url.pathname==="/api/admin-console"'))throw Error('Admin console already installed');
const api=read('./admin-console-api.mjs').replace('export async function handleAdminConsole','async function handleAdminConsole');
const route=`
  if(url.pathname==="/api/admin-console"&&request.method==="POST"){
    if(Number(request.headers.get("content-length")||0)>9000)return json({error:"REQUEST_TOO_LARGE"},413);
    let body;try{const raw=await request.text();if(raw.length>9000)return json({error:"REQUEST_TOO_LARGE"},413);body=JSON.parse(raw)}catch{return json({error:"BAD_JSON"},400)}
    const user=await telegramUser(body?.initData,env.TELEGRAM_BOT_TOKEN);
    if(!user)return json({error:"TELEGRAM_AUTH_REQUIRED"},401);
    try{return await handleAdminConsole(env.DB,user,body,env)}catch{return json({error:"ADMIN_CONSOLE_DB_ERROR"},503)}
  }
`;
source=source.replace('const json=',api+'\nconst json=');
const membershipRoute='  if(url.pathname==="/api/membership"&&request.method==="POST"){';
if(!source.includes(membershipRoute))throw Error('Membership route missing');
source=source.replace(membershipRoute,route+membershipRoute);
const match=source.match(/^const TEST_PAGE=("(?:\\.|[^"\\])*");\n/);
if(!match)throw Error('Embedded HTML missing');
let html=JSON.parse(match[1]);
const panelAnchor='<div id="membership-admin-queue" role="list"></div>';
const jsAnchor="const membershipPanel=document.getElementById('membership-panel')";
const adminRefresh='if(data.is_admin)await membershipAdminRefresh();';
if(!html.includes(panelAnchor)||!html.includes(jsAnchor)||!html.includes(adminRefresh))throw Error('Membership anchors changed');
html=html.replace(panelAnchor,panelAnchor+read('./admin-console-panel.html'));
html=html.replace(jsAnchor,read('./admin-console-ui.js')+'\n'+jsAnchor);
html=html.replace(adminRefresh,'if(data.is_admin){await membershipAdminRefresh();await adminConsoleRefresh()}');
const onDecision='await membershipAdminRefresh();\n     }catch(e){';
if(!html.includes(onDecision))throw Error('Admin decision refresh anchor changed');
html=html.replace(onDecision,'await membershipAdminRefresh();await adminConsoleRefresh();\n     }catch(e){');
html=html.replace('</style>',".admin-console-summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.admin-console-card{border:1px solid #96a3b2;border-radius:10px;padding:10px;overflow-wrap:anywhere;margin:7px 0}.admin-console-summary>.admin-console-card{margin:0}.admin-console-card p{margin:5px 0}.admin-console-card small{display:block}.admin-console-summary small{grid-column:1/-1}@media(max-width:340px){.admin-console-summary{grid-template-columns:1fr}}</style>");
source=source.replace(match[0],'const TEST_PAGE='+JSON.stringify(html)+';\n');
if(!source.includes('url.pathname==="/api/admin-console"')||!source.includes('id=\\"admin-console-dashboard\\"')||!source.includes('id=\\"membership-admin\\"'))throw Error('Incomplete admin console integration');
for(const path of ['/api/profile','/api/calendar','/api/goals','/api/practice','/api/quiz','/api/progress','/api/studio','/api/membership','/api/entitlements'])if(!source.includes(path))throw Error('Previously deployed route missing '+path);
mkdirSync(new URL('./dist/',import.meta.url),{recursive:true});
writeFileSync(new URL('./dist/integration-admin-console-worker.mjs',import.meta.url),source);
console.log('PASS: isolated test Worker built with fail-closed two-admin console and existing modules preserved');
