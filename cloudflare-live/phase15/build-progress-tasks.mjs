// Phase 15: integrate owner-scoped task metrics into existing progress overview.
// Produces a candidate bundle only. Does not touch Cloudflare or production.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const source=read('../phase14/integration-deployed-snapshot-2026-11-03.mjs');
const anchor='const [profile,goals,calendar,practice,quizzes,availableQuizzes]=await Promise.all([';
const queryAnchor='    db.prepare("SELECT COUNT(*) AS n FROM quizzes WHERE published=1 AND id IN (SELECT quiz_id FROM quiz_questions GROUP BY quiz_id HAVING count(*) BETWEEN 2 AND 20)").first()';
const responseAnchor='    quizzes:{attempts:safeNumber(quizzes?.attempts),unique_quizzes:safeNumber(quizzes?.unique_quizzes),available_quizzes:safeNumber(availableQuizzes?.n),correct_answers:safeNumber(quizzes?.correct_answers),answered_questions:totalAnswers,correct_percentage:totalAnswers?Math.round(1000*safeNumber(quizzes?.correct_answers)/totalAnswers)/10:null}';
const reportAnchor="progressCard('اهداف',progressFormat(g.completed)+' / '+progressFormat(g.total),progressFormat(g.overdue)+' هدف باز با مهلت گذشته');";
const exportAnchor="'اهداف: '+g.completed+' از '+g.total+' انجام‌شده؛ '+g.overdue+' دارای مهلت گذشته',";
const healthQuery='SELECT count(*) AS n FROM sqlite_master WHERE type=\'table\' AND name=\'candidate_users\'';
const healthQueryReplacement='SELECT 1 AS ready FROM candidate_users LIMIT 1';
const healthResult='schemaReady:x?.n===1';
const healthResultReplacement='schemaReady:true';
const count=(s,needle)=>s.split(needle).length-1;
const originalHtml=source.match(/^const TEST_PAGE=("(?:\\.|[^"\\])*");\n/);
if(!originalHtml)throw Error('Embedded HTML missing');
let html=JSON.parse(originalHtml[1]);
const required=[[source,healthQuery],[source,healthResult],[source,anchor],[source,queryAnchor],[source,responseAnchor],[html,reportAnchor],[html,exportAnchor]];
for(const [s,needle] of required)if(count(s,needle)!==1)throw Error('Missing or duplicate anchor: '+needle.slice(0,80));
let patched=source.replace(anchor,'const [profile,goals,calendar,practice,quizzes,availableQuizzes,tasks]=await Promise.all([')
 .replace(queryAnchor,queryAnchor+',\n    db.prepare("SELECT COUNT(*) AS total,COALESCE(SUM(CASE WHEN status IN (\'done\',\'completed\') THEN 1 ELSE 0 END),0) AS completed,COALESCE(SUM(CASE WHEN status=\'doing\' THEN 1 ELSE 0 END),0) AS doing,COALESCE(SUM(CASE WHEN (status IS NULL OR status NOT IN (\'done\',\'completed\')) AND due_date IS NOT NULL AND date(due_date)<date(\'now\',\'+210 minutes\') THEN 1 ELSE 0 END),0) AS overdue FROM candidate_tasks_v1 WHERE telegram_id=?").bind(id).first()')
 .replace(responseAnchor,responseAnchor+',\n    tasks:{total:safeNumber(tasks?.total),completed:safeNumber(tasks?.completed),doing:safeNumber(tasks?.doing),overdue:safeNumber(tasks?.overdue)}');
html=html.replace(reportAnchor,reportAnchor+"\n  progressCard('وظایف شخصی',progressFormat(data.tasks.completed)+' / '+progressFormat(data.tasks.total),progressFormat(data.tasks.doing)+' در حال انجام؛ '+progressFormat(data.tasks.overdue)+' عقب‌افتاده');")
 .replace(exportAnchor,exportAnchor+"\n    'وظایف: '+data.tasks.completed+' از '+data.tasks.total+' انجام‌شده؛ '+data.tasks.doing+' در حال انجام؛ '+data.tasks.overdue+' عقب‌افتاده',");
// Visual-only refresh of the same embedded miniapp, preserving all existing routes and handlers.
const visualCss=read('./mobile-ui-refresh.css');
if(!html.includes('</style>'))throw Error('Embedded style block missing');
if(!visualCss.includes('.modules button')||!visualCss.includes('@media(max-width:420px)'))throw Error('Incomplete responsive theme');
html=html.replace('</style>','\\n'+visualCss+'</style>');
patched=patched.replace(healthQuery,healthQueryReplacement).replace(healthResult,healthResultReplacement);
patched=patched.replace(originalHtml[0],'const TEST_PAGE='+JSON.stringify(html)+';\n');
if(!patched.includes(healthQueryReplacement)||!patched.includes(healthResultReplacement))throw Error('Quota-light health patch failed');
if(!patched.includes("AS overdue FROM candidate_tasks_v1 WHERE telegram_id=?"))throw Error('Task SQL scope check failed');
for(const route of ['/api/tasks','/api/progress','/api/assistant','/api/admin-console'])if(!patched.includes(route))throw Error('Route missing: '+route);
mkdirSync(new URL('./dist/',import.meta.url),{recursive:true});
writeFileSync(new URL('./dist/integration-progress-tasks-worker.mjs',import.meta.url),patched);
console.log('PASS: phase15 candidate assembled with signed-owner task progress and unchanged API routes');
