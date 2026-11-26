// Test-only subscription workflow. NO real payment acceptance, no receipts uploaded, no automatic grants.
// Two approved Telegram admin IDs must be passed through a private secret binding; fail closed otherwise.
const MEMBERSHIP_DEMO_RECEIPT='SIMULATED_NO_FILE';
const MEMBERSHIP_DEMO_PLAN='professional';
const MEMBERSHIP_DEMO_DURATION_DAYS=30;
const membershipReply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
function demoAdminAllowed(user,env){
 const raw=env?.CANDIDATORY_TEST_ADMIN_IDS;
 if(typeof raw!=='string')return false;
 const ids=raw.split(',').map(x=>x.trim());
 if(ids.length!==2||ids[0]===ids[1]||ids.some(x=>!/^[1-9][0-9]{4,18}$/.test(x)))return false;
 return ids.includes(String(user.id));
}
function demoRequestId(value){
 return typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
export async function handleMembership(db,user,body,env={}){
 const admin=demoAdminAllowed(user,env);
 if(body?.action==='status'){
  const sub=await db.prepare("SELECT plan_id,status,expires_at,source,CASE WHEN plan_id='professional' AND status='active' AND expires_at>datetime('now') THEN 'professional' ELSE 'free' END AS effective_plan FROM candidate_subscriptions_v2 WHERE telegram_id=?").bind(user.id).first();
  const req=await db.prepare("SELECT id,plan_id,reference,status,created_at,reviewed_at FROM manual_payment_requests_v2 WHERE telegram_id=? AND receipt_file_id=? ORDER BY created_at DESC,id DESC LIMIT 10").bind(user.id,MEMBERSHIP_DEMO_RECEIPT).all();
  return membershipReply({ok:true,mode:'isolated_demo_no_real_payment',is_admin:admin,plan:sub?.effective_plan||'free',subscription:sub||null,requests:req.results||[],price_toman:6900000,duration_days:MEMBERSHIP_DEMO_DURATION_DAYS,receipt_upload_available:false,real_payments_enabled:false});
 }
 if(body?.action==='demo_request'){
  const pending=await db.prepare("SELECT id FROM manual_payment_requests_v2 WHERE telegram_id=? AND receipt_file_id=? AND status='pending' LIMIT 1").bind(user.id,MEMBERSHIP_DEMO_RECEIPT).first();
  if(pending)return membershipReply({error:'DEMO_REQUEST_ALREADY_PENDING'},409);
  const lastDay=await db.prepare("SELECT COUNT(*) AS n FROM manual_payment_requests_v2 WHERE telegram_id=? AND receipt_file_id=? AND created_at>=datetime('now','-1 day')").bind(user.id,MEMBERSHIP_DEMO_RECEIPT).first();
  if((lastDay?.n||0)>=3)return membershipReply({error:'DEMO_REQUEST_LIMIT'},429);
  const id=crypto.randomUUID(),reference='DEMO-'+crypto.randomUUID().slice(0,12).toUpperCase();
  try{
   await db.batch([
    db.prepare("INSERT INTO candidate_users(telegram_id,display_name,username) VALUES(?,?,?) ON CONFLICT(telegram_id) DO NOTHING").bind(user.id,user.name,user.username),
    db.prepare("INSERT INTO manual_payment_requests_v2(id,telegram_id,plan_id,reference,receipt_file_id,status) VALUES(?,?,'professional',?,?,'pending')").bind(id,user.id,reference,MEMBERSHIP_DEMO_RECEIPT)
   ]);
  }catch{return membershipReply({error:'DEMO_REQUEST_CONFLICT'},409)}
  return membershipReply({ok:true,id,reference,status:'pending',note:'DEMONSTRATION_ONLY_NO_PAYMENT'},201);
 }
 if(!admin)return membershipReply({error:'ADMIN_ACCESS_DENIED'},403);
 if(body?.action==='admin_queue'){
  const q=await db.prepare("SELECT id,telegram_id,plan_id,reference,status,created_at FROM manual_payment_requests_v2 WHERE receipt_file_id=? AND status='pending' ORDER BY created_at DESC,id DESC LIMIT 50").bind(MEMBERSHIP_DEMO_RECEIPT).all();
  return membershipReply({ok:true,requests:q.results||[],mode:'isolated_demo_only'});
 }
 if(body?.action==='admin_decide'){
  if(!demoRequestId(body.id)||!['approved','rejected'].includes(body.decision))return membershipReply({error:'INVALID_DECISION'},400);
  const request=await db.prepare("SELECT id,telegram_id,status,receipt_file_id FROM manual_payment_requests_v2 WHERE id=? AND receipt_file_id=? LIMIT 1").bind(body.id,MEMBERSHIP_DEMO_RECEIPT).first();
  if(!request)return membershipReply({error:'REQUEST_NOT_FOUND'},404);
  if(request.status!=='pending')return membershipReply({error:'REQUEST_ALREADY_REVIEWED'},409);
  const statements=[
    db.prepare("UPDATE manual_payment_requests_v2 SET status=?,admin_id=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending' AND receipt_file_id=?").bind(body.decision,user.id,body.id,MEMBERSHIP_DEMO_RECEIPT)
  ];
  if(body.decision==='approved'){
    statements.push(db.prepare("INSERT INTO candidate_subscriptions_v2(telegram_id,plan_id,status,expires_at,source,updated_at) VALUES(?,'professional','active',datetime('now','+30 days'),'admin',CURRENT_TIMESTAMP) ON CONFLICT(telegram_id) DO UPDATE SET plan_id='professional',status='active',expires_at=excluded.expires_at,source='admin',updated_at=CURRENT_TIMESTAMP").bind(request.telegram_id));
  }
  statements.push(db.prepare("INSERT INTO admin_audit(id,workspace_id,actor_id,action,record_type,record_id,detail) VALUES(?,NULL,?,?,?,?,?)").bind(body.id,user.id,body.decision==='approved'?'demo_approve':'demo_reject','demo_request',body.id,'ISOLATED_TEST_NO_REAL_PAYMENT'));
  try{const result=await db.batch(statements);
    if(result[0]?.meta?.changes!==1)return membershipReply({error:'REQUEST_ALREADY_REVIEWED'},409);
  }catch{return membershipReply({error:'DECISION_CONFLICT'},409)}
  return membershipReply({ok:true,status:body.decision,mode:'isolated_demo_no_payment'});
 }
 return membershipReply({error:'UNKNOWN_ACTION'},400);
}
