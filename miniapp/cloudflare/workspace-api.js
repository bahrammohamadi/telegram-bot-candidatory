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
 if(action==="workspaceSummary"){
   const [tasks,events,commitments,expenses,members]=await Promise.all([
    db.prepare("SELECT id,title,description,status,priority,due_date,assignee_id,created_at FROM workspace_tasks WHERE workspace_id=? ORDER BY created_at DESC LIMIT 100").bind(workspace).all(),
    db.prepare("SELECT id,title,starts_at,location,description FROM workspace_events WHERE workspace_id=? ORDER BY starts_at ASC LIMIT 100").bind(workspace).all(),
    db.prepare("SELECT id,title,description,status,evidence_link FROM public_commitments WHERE workspace_id=? ORDER BY created_at DESC LIMIT 100").bind(workspace).all(),
    db.prepare("SELECT id,description,amount_minor,currency,category,spent_at FROM workspace_expenses WHERE workspace_id=? ORDER BY spent_at DESC LIMIT 100").bind(workspace).all(),
    db.prepare("SELECT m.telegram_id,m.role,m.status,u.display_name FROM workspace_members m JOIN candidate_users u ON u.telegram_id=m.telegram_id WHERE m.workspace_id=? ORDER BY m.created_at LIMIT 100").bind(workspace).all()
   ]);
   const drafts=await db.prepare("SELECT id,title,body,status,created_at FROM content_revision_requests WHERE workspace_id=? ORDER BY created_at DESC LIMIT 100").bind(workspace).all();
   const documents=await db.prepare("SELECT id,title,category,source_url,visibility,created_at FROM workspace_documents WHERE workspace_id=? AND (visibility='members' OR ?=1) ORDER BY created_at DESC LIMIT 100").bind(workspace,canManage?1:0).all();
   const notices=await db.prepare("SELECT id,title,body,created_at FROM workspace_notifications WHERE workspace_id=? ORDER BY created_at DESC LIMIT 60").bind(workspace).all();
   return {workspace:{id:workspace,name:membership.name,role},tasks:tasks.results,events:events.results,commitments:commitments.results,expenses:canManage?expenses.results:[],members:canManage?members.results:[],drafts:canWrite?drafts.results:[],documents:documents.results,notices:notices.results};
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
