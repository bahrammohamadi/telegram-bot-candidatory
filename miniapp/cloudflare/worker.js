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
