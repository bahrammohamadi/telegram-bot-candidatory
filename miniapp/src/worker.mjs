import {courses} from './courses.mjs';
import {validateInitData} from './auth.mjs';
import {html} from './ui.mjs';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const fail=(msg,status=400)=>json({error:msg},status);
export default {async fetch(req,env){
 const url=new URL(req.url);
 if(req.method==='GET'&&(url.pathname==='/app.css'||url.pathname==='/app.js'))return env.ASSETS?env.ASSETS.fetch(req):fail('Static assets not configured',503);
 if(req.method==='GET'&&url.pathname==='/')return new Response(html,{headers:{'content-type':'text/html; charset=utf-8','content-security-policy':"default-src 'self'; script-src 'self' https://telegram.org; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors https://web.telegram.org;",'x-content-type-options':'nosniff'}});
 if(url.pathname==='/health'&&req.method==='GET')return json({status:'ok',database:!!env.DB});
 if(!url.pathname.startsWith('/api/'))return fail('Not found',404);
 if(!env.BOT_TOKEN||!env.DB)return fail('Service not configured',503);
 const initData=req.headers.get('X-Telegram-Init-Data');
 const user=await validateInitData(initData,env.BOT_TOKEN);
 if(!user)return fail('Telegram authentication required',401);
 const id=String(user.id);
 try{
  await env.DB.prepare('INSERT INTO accounts(telegram_id,first_name,last_name,username) VALUES(?,?,?,?) ON CONFLICT(telegram_id) DO UPDATE SET first_name=excluded.first_name,last_name=excluded.last_name,username=excluded.username,updated_at=CURRENT_TIMESTAMP').bind(id,String(user.first_name||'').slice(0,100),String(user.last_name||'').slice(0,100),String(user.username||'').slice(0,100)).run();
  if(url.pathname==='/api/courses'&&req.method==='GET'){
   const done=await env.DB.prepare('SELECT course_id FROM learning_progress WHERE telegram_id=? AND passed=1').bind(id).all();
   return json({courses:courses.map(({id,title,summary,category,minutes,sections,quiz})=>({id,title,summary,category,minutes,sections,quiz:{question:quiz.question,options:quiz.options}})),completed:(done.results||[]).map(x=>x.course_id)});
  }
  if(url.pathname==='/api/courses/complete'&&req.method==='POST'){
   const b=await req.json();const course=courses.find(x=>x.id===b.courseId);
   if(!course||!Number.isInteger(b.answer))return fail('Invalid answer');
   if(b.answer!==course.quiz.correct)return json({passed:false});
   await env.DB.prepare('INSERT INTO learning_progress(telegram_id,course_id,passed) VALUES(?,?,1) ON CONFLICT(telegram_id,course_id) DO UPDATE SET passed=1,updated_at=CURRENT_TIMESTAMP').bind(id,course.id).run();
   return json({passed:true});
  }
  if(url.pathname==='/api/overview'&&req.method==='GET'){
   const [profile,tasks,assessment]=await Promise.all([
    env.DB.prepare('SELECT full_name,election_type,constituency,occupation FROM profile WHERE telegram_id=?').bind(id).first(),
    env.DB.prepare('SELECT id,title,status,created_at FROM tasks WHERE telegram_id=? ORDER BY created_at DESC LIMIT 30').bind(id).all(),
    env.DB.prepare('SELECT score,created_at FROM assessments WHERE telegram_id=? ORDER BY created_at DESC LIMIT 1').bind(id).first()
   ]);
   return json({user:{first_name:user.first_name||'',username:user.username||''},profile:profile||null,tasks:tasks.results||[],lastAssessment:assessment||null});
  }
  if(req.method==='POST'&&url.pathname==='/api/profile'){
   const b=await req.json();const fields=['full_name','election_type','constituency','occupation'];for(const key of fields)if(typeof b[key]!=='string'||b[key].length>160)return fail('Invalid profile');
   await env.DB.prepare('INSERT INTO profile(telegram_id,full_name,election_type,constituency,occupation) VALUES(?,?,?,?,?) ON CONFLICT(telegram_id) DO UPDATE SET full_name=excluded.full_name,election_type=excluded.election_type,constituency=excluded.constituency,occupation=excluded.occupation,updated_at=CURRENT_TIMESTAMP').bind(id,...fields.map(x=>b[x].trim())).run();
   return json({ok:true});
  }
  if(req.method==='POST'&&url.pathname==='/api/tasks'){
   const b=await req.json();if(typeof b.title!=='string'||!b.title.trim()||b.title.length>180)return fail('Invalid title');
   const taskId=crypto.randomUUID();await env.DB.prepare('INSERT INTO tasks(id,telegram_id,title) VALUES(?,?,?)').bind(taskId,id,b.title.trim()).run();return json({ok:true,id:taskId},201);
  }
  if(req.method==='PATCH'&&url.pathname.startsWith('/api/tasks/')){
   const taskId=url.pathname.slice('/api/tasks/'.length);const b=await req.json();if(!['done','open'].includes(b.status))return fail('Invalid status');
   const r=await env.DB.prepare('UPDATE tasks SET status=? WHERE id=? AND telegram_id=?').bind(b.status,taskId,id).run();return r.meta.changes?json({ok:true}):fail('Task not found',404);
  }
  return fail('Not found',404);
 }catch(e){console.error('api error',e?.message);return fail('Unexpected server error',500);}
}};
