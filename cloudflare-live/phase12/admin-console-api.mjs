// Test-only, read-only admin operations. Two valid Telegram IDs are required in a private secret.
// Never infer admin identity from UI-supplied IDs; no real receipts or payments can appear here.
const adminConsoleReply=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});
const adminConsoleSafeLimit=value=>Number.isInteger(value)&&value>0&&value<=50?value:30;
export async function handleAdminConsole(db,user,body,env){
 if(!demoAdminAllowed(user,env))return adminConsoleReply({error:'ADMIN_ACCESS_DENIED'},403);
 const action=body?.action;
 if(action==='overview'){
  const [requests,audits,active,users]=await Promise.all([
   db.prepare("SELECT COUNT(*) AS total,COALESCE(SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END),0) AS pending,COALESCE(SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END),0) AS approved,COALESCE(SUM(CASE WHEN status='rejected' THEN 1 ELSE 0 END),0) AS rejected FROM manual_payment_requests_v2 WHERE receipt_file_id=?").bind(MEMBERSHIP_DEMO_RECEIPT).first(),
   db.prepare("SELECT COUNT(*) AS total FROM admin_audit WHERE record_type='demo_request' AND action IN ('demo_approve','demo_reject')").first(),
   db.prepare("SELECT COUNT(*) AS total FROM candidate_subscriptions_v2 WHERE plan_id='professional' AND status='active' AND expires_at>datetime('now')").first(),
   db.prepare("SELECT COUNT(*) AS total FROM candidate_users").first()
  ]);
  return adminConsoleReply({
   ok:true,mode:'isolated_demo_only',real_payments_enabled:false,receipt_upload_available:false,
   requests:{total:Number(requests?.total||0),pending:Number(requests?.pending||0),approved:Number(requests?.approved||0),rejected:Number(requests?.rejected||0)},
   decisions_logged:Number(audits?.total||0),
   demo_professional_accounts:Number(active?.total||0),
   test_accounts:Number(users?.total||0),
   admin_configuration:'valid_two_id_secret',
   generated_at:new Date().toISOString()
  });
 }
 if(action==='requests'){
  if(!['all','pending','approved','rejected'].includes(body?.status))return adminConsoleReply({error:'INVALID_FILTER'},400);
  const limit=adminConsoleSafeLimit(body?.limit);
  const offset=Number.isInteger(body?.offset)&&body.offset>=0&&body.offset<=500?body.offset:0;
  const list=body.status==='all'
   ?await db.prepare("SELECT id,telegram_id,reference,plan_id,status,created_at,reviewed_at,admin_id FROM manual_payment_requests_v2 WHERE receipt_file_id=? ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?").bind(MEMBERSHIP_DEMO_RECEIPT,limit,offset).all()
   :await db.prepare("SELECT id,telegram_id,reference,plan_id,status,created_at,reviewed_at,admin_id FROM manual_payment_requests_v2 WHERE receipt_file_id=? AND status=? ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?").bind(MEMBERSHIP_DEMO_RECEIPT,body.status,limit,offset).all();
  return adminConsoleReply({ok:true,mode:'isolated_demo_only',filter:body.status,offset,limit,requests:list.results||[]});
 }
 if(action==='audit'){
  const limit=adminConsoleSafeLimit(body?.limit);
  const list=await db.prepare("SELECT id,actor_id,action,record_id,created_at,detail FROM admin_audit WHERE record_type='demo_request' AND action IN ('demo_approve','demo_reject') ORDER BY created_at DESC,id DESC LIMIT ?").bind(limit).all();
  return adminConsoleReply({ok:true,mode:'isolated_demo_only',entries:list.results||[]});
 }
 if(action==='verify'){
  const q=await db.prepare("SELECT COUNT(*) AS n FROM manual_payment_requests_v2 p WHERE p.receipt_file_id=? AND p.status IN ('approved','rejected') AND NOT EXISTS (SELECT 1 FROM admin_audit a WHERE a.record_type='demo_request' AND a.record_id=p.id AND a.action IN ('demo_approve','demo_reject'))").bind(MEMBERSHIP_DEMO_RECEIPT).first();
  return adminConsoleReply({ok:true,mode:'isolated_demo_only',reviewed_without_audit:Number(q?.n||0),note:'READ_ONLY_DIAGNOSTIC_NOT_PAYMENT_VERIFICATION'});
 }
 return adminConsoleReply({error:'UNKNOWN_ACTION'},400);
}
