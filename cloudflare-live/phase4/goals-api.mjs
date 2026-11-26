// Module to embed inside the isolated integration Worker after auth checks.
// Needs the verified Telegram user and the isolated D1 binding.
export async function handleGoals(db, user, b) {
  const response=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});
  if(b.action==="list"){
    const rows=await db.prepare("SELECT id,title,details,target_date,status FROM personal_goals_v2 WHERE telegram_id=? ORDER BY created_at DESC LIMIT 100").bind(user.id).all();
    return response({ok:true,goals:rows.results||[]});
  }
  if(b.action==="create"){
    if(typeof b.title!=="string"||b.title.trim().length<3||b.title.length>180||typeof b.details!=="string"||b.details.length>1000||typeof b.target_date!=="string"||(b.target_date!==""&&!/^\d{4}-\d{2}-\d{2}$/.test(b.target_date)))return response({error:"INVALID_GOAL"},400);
    const id=crypto.randomUUID();
    await db.batch([
      db.prepare("INSERT INTO candidate_users(telegram_id,display_name,username) VALUES(?,?,?) ON CONFLICT(telegram_id) DO NOTHING").bind(user.id,user.name,user.username),
      db.prepare("INSERT INTO personal_goals_v2(id,telegram_id,title,details,target_date,status) VALUES(?,?,?,?,?,'open')").bind(id,user.id,b.title.trim(),b.details,b.target_date||null)
    ]);
    return response({ok:true,id},201);
  }
  if(typeof b.id!=="string"||!/^[0-9a-f-]{36}$/i.test(b.id))return response({error:"INVALID_GOAL_ID"},400);
  if(b.action==="status"&&["open","done"].includes(b.status)){
    const r=await db.prepare("UPDATE personal_goals_v2 SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND telegram_id=?").bind(b.status,b.id,user.id).run();
    return r.meta?.changes?response({ok:true}):response({error:"GOAL_NOT_FOUND"},404);
  }
  if(b.action==="delete"){
    const r=await db.prepare("DELETE FROM personal_goals_v2 WHERE id=? AND telegram_id=?").bind(b.id,user.id).run();
    return r.meta?.changes?response({ok:true}):response({error:"GOAL_NOT_FOUND"},404);
  }
  return response({error:"UNKNOWN_ACTION"},400);
}
