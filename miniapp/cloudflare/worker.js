// Candidatory Telegram Mini App API — Cloudflare Workers + D1
// Telegram signed initData is authenticated on every request; no public D1 binding.
const enc = new TextEncoder();
function reply(value, status=200) { return new Response(JSON.stringify(value),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","access-control-allow-origin":"*","access-control-allow-methods":"POST, OPTIONS","access-control-allow-headers":"content-type"}}); }
async function verify(initData,token){
 if(!token) throw new Error("NOT_CONFIGURED");
 if(typeof initData!=="string"||initData.length>8192) throw new Error("INVALID_INIT_DATA");
 const p=new URLSearchParams(initData),hash=p.get("hash")||"", ts=Number(p.get("auth_date"));
 if(!/^[0-9a-f]{64}$/.test(hash)||!Number.isFinite(ts)) throw new Error("INVALID_INIT_DATA");
 if(Math.abs(Date.now()/1000-ts)>3600) throw new Error("EXPIRED_INIT_DATA");
 const data=[...p.entries()].filter(([k])=>k!=="hash"&&k!=="signature").sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>k+"="+v).join("\n");
 const base=await crypto.subtle.importKey("raw",enc.encode("WebAppData"),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const secret=await crypto.subtle.sign("HMAC",base,enc.encode(token));
 const key=await crypto.subtle.importKey("raw",secret,{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const signed=new Uint8Array(await crypto.subtle.sign("HMAC",key,enc.encode(data)));
 const provided=new Uint8Array(hash.match(/../g).map(h=>parseInt(h,16)));
 let diff=0;for(let i=0;i<32;i++)diff|=signed[i]^provided[i];
 if(diff)throw new Error("INVALID_SIGNATURE");
 let user;try{user=JSON.parse(p.get("user")||"null")}catch{throw new Error("UNAUTHORIZED")}
 if(!user||!Number.isSafeInteger(user.id)||user.id<=0)throw new Error("UNAUTHORIZED");
 return user;
}
const validId=v=>Number.isSafeInteger(Number(v))&&Number(v)>0&&String(Number(v))===String(v);
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
   const drafts=await db.prepare("SELECT id,title,body,status,created_at FROM content_revision_requests WHERE workspace_id=? ORDER BY created_at DESC LIMIT 100").bind(workspace).all();
   return {workspace:{id:workspace,name:membership.name,role},tasks:tasks.results,events:events.results,commitments:commitments.results,expenses:expenses.results,members:canManage?members.results:[],drafts:drafts.results};
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

export default {
 async fetch(request,env){
  if(request.method==="OPTIONS")return reply({});
  if(request.method==="GET" && new URL(request.url).pathname==="/api/catalog"){
    try{
      const lessons=await env.DB.prepare("SELECT id,title,summary,position FROM lessons WHERE published=1 ORDER BY position,id").all();
      const quizzes=await env.DB.prepare("SELECT id,title,description FROM quizzes WHERE published=1 ORDER BY id").all();
      return reply({lessons:lessons.results,quizzes:quizzes.results});
    }catch{return reply({error:"Catalog unavailable"},503)}
  }
  if(request.method==="GET" && new URL(request.url).pathname.startsWith("/api/")){
    try{
      const path=new URL(request.url).pathname.split("/");
      const id=Number(path[3]);
      if(!Number.isSafeInteger(id)||id<=0)return reply({error:"Invalid ID"},400);
      if(path[2]==="lesson"){
        const lesson=await env.DB.prepare("SELECT id,title,summary,body FROM lessons WHERE id=? AND published=1").bind(id).first();
        return lesson?reply({lesson}):reply({error:"Not found"},404);
      }
      if(path[2]==="quiz"){
        const quiz=await env.DB.prepare("SELECT id,title FROM quizzes WHERE id=? AND published=1").bind(id).first();
        if(!quiz)return reply({error:"Not found"},404);
        const q=await env.DB.prepare("SELECT id,prompt,options_json,position FROM quiz_questions WHERE quiz_id=? ORDER BY position,id").bind(id).all();
        return reply({quiz,questions:q.results.map(({options_json,...x})=>({...x,options:JSON.parse(options_json)}))});
      }
      return reply({error:"Not found"},404);
    }catch{return reply({error:"Content unavailable"},503)}
  }
  if(request.method!=="POST")return reply({error:"Method not allowed"},405);
  if(Number(request.headers.get("content-length")||0)>16384)return reply({error:"Too large"},413);
  if(!env.DB)return reply({error:"Service not configured"},503);
  try{
   const payload=await request.json();
   const user=await verify(payload.initData,env.TELEGRAM_BOT_TOKEN);
   const id=user.id, bucket=Math.floor(Date.now()/60000);
   const rl=await env.DB.prepare("INSERT INTO request_limits(telegram_id,window_bucket,request_count) VALUES(?,?,1) ON CONFLICT(telegram_id,window_bucket) DO UPDATE SET request_count=request_count+1 RETURNING request_count").bind(id,bucket).first();
   if(rl.request_count>60)return reply({error:"Too many requests"},429);
   await env.DB.prepare("INSERT INTO candidate_users(telegram_id,display_name,username) VALUES(?,?,?) ON CONFLICT(telegram_id) DO UPDATE SET display_name=excluded.display_name,username=excluded.username,updated_at=CURRENT_TIMESTAMP").bind(id,String(user.first_name||"").slice(0,100),user.username||null).run();
   const action=payload.action;
   if(["myWorkspaces","createWorkspace","platformSummary","workspaceSummary","auditTrail","addMember","removeMember","createTask","taskStatus","createEvent","createCommitment","commitmentStatus","createExpense","createDraft","draftStatus"].includes(action)){
      const result=await handleOps(action,payload,env.DB,user,env);
      return reply(result,result.status||200);
   }
   if(action==="home"){
    const [lessons,quizzes,attempts,progress,bookmarks,prefs]=await Promise.all([
     env.DB.prepare("SELECT id,title,summary,position FROM lessons WHERE published=1 ORDER BY position,id LIMIT 100").all(),
     env.DB.prepare("SELECT id,title,description FROM quizzes WHERE published=1 ORDER BY id LIMIT 100").all(),
     env.DB.prepare("SELECT id,quiz_id,score,question_count,submitted_at FROM quiz_attempts WHERE telegram_id=? ORDER BY submitted_at DESC LIMIT 20").bind(id).all(),
     env.DB.prepare("SELECT lesson_id FROM lesson_progress WHERE telegram_id=? ORDER BY completed_at DESC").bind(id).all(),
     env.DB.prepare("SELECT lesson_id FROM lesson_bookmarks WHERE telegram_id=?").bind(id).all(),
     env.DB.prepare("SELECT daily_goal FROM user_preferences WHERE telegram_id=?").bind(id).first()
    ]);
    return reply({user:{id,name:String(user.first_name||"").slice(0,100)},lessons:lessons.results,quizzes:quizzes.results,attempts:attempts.results,completed:progress.results.map(x=>x.lesson_id),bookmarks:bookmarks.results.map(x=>x.lesson_id),dailyGoal:prefs?.daily_goal||1});
   }
   if(action==="lesson"){
    if(!validId(payload.id))return reply({error:"Invalid ID"},400);
    const lesson=await env.DB.prepare("SELECT id,title,summary,body FROM lessons WHERE published=1 AND id=?").bind(Number(payload.id)).first();
    return lesson?reply({lesson}):reply({error:"Not found"},404);
   }
   if(action==="completeLesson"){
    if(!validId(payload.id))return reply({error:"Invalid ID"},400);
    const lesson=await env.DB.prepare("SELECT id FROM lessons WHERE published=1 AND id=?").bind(Number(payload.id)).first();
    if(!lesson)return reply({error:"Not found"},404);
    await env.DB.prepare("INSERT OR IGNORE INTO lesson_progress(telegram_id,lesson_id) VALUES(?,?)").bind(id,lesson.id).run();
    return reply({completed:true,lessonId:lesson.id});
   }
   if(action==="bookmark"){
    if(!validId(payload.id)||typeof payload.enabled!=="boolean")return reply({error:"Invalid input"},400);
    const row=await env.DB.prepare("SELECT id FROM lessons WHERE id=? AND published=1").bind(Number(payload.id)).first();
    if(!row)return reply({error:"Not found"},404);
    if(payload.enabled)await env.DB.prepare("INSERT OR IGNORE INTO lesson_bookmarks(telegram_id,lesson_id) VALUES(?,?)").bind(id,row.id).run();
    else await env.DB.prepare("DELETE FROM lesson_bookmarks WHERE telegram_id=? AND lesson_id=?").bind(id,row.id).run();
    return reply({saved:payload.enabled,lessonId:row.id});
   }
   if(action==="note"){
    if(!validId(payload.id))return reply({error:"Invalid ID"},400);
    const row=await env.DB.prepare("SELECT id FROM lessons WHERE id=? AND published=1").bind(Number(payload.id)).first();
    if(!row)return reply({error:"Not found"},404);
    if(payload.note===undefined){
      const note=await env.DB.prepare("SELECT note FROM lesson_notes WHERE telegram_id=? AND lesson_id=?").bind(id,row.id).first();
      return reply({note:note?.note||""});
    }
    if(typeof payload.note!=="string"||payload.note.length>2000)return reply({error:"Invalid note"},400);
    if(payload.note.trim())await env.DB.prepare("INSERT INTO lesson_notes(telegram_id,lesson_id,note) VALUES(?,?,?) ON CONFLICT(telegram_id,lesson_id) DO UPDATE SET note=excluded.note,updated_at=CURRENT_TIMESTAMP").bind(id,row.id,payload.note.trim()).run();
    else await env.DB.prepare("DELETE FROM lesson_notes WHERE telegram_id=? AND lesson_id=?").bind(id,row.id).run();
    return reply({saved:true});
   }
   if(action==="dailyGoal"){
    const goal=payload.goal;
    if(!Number.isInteger(goal)||goal<1||goal>5)return reply({error:"Invalid goal"},400);
    await env.DB.prepare("INSERT INTO user_preferences(telegram_id,daily_goal) VALUES(?,?) ON CONFLICT(telegram_id) DO UPDATE SET daily_goal=excluded.daily_goal,updated_at=CURRENT_TIMESTAMP").bind(id,goal).run();
    return reply({dailyGoal:goal});
   }
   if(action==="quiz"){
    if(!validId(payload.id))return reply({error:"Invalid ID"},400);
    const q=await env.DB.prepare("SELECT id,title FROM quizzes WHERE published=1 AND id=?").bind(Number(payload.id)).first();
    if(!q)return reply({error:"Not found"},404);
    const rows=await env.DB.prepare("SELECT id,prompt,options_json,position FROM quiz_questions WHERE quiz_id=? ORDER BY position,id LIMIT 100").bind(q.id).all();
    return reply({quiz:q,questions:rows.results.map(({options_json,...r})=>({...r,options:JSON.parse(options_json)}))});
   }
   if(action==="submit"){
    if(!validId(payload.id)||!Array.isArray(payload.answers)||payload.answers.length>100||!payload.answers.every(a=>Number.isInteger(a)&&a>=0&&a<=7))return reply({error:"Invalid answers"},400);
    const q=await env.DB.prepare("SELECT id FROM quizzes WHERE published=1 AND id=?").bind(Number(payload.id)).first();
    if(!q)return reply({error:"Not found"},404);
    const rows=await env.DB.prepare("SELECT id,correct_index,options_json FROM quiz_questions WHERE quiz_id=? ORDER BY position,id LIMIT 100").bind(q.id).all();
    const questions=rows.results;
    if(!questions.length||questions.length!==payload.answers.length)return reply({error:"Incomplete submission"},400);
    if(!questions.every((x,i)=>payload.answers[i]<JSON.parse(x.options_json).length))return reply({error:"Invalid option"},400);
    const score=questions.reduce((v,x,i)=>v+(x.correct_index===payload.answers[i]?1:0),0);
    await env.DB.prepare("INSERT INTO quiz_attempts(id,quiz_id,telegram_id,answers_json,score,question_count) VALUES(?,?,?,?,?,?)").bind(crypto.randomUUID(),q.id,id,JSON.stringify(payload.answers),score,questions.length).run();
    return reply({score,total:questions.length});
   }
   return reply({error:"Unknown action"},400);
  }catch(e){
   if(["UNAUTHORIZED","INVALID_INIT_DATA","EXPIRED_INIT_DATA","INVALID_SIGNATURE"].includes(e?.message))return reply({error:e.message},401);
   if(e?.message==="NOT_CONFIGURED")return reply({error:"Telegram bot token not configured"},503);
   console.error("Candidatory API error",e?.name||"Error");
   return reply({error:"Internal error"},500);
  }
 }
};
