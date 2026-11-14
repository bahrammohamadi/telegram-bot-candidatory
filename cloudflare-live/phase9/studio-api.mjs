// Authenticated content drafts for neutral, factual public information. No auto-publication.
const studioKinds=new Set(['service_update','meeting_notice','fact_correction','civic_education']);
const studioResponse=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const studioId=id=>typeof id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
function validDraft(b){
 if(!studioKinds.has(b?.kind)||typeof b?.title!=='string'||b.title.trim().length<3||b.title.length>160||
 typeof b?.body!=='string'||b.body.trim().length<10||b.body.length>4000||
 typeof b?.source_url!=='string'||b.source_url.length>800||
 !['draft','reviewed'].includes(b?.status))return false;
 if(b.source_url){
  try{const u=new URL(b.source_url);if(u.protocol!=='https:'||u.username||u.password||u.hostname.length<4)return false}
  catch{return false}
 }
 return true;
}
export async function handleStudio(db,user,b){
 if(b?.action==='list'){
  const q=await db.prepare('SELECT id,kind,title,body,source_url,status,created_at,updated_at FROM public_content_drafts_v1 WHERE telegram_id=? ORDER BY updated_at DESC,id DESC LIMIT 100').bind(user.id).all();
  return studioResponse({ok:true,drafts:q.results||[]});
 }
 if(b?.action==='create'){
  if(!validDraft(b))return studioResponse({error:'INVALID_DRAFT'},400);
  const count=await db.prepare('SELECT COUNT(*) AS n FROM public_content_drafts_v1 WHERE telegram_id=?').bind(user.id).first();
  if((count?.n||0)>=100)return studioResponse({error:'DRAFT_LIMIT_REACHED'},429);
  const id=crypto.randomUUID();
  await db.batch([
   db.prepare('INSERT INTO candidate_users(telegram_id,display_name,username) VALUES(?,?,?) ON CONFLICT(telegram_id) DO NOTHING').bind(user.id,user.name,user.username),
   db.prepare('INSERT INTO public_content_drafts_v1(id,telegram_id,kind,title,body,source_url,status) VALUES(?,?,?,?,?,?,?)').bind(id,user.id,b.kind,b.title.trim(),b.body.trim(),b.source_url,b.status)
  ]);
  return studioResponse({ok:true,id},201);
 }
 if(b?.action==='update'){
  if(!studioId(b.id)||!validDraft(b))return studioResponse({error:'INVALID_DRAFT'},400);
  const q=await db.prepare('UPDATE public_content_drafts_v1 SET kind=?,title=?,body=?,source_url=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND telegram_id=?').bind(b.kind,b.title.trim(),b.body.trim(),b.source_url,b.status,b.id,user.id).run();
  return q.meta?.changes?studioResponse({ok:true}):studioResponse({error:'DRAFT_NOT_FOUND'},404);
 }
 if(b?.action==='delete'){
  if(!studioId(b?.id))return studioResponse({error:'INVALID_DRAFT_ID'},400);
  const q=await db.prepare('DELETE FROM public_content_drafts_v1 WHERE id=? AND telegram_id=?').bind(b.id,user.id).run();
  return q.meta?.changes?studioResponse({ok:true}):studioResponse({error:'DRAFT_NOT_FOUND'},404);
 }
 return studioResponse({error:'UNKNOWN_ACTION'},400);
}
