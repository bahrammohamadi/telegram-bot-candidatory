// Phase 11: test-only subscription limits. The database, never the client, determines the plan.
// These quotas are provisional product rules, not live paid entitlements.
export const DEMO_PLAN_LIMITS=Object.freeze({
  free:Object.freeze({goals:5,calendar:10,practice:10,studio:3,quiz_daily:2}),
  professional:Object.freeze({goals:100,calendar:100,practice:200,studio:100,quiz_daily:20})
});
const DEMO_QUOTA_QUERIES=Object.freeze({
  goals:"SELECT COUNT(*) AS n FROM personal_goals_v2 WHERE telegram_id=?",
  calendar:"SELECT COUNT(*) AS n FROM personal_calendar_v1 WHERE telegram_id=?",
  practice:"SELECT COUNT(*) AS n FROM practice_sessions_v1 WHERE telegram_id=?",
  studio:"SELECT COUNT(*) AS n FROM public_content_drafts_v1 WHERE telegram_id=?",
  quiz_daily:"SELECT COUNT(*) AS n FROM quiz_attempts WHERE telegram_id=? AND submitted_at >= datetime('now','-1 day')"
});
const quotaResponse=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});
export async function effectiveDemoPlan(db,telegramId){
 const result=await db.prepare("SELECT plan_id FROM candidate_subscriptions_v2 WHERE telegram_id=? AND plan_id='professional' AND status='active' AND expires_at>datetime('now') LIMIT 1").bind(telegramId).first();
 return result?.plan_id==='professional'?'professional':'free';
}
async function demoUsage(db,telegramId,key){
 if(!Object.hasOwn(DEMO_QUOTA_QUERIES,key))throw Error('INVALID_QUOTA_KEY');
 const row=await db.prepare(DEMO_QUOTA_QUERIES[key]).bind(telegramId).first();
 const n=Number(row?.n||0);
 if(!Number.isSafeInteger(n)||n<0)throw Error('INVALID_QUOTA_COUNT');
 return n;
}
export async function readDemoEntitlements(db,user){
 const plan=await effectiveDemoPlan(db,user.id);
 const usage={};
 for(const key of Object.keys(DEMO_PLAN_LIMITS.free))usage[key]=await demoUsage(db,user.id,key);
 const limits=DEMO_PLAN_LIMITS[plan];
 const remaining=Object.fromEntries(Object.keys(limits).map(key=>[key,Math.max(0,limits[key]-usage[key])]));
 return {ok:true,mode:'isolated_demo_no_real_payment',plan,limits:{...limits},usage,remaining,subscription_paid_verified:false,real_payments_enabled:false};
}
export async function enforceDemoQuota(db,user,key){
 if(!Object.hasOwn(DEMO_QUOTA_QUERIES,key))throw Error('INVALID_QUOTA_KEY');
 const plan=await effectiveDemoPlan(db,user.id);
 const used=await demoUsage(db,user.id,key),limit=DEMO_PLAN_LIMITS[plan][key];
 if(used>=limit)return quotaResponse({
  error:'سقف استفاده این بخش در طرح آزمایشی شما تکمیل شده است. پرداخت و ارتقای واقعی فعلاً فعال نیست.',
  code:'PLAN_LIMIT_REACHED',resource:key,plan,used,limit,remaining:0,real_payments_enabled:false
 },429);
 return null;
}
