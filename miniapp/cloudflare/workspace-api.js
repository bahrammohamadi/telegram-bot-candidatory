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
   return {workspace:{id:workspace,name:membership.name,role},tasks:tasks.results,events:events.results,commitments:commitments.results,expenses:expenses.results,members:canManage?members.results:[]};
 }
 if(action==="auditTrail"){
   if(!canManage)return {error:"Forbidden",status:403};
   const r=await db.prepare("SELECT id,actor_id,action,record_type,record_id,created_at FROM admin_audit WHERE workspace_id=? ORDER BY created_at DESC LIMIT 100").bind(workspace).all();
   return {audit:r.results};
 }
 if(action==="addMember"){
   if(!canManage)return {error:"Forbidden",status:403};
   const member=Number(payload.telegramId),newRole=clean(payload.role,12);
   if(!Number.isSafeInteger(member)||member<=0||!["admin","editor","member","auditor"].includes(newRole))return {error:"Invalid member or role",status:400};
   const exists=await db.prepare("SELECT telegram_id FROM candidate_users WHERE telegram_id=?").bind(member).first();
   if(!exists)return {error:"Member must open app first",status:404};
   const previous=await db.prepare("SELECT role FROM workspace_members WHERE workspace_id=? AND telegram_id=?").bind(workspace,member).first();
   if(previous?.role==="owner")return {error:"Cannot change owner",status:403};
   await db.prepare("INSERT INTO workspace_members(workspace_id,telegram_id,role) VALUES(?,?,?) ON CONFLICT(workspace_id,telegram_id) DO UPDATE SET role=excluded.role,status='active'").bind(workspace,member,newRole).run();
   await logChange(db,uid,workspace,"memberUpsert","member",member);
   return {saved:true};
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
 if(!canWrite)return {error:"Read-only role",status:403};
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
