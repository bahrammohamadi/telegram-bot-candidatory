// Phase 14 — isolated personal task tracking for authenticated Telegram WebApp users.
// All data is private to the signed Telegram identity. No political campaign targeting.
const tasksReply=(result,status=200)=>new Response(JSON.stringify(result),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const taskUuid=id=>typeof id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
const taskAllowedPriorities=new Set(['low','normal','high']);
const taskAllowedStatuses=new Set(['open','doing','done']);
function taskDate(value){
 if(value===''||value===null)return null;
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const date=new Date(value+'T00:00:00Z');
 return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value?value:false;
}
function taskFields(data){
 const title=typeof data?.title==='string'?data.title.trim():null;
 const details=typeof data?.details==='string'?data.details.trim():null;
 const due=taskDate(data?.due_date);
 if(!title||title.length<3||title.length>180||details===null||details.length>1200||
 !taskAllowedPriorities.has(data?.priority)||due===false)return null;
 return {title,details,priority:data.priority,due_date:due};
}
async function taskLimit(db,uid){
 const premium=await db.prepare("SELECT 1 AS n FROM candidate_subscriptions_v2 WHERE telegram_id=? AND plan_id='professional' AND status='active' AND expires_at>datetime('now') LIMIT 1").bind(uid).first();
 return premium?100:10;
}
export async function handleTasks(db,user,data){
 const action=data?.action;
 if(action==='list'){
  const rows=await db.prepare("SELECT id,title,details,priority,status,due_date,created_at,updated_at,done_at,CASE WHEN status!='done' AND due_date IS NOT NULL AND due_date<date('now','+210 minutes') THEN 1 ELSE 0 END AS is_overdue FROM candidate_tasks_v1 WHERE telegram_id=? ORDER BY CASE status WHEN 'done' THEN 1 ELSE 0 END,CASE WHEN due_date IS NULL THEN 1 ELSE 0 END,due_date ASC,CASE priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END,created_at DESC LIMIT 100").bind(user.id).all();
  return tasksReply({ok:true,tasks:rows.results||[]});
 }
 if(action==='summary'){
  const [q,limit]=await Promise.all([
   db.prepare("SELECT COUNT(*) AS total,COALESCE(SUM(CASE WHEN status='open' THEN 1 ELSE 0 END),0) AS open,COALESCE(SUM(CASE WHEN status='doing' THEN 1 ELSE 0 END),0) AS doing,COALESCE(SUM(CASE WHEN status='done' THEN 1 ELSE 0 END),0) AS done,COALESCE(SUM(CASE WHEN status!='done' AND due_date<date('now','+210 minutes') THEN 1 ELSE 0 END),0) AS overdue FROM candidate_tasks_v1 WHERE telegram_id=?").bind(user.id).first(),
   taskLimit(db,user.id)
  ]);
  return tasksReply({ok:true,plan:limit===100?'professional':'free',limit,summary:{total:Number(q?.total||0),open:Number(q?.open||0),doing:Number(q?.doing||0),done:Number(q?.done||0),overdue:Number(q?.overdue||0)},remaining:Math.max(0,limit-Number(q?.total||0)),demo_only:true});
 }
 if(action==='create'){
  const fields=taskFields(data);
  if(!fields)return tasksReply({error:'INVALID_TASK'},400);
  const limit=await taskLimit(db,user.id);
  const count=await db.prepare('SELECT COUNT(*) AS n FROM candidate_tasks_v1 WHERE telegram_id=?').bind(user.id).first();
  if(Number(count?.n||0)>=limit)return tasksReply({error:'TASK_QUOTA_LIMIT',limit,remaining:0},429);
  const id=crypto.randomUUID();
  try{
   await db.batch([
    db.prepare('INSERT INTO candidate_users(telegram_id,display_name,username) VALUES(?,?,?) ON CONFLICT(telegram_id) DO NOTHING').bind(user.id,user.name,user.username),
    db.prepare("INSERT INTO candidate_tasks_v1(id,telegram_id,title,details,priority,status,due_date) VALUES(?,?,?,?,?,'open',?)").bind(id,user.id,fields.title,fields.details,fields.priority,fields.due_date)
   ]);
  }catch(error){
   if(String(error).includes('TASK_QUOTA_LIMIT'))return tasksReply({error:'TASK_QUOTA_LIMIT',limit,remaining:0},429);
   return tasksReply({error:'TASK_WRITE_FAILED'},503);
  }
  return tasksReply({ok:true,id},201);
 }
 if(!taskUuid(data?.id))return tasksReply({error:'INVALID_TASK_ID'},400);
 if(action==='update'){
  const fields=taskFields(data);
  if(!fields)return tasksReply({error:'INVALID_TASK'},400);
  const row=await db.prepare("UPDATE candidate_tasks_v1 SET title=?,details=?,priority=?,due_date=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND telegram_id=?").bind(fields.title,fields.details,fields.priority,fields.due_date,data.id,user.id).run();
  return row.meta?.changes===1?tasksReply({ok:true}):tasksReply({error:'TASK_NOT_FOUND'},404);
 }
 if(action==='status'){
  if(!taskAllowedStatuses.has(data?.status))return tasksReply({error:'INVALID_TASK_STATUS'},400);
  const row=await db.prepare("UPDATE candidate_tasks_v1 SET status=?,done_at=CASE WHEN ?='done' THEN CURRENT_TIMESTAMP ELSE NULL END,updated_at=CURRENT_TIMESTAMP WHERE id=? AND telegram_id=?").bind(data.status,data.status,data.id,user.id).run();
  return row.meta?.changes===1?tasksReply({ok:true,status:data.status}):tasksReply({error:'TASK_NOT_FOUND'},404);
 }
 if(action==='delete'){
  const row=await db.prepare('DELETE FROM candidate_tasks_v1 WHERE id=? AND telegram_id=?').bind(data.id,user.id).run();
  return row.meta?.changes===1?tasksReply({ok:true}):tasksReply({error:'TASK_NOT_FOUND'},404);
 }
 return tasksReply({error:'UNKNOWN_ACTION'},400);
}
