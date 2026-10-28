// Tenant-scoped operational API. Invoked only after Telegram signed initData validation.
const roleWrite = new Set(["owner","admin","editor"]);
const roleManage = new Set(["owner","admin"]);
const clean = (v,n=240) => typeof v==="string"?v.trim().slice(0,n):"";
const validDate = v => typeof v==="string" && /^\d{4}-\d\d-\d\d(?:T\d\d:\d\d(?::\d\d)?(?:Z|[+-]\d\d:\d\d)?)?$/.test(v);
const platformAdmin = (env,id) => (env.ADMIN_TELEGRAM_IDS||"").split(",").map(x=>x.trim()).filter(Boolean).includes(String(id));
async function logChange(db,id,workspace,action,kind,record){
 await db.prepare("INSERT INTO admin_audit(id,workspace_id,actor_id,action,record_type,record_id) VALUES(?,?,?,?,?,?)").bind(crypto.randomUUID(),workspace,id,action,kind,String(record||"")).run();
}
async function handleOps(action,payload,db,user,env){
 const uid=user.id;
 if(action==="legalLibrary"){
   const profile=await db.prepare("SELECT election_type FROM candidate_profiles WHERE telegram_id=?").bind(uid).first();
   const election=profile?.election_type||"other";
   const rows=await db.prepare("SELECT s.id,s.title,s.topic,s.issuer,s.source_url,s.source_date,s.reviewed_at,s.notes,CASE WHEN a.telegram_id IS NULL THEN 0 ELSE 1 END AS acknowledged FROM election_legal_sources s LEFT JOIN election_legal_personal_checks a ON a.source_id=s.id AND a.telegram_id=? WHERE s.status='approved' AND s.election_type IN (?, 'other') ORDER BY s.election_type DESC,s.topic,s.title LIMIT 100").bind(uid,election).all();
   return {electionType:election,resources:rows.results,note:"فقط منابع بررسی و منتشرشده نمایش داده می‌شوند؛ وضعیت هر منبع و تاریخ اعتبار آن باید با مرجع رسمی مجدداً کنترل شود."};
 }
 if(action==="legalAcknowledge"){
   const id=clean(payload.id,64),source=await db.prepare("SELECT id FROM election_legal_sources WHERE id=? AND status='approved' AND election_type IN (COALESCE((SELECT election_type FROM candidate_profiles WHERE telegram_id=?),'other'),'other')").bind(id,uid).first();
   if(!source)return {error:"Source not found",status:404};
   if(payload.acknowledged===true)await db.prepare("INSERT OR IGNORE INTO election_legal_personal_checks(telegram_id,source_id) VALUES(?,?)").bind(uid,id).run();
   else if(payload.acknowledged===false)await db.prepare("DELETE FROM election_legal_personal_checks WHERE telegram_id=? AND source_id=?").bind(uid,id).run();
   else return {error:"Invalid acknowledgement",status:400};
   return {saved:true};
 }
 if(action==="adminLegalSources"){
   if(!platformAdmin(env,uid))return {error:"Forbidden",status:403};
   const rows=await db.prepare("SELECT id,election_type,title,topic,issuer,source_url,source_date,reviewed_at,status,notes,updated_at FROM election_legal_sources ORDER BY updated_at DESC LIMIT 150").all();
   return {resources:rows.results};
 }
 if(action==="adminSaveLegalSource"){
   if(!platformAdmin(env,uid))return {error:"Forbidden",status:403};
   const type=clean(payload.electionType,20),topic=clean(payload.topic,24),title=clean(payload.title,180),issuer=clean(payload.issuer,140),link=clean(payload.sourceUrl,1500),notes=clean(payload.notes,1200),date=clean(payload.sourceDate,24);
   if(!["council","parliament","presidency","other"].includes(type)||!["registration","documents","deadlines","finance","general"].includes(topic)||title.length<4||issuer.length<3)return {error:"Invalid resource fields",status:400};
   let url;try{url=new URL(link)}catch{return {error:"Invalid URL",status:400}}
   if(url.protocol!=="https:"||url.username||url.password||link.length>1500)return {error:"HTTPS source URL required",status:400};
   if(date&&!/^\d{4}-\d{2}-\d{2}$/.test(date))return {error:"Date must be Gregorian YYYY-MM-DD",status:400};
   const id=clean(payload.id,64)||crypto.randomUUID();
   const existing=await db.prepare("SELECT id FROM election_legal_sources WHERE id=?").bind(id).first();
   if(existing){
     await db.prepare("UPDATE election_legal_sources SET election_type=?,title=?,topic=?,source_url=?,issuer=?,source_date=?,notes=?,status='draft',reviewed_at='',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(type,title,topic,link,issuer,date,notes,id).run();
   }else{
     await db.prepare("INSERT INTO election_legal_sources(id,election_type,title,topic,source_url,issuer,source_date,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?)").bind(id,type,title,topic,link,issuer,date,notes,uid).run();
   }
   await logChange(db,uid,null,"legalDraft","legal_source",id);return {saved:true,id,status:"draft"};
 }
 if(action==="adminReviewLegalSource"){
   if(!platformAdmin(env,uid))return {error:"Forbidden",status:403};
   const id=clean(payload.id,64),status=clean(payload.status,12);
   if(!["approved","archived","draft"].includes(status))return {error:"Invalid status",status:400};
   const result=await db.prepare("UPDATE election_legal_sources SET status=?,reviewed_at=CASE WHEN ?='approved' THEN CURRENT_TIMESTAMP ELSE '' END,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(status,status,id).run();
   if(!result.meta.changes)return {error:"Source not found",status:404};
   await logChange(db,uid,null,"legal:"+status,"legal_source",id);return {saved:true};
 }
 if(action==="candidateProfile"){
   const profile=await db.prepare("SELECT election_type,district,stage,professional_summary,updated_at FROM candidate_profiles WHERE telegram_id=?").bind(uid).first();
   const rows=await db.prepare("SELECT id,item_key,label,status,source_type FROM candidate_checklist_items WHERE telegram_id=? ORDER BY item_key").bind(uid).all();
   return {profile:profile||null,checklist:rows.results,note:"این چک‌لیست پیشنهاد مدیریتی است و جایگزین قوانین رسمی یا مشاوره حقوقی نیست."};
 }
 if(action==="saveCandidateProfile"){
   const election=clean(payload.electionType,22),stage=clean(payload.stage,22),district=clean(payload.district,120),summary=clean(payload.professionalSummary,500);
   if(!["council","parliament","presidency","other"].includes(election)||!["planning","registration","operations","report"].includes(stage)||district.length<2)return {error:"نوع انتخابات، حوزه و مرحله فعالیت را بررسی کنید.",status:400};
   await db.prepare("INSERT INTO candidate_profiles(telegram_id,election_type,district,stage,professional_summary) VALUES(?,?,?,?,?) ON CONFLICT(telegram_id) DO UPDATE SET election_type=excluded.election_type,district=excluded.district,stage=excluded.stage,professional_summary=excluded.professional_summary,updated_at=CURRENT_TIMESTAMP").bind(uid,election,district,stage,summary).run();
   const tasks=[["profile","بررسی مشخصات پرونده"],["official_rules","مطالعه آخرین اطلاعیه رسمی انتخابات مربوط"],["eligibility","بررسی شرایط و مدارک موردنیاز از منبع رسمی"],["timeline","ثبت مهلت‌های رسمی در تقویم"],["security","بررسی امنیت حساب و دسترسی تیم"],["activity_plan","تنظیم برنامه اجرایی و مسئولیت‌ها"]];
   for(const [key,label] of tasks){
     await db.prepare("INSERT OR IGNORE INTO candidate_checklist_items(id,telegram_id,item_key,label,source_type) VALUES(?,?,?,?,'recommended')").bind(crypto.randomUUID(),uid,key,label).run();
   }
   const profile=await db.prepare("SELECT election_type,district,stage,professional_summary,updated_at FROM candidate_profiles WHERE telegram_id=?").bind(uid).first();
   return {saved:true,profile,note:"الزامات قانونی باید از مرجع رسمی انتخابات و متناسب با نوع و زمان انتخابات تأیید شوند."};
 }
 if(action==="updateCandidateChecklist"){
   const key=clean(payload.itemKey,40),status=payload.status;
   if(!["todo","done"].includes(status))return {error:"Invalid status",status:400};
   const r=await db.prepare("UPDATE candidate_checklist_items SET status=?,updated_at=CURRENT_TIMESTAMP WHERE telegram_id=? AND item_key=?").bind(status,uid,key).run();
   if(!r.meta.changes)return {error:"Checklist item not found",status:404};
   return {saved:true};
 }
 if(action==="createSupportTicket"){
   const subject=clean(payload.subject,200),message=clean(payload.message,3000);
   if(subject.length<3||message.length<5)return {error:"Invalid ticket",status:400};
   const count=await db.prepare("SELECT COUNT(*) AS n FROM support_tickets WHERE telegram_id=? AND status IN ('open','reviewing')").bind(uid).first();
   if(count.n>=5)return {error:"Too many open tickets",status:429};
   const ticket=crypto.randomUUID();
   await db.prepare("INSERT INTO support_tickets(id,telegram_id,subject,message) VALUES(?,?,?,?)").bind(ticket,uid,subject,message).run();
   return {saved:true,id:ticket};
 }
 if(action==="mySupportTickets"){
   const r=await db.prepare("SELECT id,subject,message,status,admin_reply,created_at,updated_at FROM support_tickets WHERE telegram_id=? ORDER BY created_at DESC LIMIT 50").bind(uid).all();
   return {tickets:r.results};
 }
 if(action==="adminSupportQueue"){
   if(!platformAdmin(env,uid))return {error:"Forbidden",status:403};
   const r=await db.prepare("SELECT id,telegram_id,subject,message,status,admin_reply,created_at FROM support_tickets ORDER BY created_at DESC LIMIT 100").all();
   return {tickets:r.results};
 }
 if(action==="adminReplyTicket"){
   if(!platformAdmin(env,uid))return {error:"Forbidden",status:403};
   const ticket=clean(payload.ticketId,64),status=clean(payload.status,16),reply=clean(payload.reply,3000);
   if(!["open","reviewing","resolved","closed"].includes(status))return {error:"Invalid status",status:400};
   const r=await db.prepare("UPDATE support_tickets SET status=?,admin_reply=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(status,reply,ticket).run();
   if(!r.meta.changes)return {error:"Not found",status:404};
   await logChange(db,uid,null,"reply","support",ticket);
   return {saved:true};
 }
 if(action==="availablePlans"){
   const plans=await db.prepare("SELECT id,name,description,max_members FROM service_plans WHERE active=1 ORDER BY max_members ASC").all();
   return {plans:plans.results};
 }
 if(action==="adminEntitlements"){
   if(!platformAdmin(env,uid))return {error:"Forbidden",status:403};
   const [plans,entitlements]=await Promise.all([
     db.prepare("SELECT id,name,description,max_members FROM service_plans WHERE active=1").all(),
     db.prepare("SELECT e.workspace_id,w.name AS workspace_name,e.plan_id,e.expires_at FROM workspace_entitlements e JOIN workspaces w ON w.id=e.workspace_id ORDER BY e.updated_at DESC LIMIT 100").all()
   ]);
   return {plans:plans.results,entitlements:entitlements.results};
 }
 if(action==="adminAssignPlan"){
   if(!platformAdmin(env,uid))return {error:"Forbidden",status:403};
   const workspaceId=clean(payload.workspaceId,64),planId=clean(payload.planId,40);
   const [ws,plan]=await Promise.all([db.prepare("SELECT id FROM workspaces WHERE id=?").bind(workspaceId).first(),db.prepare("SELECT id FROM service_plans WHERE id=? AND active=1").bind(planId).first()]);
   if(!ws||!plan)return {error:"Workspace or plan not found",status:404};
   const expiry=payload.expiresAt||null;
   if(expiry!==null&&!validDate(expiry))return {error:"Invalid date",status:400};
   await db.prepare("INSERT INTO workspace_entitlements(workspace_id,plan_id,expires_at,assigned_by) VALUES(?,?,?,?) ON CONFLICT(workspace_id) DO UPDATE SET plan_id=excluded.plan_id,expires_at=excluded.expires_at,assigned_by=excluded.assigned_by,updated_at=CURRENT_TIMESTAMP").bind(workspaceId,planId,expiry,uid).run();
   await logChange(db,uid,workspaceId,"assign:"+planId,"entitlement",workspaceId);return {saved:true};
 }
 if(action==="myPrivacy"){
   const requests=await db.prepare("SELECT id,request_type,status,created_at FROM privacy_requests WHERE telegram_id=? ORDER BY created_at DESC LIMIT 30").bind(uid).all();
   return {requests:requests.results};
 }
 if(action==="requestPrivacy"){
   if(!["export","delete","correct"].includes(payload.requestType))return {error:"Invalid request",status:400};
   const details=clean(payload.details,1000);
   const recent=await db.prepare("SELECT COUNT(*) AS n FROM privacy_requests WHERE telegram_id=? AND status IN ('pending','reviewing')").bind(uid).first();
   if(recent.n>=3)return {error:"Maximum 3 pending requests",status:429};
   const requestId=crypto.randomUUID();
   await db.prepare("INSERT INTO privacy_requests(id,telegram_id,request_type,details) VALUES(?,?,?,?)").bind(requestId,uid,payload.requestType,details).run();
   return {saved:true,id:requestId};
 }
 if(action==="myDataExport"){
   const [user,progress,notes,bookmarks,attempts]=await Promise.all([
    db.prepare("SELECT telegram_id,display_name,username,created_at FROM candidate_users WHERE telegram_id=?").bind(uid).first(),
    db.prepare("SELECT lesson_id,completed_at FROM lesson_progress WHERE telegram_id=? LIMIT 500").bind(uid).all(),
    db.prepare("SELECT lesson_id,note,updated_at FROM lesson_notes WHERE telegram_id=? LIMIT 500").bind(uid).all(),
    db.prepare("SELECT lesson_id,created_at FROM lesson_bookmarks WHERE telegram_id=? LIMIT 500").bind(uid).all(),
    db.prepare("SELECT quiz_id,score,question_count,submitted_at FROM quiz_attempts WHERE telegram_id=? ORDER BY submitted_at DESC LIMIT 500").bind(uid).all()
   ]);
   return {data:{user,progress:progress.results,notes:notes.results,bookmarks:bookmarks.results,attempts:attempts.results},limitedTo:500};
 }
 if(action==="adminPrivacyQueue"){
   if(!platformAdmin(env,uid))return {error:"Forbidden",status:403};
   const q=await db.prepare("SELECT id,telegram_id,request_type,status,created_at FROM privacy_requests ORDER BY created_at DESC LIMIT 100").all();
   return {requests:q.results};
 }
 if(action==="adminPrivacyStatus"){
   if(!platformAdmin(env,uid))return {error:"Forbidden",status:403};
   if(!["pending","reviewing","rejected"].includes(payload.status))return {error:"Invalid status",status:400};
   const id=clean(payload.requestId,64);
   const result=await db.prepare("UPDATE privacy_requests SET status=? WHERE id=? AND status!='done'").bind(payload.status,id).run();
   if(!result.meta.changes)return {error:"Not found",status:404};
   await logChange(db,uid,null,"privacy:"+payload.status,"privacy",id);
   return {saved:true};
 }
 if(action==="myWorkspaces"){
   const r=await db.prepare("SELECT w.id,w.name,w.jurisdiction,w.status,m.role FROM workspaces w JOIN workspace_members m ON m.workspace_id=w.id WHERE m.telegram_id=? AND m.status='active' ORDER BY w.created_at DESC LIMIT 50").bind(uid).all();
   return {workspaces:r.results,platformAdmin:platformAdmin(env,uid)};
 }
 if(action==="createWorkspace"){
   const name=clean(payload.name,120),jurisdiction=clean(payload.jurisdiction,100);
   if(name.length<2||name.length>120)return {error:"Invalid workspace name",status:400};
   const count=await db.prepare("SELECT COUNT(*) AS count FROM workspaces WHERE created_by=? AND status='active'").bind(uid).first();
   if(count.count>=5)return {error:"Workspace limit reached",status:429};
   const workspace=crypto.randomUUID();
   await db.batch([
      db.prepare("INSERT INTO workspaces(id,name,jurisdiction,created_by) VALUES(?,?,?,?)").bind(workspace,name,jurisdiction,uid),
      db.prepare("INSERT INTO workspace_members(workspace_id,telegram_id,role) VALUES(?,?,'owner')").bind(workspace,uid)
   ]);
   await logChange(db,uid,workspace,"create","workspace",workspace);
   return {workspace:{id:workspace,name,role:"owner"}};
 }
 if(action==="adminLessons"){
   if(!platformAdmin(env,uid))return {error:"Forbidden",status:403};
   const lessons=await db.prepare("SELECT id,title,summary,body,position,published FROM lessons ORDER BY position,id LIMIT 100").all();
   const quizzes=await db.prepare("SELECT id,title,description,published FROM quizzes ORDER BY id LIMIT 100").all();
   return {lessons:lessons.results,quizzes:quizzes.results};
 }
 if(action==="adminSaveLesson"){
   if(!platformAdmin(env,uid))return {error:"Forbidden",status:403};
   const title=clean(payload.title),summary=clean(payload.summary,1000),body=clean(payload.body,12000),position=Number(payload.position)||0;
   if(title.length<2||body.length<5||!Number.isSafeInteger(position)||position<0||position>10000)return {error:"Invalid lesson",status:400};
   const lessonId=Number(payload.id);
   if(payload.id!=null){if(!Number.isSafeInteger(lessonId)||lessonId<=0)return {error:"Invalid ID",status:400};
     const r=await db.prepare("UPDATE lessons SET title=?,summary=?,body=?,position=? WHERE id=?").bind(title,summary,body,position,lessonId).run();
     if(!r.meta.changes)return {error:"Not found",status:404};
     await logChange(db,uid,null,"update","lesson",lessonId);return {saved:true,id:lessonId};
   }
   const r=await db.prepare("INSERT INTO lessons(title,summary,body,position,published) VALUES(?,?,?,?,0)").bind(title,summary,body,position).run();
   await logChange(db,uid,null,"create","lesson",r.meta.last_row_id);return {saved:true,id:r.meta.last_row_id};
 }
 if(action==="adminPublishLesson"){
   if(!platformAdmin(env,uid))return {error:"Forbidden",status:403};
   const id=Number(payload.id);if(!Number.isSafeInteger(id)||id<=0||typeof payload.published!=="boolean")return {error:"Invalid input",status:400};
   const r=await db.prepare("UPDATE lessons SET published=? WHERE id=?").bind(payload.published?1:0,id).run();
   if(!r.meta.changes)return {error:"Not found",status:404};
   await logChange(db,uid,null,payload.published?"publish":"unpublish","lesson",id);return {saved:true};
 }
 if(action==="adminCreateQuiz"){
   if(!platformAdmin(env,uid))return {error:"Forbidden",status:403};
   const title=clean(payload.title),description=clean(payload.description,500);
   if(title.length<2)return {error:"Invalid quiz",status:400};
   const r=await db.prepare("INSERT INTO quizzes(title,description,published) VALUES(?,?,0)").bind(title,description).run();
   await logChange(db,uid,null,"create","quiz",r.meta.last_row_id);return {saved:true,id:r.meta.last_row_id};
 }
 if(action==="adminAddQuestion"){
   if(!platformAdmin(env,uid))return {error:"Forbidden",status:403};
   const quizId=Number(payload.quizId),prompt=clean(payload.prompt,2000),options=payload.options,correct=payload.correctIndex;
   if(!Number.isSafeInteger(quizId)||quizId<=0||prompt.length<4||!Array.isArray(options)||options.length<2||options.length>8||!options.every(o=>typeof o==="string"&&o.trim().length>0&&o.length<=500)||!Number.isInteger(correct)||correct<0||correct>=options.length)return {error:"Invalid question",status:400};
   const quiz=await db.prepare("SELECT id,published FROM quizzes WHERE id=?").bind(quizId).first();
   if(!quiz||quiz.published)return {error:"Quiz unavailable for editing",status:409};
   const count=await db.prepare("SELECT COUNT(*) AS n FROM quiz_questions WHERE quiz_id=?").bind(quizId).first();
   if(count.n>=100)return {error:"Question limit",status:429};
   const r=await db.prepare("INSERT INTO quiz_questions(quiz_id,prompt,options_json,correct_index,position) VALUES(?,?,?,?,?)").bind(quizId,prompt,JSON.stringify(options),correct,count.n+1).run();
   await logChange(db,uid,null,"create","quiz_question",r.meta.last_row_id);return {saved:true};
 }
 if(action==="adminPublishQuiz"){
   if(!platformAdmin(env,uid))return {error:"Forbidden",status:403};
   const quizId=Number(payload.id),published=payload.published;
   if(!Number.isSafeInteger(quizId)||quizId<=0||typeof published!=="boolean")return {error:"Invalid quiz",status:400};
   if(published){const c=await db.prepare("SELECT COUNT(*) AS n FROM quiz_questions WHERE quiz_id=?").bind(quizId).first();if(!c?.n)return {error:"Quiz requires at least one question",status:409}}
   const result=await db.prepare("UPDATE quizzes SET published=? WHERE id=?").bind(published?1:0,quizId).run();
   if(!result.meta.changes)return {error:"Not found",status:404};
   await logChange(db,uid,null,published?"publish":"unpublish","quiz",quizId);return {saved:true};
 }
 if(action==="adminWorkspaces"){
   if(!platformAdmin(env,uid))return {error:"Forbidden",status:403};
   const r=await db.prepare("SELECT id,name,jurisdiction,status,created_at FROM workspaces ORDER BY created_at DESC LIMIT 200").all();
   return {workspaces:r.results};
 }
 if(action==="adminSystemHealth"){
   if(!platformAdmin(env,uid))return {error:"Forbidden",status:403};
   const today=new Date().toISOString().slice(0,10);
   const [lessons,quizzes,workspaces,aiUsage]=await Promise.all([
     db.prepare("SELECT COUNT(*) AS n FROM lessons WHERE published=1").first(),
     db.prepare("SELECT COUNT(*) AS n FROM quizzes WHERE published=1").first(),
     db.prepare("SELECT COUNT(*) AS n FROM workspaces").first(),
     db.prepare("SELECT requests FROM ai_global_usage WHERE day=?").bind(today).first()
   ]);
   return {status:"online",date:today,checks:{database:true,aiBound:!!env.AI,telegramTokenConfigured:!!env.TELEGRAM_BOT_TOKEN,adminSecretConfigured:!!env.ADMIN_TELEGRAM_IDS},counts:{lessons:lessons.n,quizzes:quizzes.n,workspaces:workspaces.n,aiRequestsToday:aiUsage?.requests||0},dailyAiCallLimit:40};
 }
 if(action==="platformSummary"){
   if(!platformAdmin(env,uid))return {error:"Forbidden",status:403};
   const [a,b,c,d]=await Promise.all([
    db.prepare("SELECT COUNT(*) AS total FROM workspaces").first(),
    db.prepare("SELECT COUNT(*) AS total FROM candidate_users").first(),
    db.prepare("SELECT COUNT(*) AS total FROM lessons WHERE published=1").first(),
    db.prepare("SELECT id,workspace_id,actor_id,action,record_type,created_at FROM admin_audit ORDER BY created_at DESC LIMIT 30").all()
   ]);
   return {summary:{workspaces:a.total,users:b.total,lessons:c.total},audit:d.results};
 }
 if(action==="myInvites"){
   const r=await db.prepare("SELECT i.id,i.workspace_id,w.name,i.role,i.expires_at FROM workspace_invitations i JOIN workspaces w ON w.id=i.workspace_id WHERE i.invited_telegram_id=? AND i.status='pending' AND datetime(i.expires_at)>datetime('now') ORDER BY i.created_at DESC LIMIT 30").bind(uid).all();
   return {invitations:r.results};
 }
 if(action==="acceptInvite"){
   const invitation=clean(payload.invitationId,64);
   const item=await db.prepare("SELECT id,workspace_id,role FROM workspace_invitations WHERE id=? AND invited_telegram_id=? AND status='pending' AND datetime(expires_at)>datetime('now')").bind(invitation,uid).first();
   if(!item)return {error:"Invitation not found or expired",status:404};
   const owner=await db.prepare("SELECT role FROM workspace_members WHERE workspace_id=? AND telegram_id=?").bind(item.workspace_id,uid).first();
   if(owner?.role==="owner")return {error:"Already owner",status:409};
   const ent=await db.prepare("SELECT p.max_members FROM workspace_entitlements e JOIN service_plans p ON p.id=e.plan_id WHERE e.workspace_id=? AND (e.expires_at IS NULL OR datetime(e.expires_at)>datetime('now'))").bind(item.workspace_id).first();
   const count=await db.prepare("SELECT COUNT(*) AS n FROM workspace_members WHERE workspace_id=? AND status='active'").bind(item.workspace_id).first();
   if(count.n>=(ent?.max_members||3))return {error:"Member limit reached",status:409};
   await db.batch([
    db.prepare("UPDATE workspace_invitations SET status='accepted' WHERE id=? AND invited_telegram_id=? AND status='pending'").bind(item.id,uid),
    db.prepare("INSERT INTO workspace_members(workspace_id,telegram_id,role) VALUES(?,?,?) ON CONFLICT(workspace_id,telegram_id) DO UPDATE SET role=excluded.role,status='active'").bind(item.workspace_id,uid,item.role)
   ]);
   await logChange(db,uid,item.workspace_id,"accept","invitation",item.id);return {saved:true};
 }
 const workspace=clean(payload.workspaceId,64);
 if(!workspace)return {error:"Choose workspace",status:400};
 const membership=await db.prepare("SELECT w.id,w.name,w.status,m.role FROM workspace_members m JOIN workspaces w ON w.id=m.workspace_id WHERE m.workspace_id=? AND m.telegram_id=? AND m.status='active'").bind(workspace,uid).first();
 if(!membership||membership.status!=="active")return {error:"Forbidden",status:403};
 const role=membership.role,canWrite=roleWrite.has(role),canManage=roleManage.has(role);
 if(action==="workspacePlan"){
   const ent=await db.prepare("SELECT p.id,p.name,p.description,p.max_members,e.expires_at FROM workspace_entitlements e JOIN service_plans p ON p.id=e.plan_id WHERE e.workspace_id=?").bind(workspace).first();
   return {plan:ent||{id:"basic",name:"آموزشی پایه",description:"دسترسی پایه",max_members:3}};
 }
 if(action==="eventRsvp"){
   const eventId=clean(payload.eventId,64),response=clean(payload.response,12);
   if(!["going","unable"].includes(response))return {error:"Invalid response",status:400};
   const event=await db.prepare("SELECT id FROM workspace_events WHERE workspace_id=? AND id=?").bind(workspace,eventId).first();
   if(!event)return {error:"Event not found",status:404};
   await db.prepare("INSERT INTO event_rsvps(workspace_id,event_id,telegram_id,response) VALUES(?,?,?,?) ON CONFLICT(event_id,telegram_id) DO UPDATE SET response=excluded.response,updated_at=CURRENT_TIMESTAMP").bind(workspace,eventId,uid,response).run();
   return {saved:true,response};
 }
 if(action==="workspaceSummary"){
   const [tasks,events,commitments,expenses,members]=await Promise.all([
    db.prepare("SELECT id,title,description,status,priority,due_date,assignee_id,created_at FROM workspace_tasks WHERE workspace_id=? ORDER BY created_at DESC LIMIT 100").bind(workspace).all(),
    db.prepare("SELECT id,title,starts_at,location,description FROM workspace_events WHERE workspace_id=? ORDER BY starts_at ASC LIMIT 100").bind(workspace).all(),
    db.prepare("SELECT id,title,description,status,evidence_link FROM public_commitments WHERE workspace_id=? ORDER BY created_at DESC LIMIT 100").bind(workspace).all(),
    db.prepare("SELECT id,description,amount_minor,currency,category,spent_at FROM workspace_expenses WHERE workspace_id=? ORDER BY spent_at DESC LIMIT 100").bind(workspace).all(),
    db.prepare("SELECT m.telegram_id,m.role,m.status,u.display_name FROM workspace_members m JOIN candidate_users u ON u.telegram_id=m.telegram_id WHERE m.workspace_id=? ORDER BY m.created_at LIMIT 100").bind(workspace).all()
   ]);
   const drafts=await db.prepare("SELECT id,title,body,status,created_at FROM content_revision_requests WHERE workspace_id=? ORDER BY created_at DESC LIMIT 100").bind(workspace).all();
   const rsvps=await db.prepare("SELECT event_id,telegram_id,response FROM event_rsvps WHERE workspace_id=? LIMIT 500").bind(workspace).all();
   const documents=await db.prepare("SELECT id,title,category,source_url,visibility,created_at FROM workspace_documents WHERE workspace_id=? AND (visibility='members' OR ?=1) ORDER BY created_at DESC LIMIT 100").bind(workspace,canManage?1:0).all();
   const notices=await db.prepare("SELECT id,title,body,created_at FROM workspace_notifications WHERE workspace_id=? ORDER BY created_at DESC LIMIT 60").bind(workspace).all();
   return {workspace:{id:workspace,name:membership.name,role},tasks:tasks.results,events:events.results,commitments:commitments.results,expenses:canManage?expenses.results:[],members:canManage?members.results:[],drafts:canWrite?drafts.results:[],documents:documents.results,notices:notices.results,rsvps:rsvps.results.filter(x=>canManage||x.telegram_id===uid)};
 }
 if(action==="auditTrail"){
   if(!canManage)return {error:"Forbidden",status:403};
   const r=await db.prepare("SELECT id,actor_id,action,record_type,record_id,created_at FROM admin_audit WHERE workspace_id=? ORDER BY created_at DESC LIMIT 100").bind(workspace).all();
   return {audit:r.results};
 }
 if(action==="addMember"){
   if(!canManage)return {error:"Forbidden",status:403};
   const member=Number(payload.telegramId),newRole=clean(payload.role,12);
   if(!Number.isSafeInteger(member)||member<=0||!["admin","editor","member","auditor"].includes(newRole)||member===uid)return {error:"Invalid member or role",status:400};
   const exists=await db.prepare("SELECT telegram_id FROM candidate_users WHERE telegram_id=?").bind(member).first();
   if(!exists)return {error:"Invitee must first open the mini app",status:404};
   const entitlement=await db.prepare("SELECT p.max_members FROM workspace_entitlements e JOIN service_plans p ON p.id=e.plan_id WHERE e.workspace_id=? AND (e.expires_at IS NULL OR datetime(e.expires_at)>datetime('now'))").bind(workspace).first();
   const maxMembers=entitlement?.max_members||3;
   const memberCount=await db.prepare("SELECT COUNT(*) AS n FROM workspace_members WHERE workspace_id=? AND status='active'").bind(workspace).first();
   if(memberCount.n>=maxMembers)return {error:"Member limit for current plan reached",status:409};
   const existing=await db.prepare("SELECT role FROM workspace_members WHERE workspace_id=? AND telegram_id=? AND status='active'").bind(workspace,member).first();
   if(existing)return {error:"Already an active member",status:409};
   const invId=crypto.randomUUID(),expires=new Date(Date.now()+7*86400000).toISOString();
   await db.prepare("INSERT INTO workspace_invitations(id,workspace_id,invited_telegram_id,role,created_by,expires_at) VALUES(?,?,?,?,?,?)").bind(invId,workspace,member,newRole,uid,expires).run();
   await logChange(db,uid,workspace,"invite","member",member);
   return {invited:true,expiresAt:expires};
 }
 if(action==="removeMember"){
   if(!canManage)return {error:"Forbidden",status:403};
   const member=Number(payload.telegramId);
   if(!Number.isSafeInteger(member))return {error:"Invalid member",status:400};
   const target=await db.prepare("SELECT role FROM workspace_members WHERE workspace_id=? AND telegram_id=?").bind(workspace,member).first();
   if(!target||target.role==="owner")return {error:"Cannot remove owner",status:403};
   await db.prepare("UPDATE workspace_members SET status='disabled' WHERE workspace_id=? AND telegram_id=?").bind(workspace,member).run();
   await logChange(db,uid,workspace,"memberDisable","member",member);
   return {saved:true};
 }
 if(action==="createDocument"){
   if(!canWrite)return {error:"Forbidden",status:403};
   const title=clean(payload.title,200),category=clean(payload.category,60)||"general",link=clean(payload.sourceUrl,2048);
   const visibility=payload.visibility==="managers"?"managers":"members";
   if(visibility==="managers"&&!canManage)return {error:"Forbidden",status:403};
   let url;try{url=new URL(link)}catch{return {error:"Invalid URL",status:400}}
   if(url.protocol!=="https:"||url.username||url.password||title.length<2||!link||link.length>2048)return {error:"A valid HTTPS document URL is required",status:400};
   const docId=crypto.randomUUID();
   await db.prepare("INSERT INTO workspace_documents(id,workspace_id,title,category,source_url,visibility,created_by) VALUES(?,?,?,?,?,?,?)").bind(docId,workspace,title,category,link,visibility,uid).run();
   await logChange(db,uid,workspace,"create","document",docId);return {saved:true,id:docId};
 }
 if(action==="deleteDocument"){
   if(!canManage)return {error:"Forbidden",status:403};
   const docId=clean(payload.id,64);
   const r=await db.prepare("DELETE FROM workspace_documents WHERE workspace_id=? AND id=?").bind(workspace,docId).run();
   if(!r.meta.changes)return {error:"Not found",status:404};
   await logChange(db,uid,workspace,"delete","document",docId);return {saved:true};
 }
 if(action==="createNotice"){
   if(!canManage)return {error:"Forbidden",status:403};
   const title=clean(payload.title,200),body=clean(payload.body,2000);
   if(title.length<2||body.length<3)return {error:"Invalid notice",status:400};
   const noticeId=crypto.randomUUID();
   await db.prepare("INSERT INTO workspace_notifications(id,workspace_id,title,body,created_by) VALUES(?,?,?,?,?)").bind(noticeId,workspace,title,body,uid).run();
   await logChange(db,uid,workspace,"create","notice",noticeId);return {saved:true,id:noticeId};
 }
 if(!canWrite)return {error:"Read-only role",status:403};
 if(action==="createDraft"){
   const title=clean(payload.title),body=clean(payload.body,6000);
   if(title.length<2||body.length<5)return {error:"Invalid content",status:400};
   const id=crypto.randomUUID();
   await db.prepare("INSERT INTO content_revision_requests(id,workspace_id,title,body,created_by) VALUES(?,?,?,?,?)").bind(id,workspace,title,body,uid).run();
   await logChange(db,uid,workspace,"create","draft",id);return {saved:true,id};
 }
 if(action==="draftStatus"){
   const status=clean(payload.status,16);
   if(!["draft","review","approved","rejected"].includes(status))return {error:"Invalid status",status:400};
   if(["approved","rejected"].includes(status)&&!canManage)return {error:"Approval requires admin",status:403};
   const item=await db.prepare("SELECT id,created_by,status FROM content_revision_requests WHERE workspace_id=? AND id=?").bind(workspace,clean(payload.id,64)).first();
   if(!item)return {error:"Not found",status:404};
   if(!canManage&&item.created_by!==uid)return {error:"Forbidden",status:403};
   const r=await db.prepare("UPDATE content_revision_requests SET status=? WHERE workspace_id=? AND id=?").bind(status,workspace,item.id).run();
   await logChange(db,uid,workspace,"status:"+status,"draft",item.id);return {saved:true};
 }
 if(action==="createTask"){
   const title=clean(payload.title),description=clean(payload.description,3000),due=payload.dueDate||null;
   if(title.length<2||(due&&!validDate(due)))return {error:"Invalid task",status:400};
   const id=crypto.randomUUID();
   await db.prepare("INSERT INTO workspace_tasks(id,workspace_id,title,description,priority,due_date,created_by) VALUES(?,?,?,?,?,?,?)").bind(id,workspace,title,description,["low","normal","high"].includes(payload.priority)?payload.priority:"normal",due,uid).run();
   await logChange(db,uid,workspace,"create","task",id);return {id,saved:true};
 }
 if(action==="taskStatus"){
   if(!["todo","doing","done"].includes(payload.status))return {error:"Invalid status",status:400};
   const r=await db.prepare("UPDATE workspace_tasks SET status=?,updated_at=CURRENT_TIMESTAMP WHERE workspace_id=? AND id=?").bind(payload.status,workspace,clean(payload.id,64)).run();
   if(!r.meta.changes)return {error:"Not found",status:404};
   await logChange(db,uid,workspace,"status","task",payload.id);return {saved:true};
 }
 if(action==="createEvent"){
   const title=clean(payload.title),starts=payload.startsAt,location=clean(payload.location);
   if(title.length<2||!validDate(starts))return {error:"Invalid event",status:400};
   const id=crypto.randomUUID();
   await db.prepare("INSERT INTO workspace_events(id,workspace_id,title,starts_at,location,created_by) VALUES(?,?,?,?,?,?)").bind(id,workspace,title,starts,location,uid).run();
   await logChange(db,uid,workspace,"create","event",id);return {id,saved:true};
 }
 if(action==="createCommitment"){
   const title=clean(payload.title),description=clean(payload.description,3000);
   if(title.length<2)return {error:"Invalid title",status:400};
   const id=crypto.randomUUID();
   await db.prepare("INSERT INTO public_commitments(id,workspace_id,title,description,created_by) VALUES(?,?,?,?,?)").bind(id,workspace,title,description,uid).run();
   await logChange(db,uid,workspace,"create","commitment",id);return {id,saved:true};
 }
 if(action==="commitmentStatus"){
   if(!["draft","review","published","completed"].includes(payload.status))return {error:"Invalid status",status:400};
   if(payload.status==="published"&&!canManage)return {error:"Approval required",status:403};
   const r=await db.prepare("UPDATE public_commitments SET status=? WHERE workspace_id=? AND id=?").bind(payload.status,workspace,clean(payload.id,64)).run();
   if(!r.meta.changes)return {error:"Not found",status:404};
   await logChange(db,uid,workspace,"status","commitment",payload.id);return {saved:true};
 }
 if(action==="createExpense"){
   if(!canManage)return {error:"Forbidden",status:403};
   const description=clean(payload.description),amount=payload.amountMinor,spentAt=payload.spentAt;
   if(description.length<2||!Number.isSafeInteger(amount)||amount<0||amount>100000000000000||!validDate(spentAt))return {error:"Invalid expense",status:400};
   const id=crypto.randomUUID();
   await db.prepare("INSERT INTO workspace_expenses(id,workspace_id,description,amount_minor,spent_at,created_by) VALUES(?,?,?,?,?,?)").bind(id,workspace,description,amount,spentAt,uid).run();
   await logChange(db,uid,workspace,"create","expense",id);return {id,saved:true};
 }
 return {error:"Unknown operation",status:400};
}
