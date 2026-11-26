// Authenticated, owner-scoped practice sessions. No AI or speech-scoring claims.
export const PRACTICE_EXERCISES = Object.freeze({
  speech_clear: {kind:"speech", title:"بیان روشن یک مسئله عمومی"},
  speech_evidence: {kind:"speech", title:"گزارش یک پروژه با داده و منبع"},
  qa_unknown: {kind:"qa", title:"پاسخ صادقانه هنگام نبود اطلاعات کافی"},
  qa_followup: {kind:"qa", title:"پاسخگویی و پیگیری درخواست شهروندان"}
});
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});
export async function handlePractice(db,user,body){
  if(body?.action==="list"){
    const rows=await db.prepare("SELECT id,exercise_key,kind,response_text,reflection,self_score,duration_seconds,created_at FROM practice_sessions_v1 WHERE telegram_id=? ORDER BY created_at DESC,id DESC LIMIT 100").bind(user.id).all();
    return reply({ok:true,sessions:rows.results||[]});
  }
  if(body?.action==="create"){
    const k=body.exercise_key,ex=Object.hasOwn(PRACTICE_EXERCISES,k)?PRACTICE_EXERCISES[k]:null;
    const response=body.response_text,reflection=body.reflection,score=body.self_score,duration=body.duration_seconds;
    if(!ex||typeof response!=="string"||response.length>3000||typeof reflection!=="string"||reflection.length>1000||
       (response.trim().length<5&&reflection.trim().length<5)||
       !Number.isInteger(score)||score<1||score>5||
       !Number.isInteger(duration)||duration<0||duration>900)return reply({error:"INVALID_PRACTICE"},400);
    const existing=await db.prepare("SELECT COUNT(*) AS n FROM practice_sessions_v1 WHERE telegram_id=?").bind(user.id).first();
    if((existing?.n||0)>=200)return reply({error:"PRACTICE_LIMIT_REACHED"},429);
    const id=crypto.randomUUID();
    await db.batch([
      db.prepare("INSERT INTO candidate_users(telegram_id,display_name,username) VALUES(?,?,?) ON CONFLICT(telegram_id) DO NOTHING").bind(user.id,user.name,user.username),
      db.prepare("INSERT INTO practice_sessions_v1(id,telegram_id,exercise_key,kind,response_text,reflection,self_score,duration_seconds) VALUES(?,?,?,?,?,?,?,?)").bind(id,user.id,k,ex.kind,response,reflection,score,duration)
    ]);
    return reply({ok:true,id},201);
  }
  if(body?.action==="delete"){
    if(typeof body.id!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.id))return reply({error:"INVALID_SESSION_ID"},400);
    const r=await db.prepare("DELETE FROM practice_sessions_v1 WHERE id=? AND telegram_id=?").bind(body.id,user.id).run();
    return r.meta?.changes?reply({ok:true}):reply({error:"SESSION_NOT_FOUND"},404);
  }
  return reply({error:"UNKNOWN_ACTION"},400);
}
