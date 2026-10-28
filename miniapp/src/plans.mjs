// Product-level plans. These are not billing records and must not grant access by themselves.
export const PRODUCT_PLANS=Object.freeze({
 free:Object.freeze({id:'free',name:'رایگان',price:0,limits:Object.freeze({teamMembers:1,tasks:10,lessons:5,fullReports:false,exportPDF:false,monthlyAssessments:1})}),
 professional:Object.freeze({id:'professional',name:'حرفه‌ای',price:null,limits:Object.freeze({teamMembers:5,tasks:500,lessons:-1,fullReports:true,exportPDF:true,monthlyAssessments:25})})
});
export function resolvePlan(entitlement,now=new Date()){
 if(!entitlement||entitlement.status!=='active'||entitlement.plan_id!=='professional')return PRODUCT_PLANS.free;
 if(entitlement.expires_at&&new Date(entitlement.expires_at).getTime()<=now.getTime())return PRODUCT_PLANS.free;
 return PRODUCT_PLANS.professional;
}
export function canUse(plan,feature,currentCount=0){
 if(!plan||!Object.hasOwn(plan.limits,feature))return false;
 const limit=plan.limits[feature];
 if(typeof limit==='boolean')return limit;
 if(typeof limit==='number')return limit===-1||currentCount<limit;
 return false;
}
