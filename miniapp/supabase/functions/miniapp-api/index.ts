import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
const CORS = { "Access-Control-Allow-Origin": Deno.env.get("MINIAPP_ORIGIN") || "https://example.invalid", "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "POST,OPTIONS", "Content-Type": "application/json" };
const response = (data: unknown, status=200) => new Response(JSON.stringify(data), {status,headers:CORS});
async function verifyTelegram(initData: string): Promise<{id:number; first_name?:string; username?:string}> {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!token) throw Error("Server not configured");
  const params = new URLSearchParams(initData);
  const hash = params.get("hash") || "";
  const authDate = Number(params.get("auth_date"));
  if (!/^[0-9a-f]{64}$/.test(hash) || !Number.isFinite(authDate) || Math.abs(Date.now()/1000-authDate)>3600) throw Error("Invalid Telegram session");
  const data = [...params.entries()].filter(([key])=>key!=="hash" && key!=="signature").sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>k+"="+v).join("\n");
  const enc = new TextEncoder();
  const signatureKey = await crypto.subtle.importKey("raw",enc.encode("WebAppData"),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const secret = await crypto.subtle.sign("HMAC",signatureKey,enc.encode(token));
  const key = await crypto.subtle.importKey("raw",secret,{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC",key,enc.encode(data)));
  const supplied = new Uint8Array(hash.match(/.{2}/g)!.map(x=>parseInt(x,16)));
  let mismatch=0; for(let i=0;i<32;i++)mismatch|=signature[i]^supplied[i];
  if(mismatch!==0) throw Error("Invalid Telegram signature");
  const user=JSON.parse(params.get("user")||"null");
  if(!user || !Number.isSafeInteger(user.id) || user.id<=0) throw Error("Missing Telegram user");
  return user;
}
Deno.serve(async (req)=>{
  if(req.method==="OPTIONS")return new Response(null,{headers:CORS});
  if(req.method!=="POST")return response({error:"Method not allowed"},405);
  try {
    const body=await req.json();
    if(typeof body.initData!=="string" || body.initData.length>8192) return response({error:"Unauthorized"},401);
    const user=await verifyTelegram(body.initData);
    const url=Deno.env.get("SUPABASE_URL"), key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if(!url||!key)throw Error("Database credentials missing");
    const db=createClient(url,key,{auth:{persistSession:false}});
    const name=String(user.first_name||"").slice(0,100);
    const {error:upsertError}=await db.from("candidate_users").upsert({telegram_id:user.id,display_name:name,username:user.username||null,updated_at:new Date().toISOString()});
    if(upsertError)throw upsertError;
    if(body.action==="home"){
      const [lessons,quizzes,attempts]=await Promise.all([
        db.from("lessons").select("id,title,summary,position").eq("published",true).order("position"),
        db.from("quizzes").select("id,title,description").eq("published",true).order("id"),
        db.from("quiz_attempts").select("id,quiz_id,score,question_count,submitted_at").eq("telegram_id",user.id).order("submitted_at",{ascending:false}).limit(20)
      ]);
      for(const x of [lessons,quizzes,attempts])if(x.error)throw x.error;
      return response({user:{id:user.id,name},lessons:lessons.data,quizzes:quizzes.data,attempts:attempts.data});
    }
    if(body.action==="lesson"){
      const id=Number(body.id);
      if(!Number.isSafeInteger(id))return response({error:"Bad ID"},400);
      const {data,error}=await db.from("lessons").select("id,title,summary,body").eq("published",true).eq("id",id).maybeSingle();
      if(error)throw error;return response({lesson:data});
    }
    if(body.action==="quiz"){
      const id=Number(body.id);
      if(!Number.isSafeInteger(id))return response({error:"Bad ID"},400);
      const {data:quiz,error:qe}=await db.from("quizzes").select("id,title").eq("published",true).eq("id",id).maybeSingle();
      if(qe)throw qe;if(!quiz)return response({error:"Quiz not found"},404);
      const {data,error}=await db.from("quiz_questions").select("id,prompt,options,position").eq("quiz_id",id).order("position");
      if(error)throw error;return response({quiz,questions:data});
    }
    if(body.action==="submit"){
      const id=Number(body.id),answers=body.answers;
      if(!Number.isSafeInteger(id)||!Array.isArray(answers)||answers.length>100)return response({error:"Invalid submission"},400);
      const {data:quiz,error:qe}=await db.from("quizzes").select("id").eq("published",true).eq("id",id).maybeSingle();
      if(qe)throw qe;if(!quiz)return response({error:"Not found"},404);
      const {data:questions,error}=await db.from("quiz_questions").select("id,correct_index").eq("quiz_id",id).order("position");
      if(error)throw error;if(!questions?.length)return response({error:"Empty quiz"},400);
      if(answers.length!==questions.length)return response({error:"Incomplete answers"},400);
      const valid=answers.every((a:unknown)=>Number.isInteger(a)&&Number(a)>=0&&Number(a)<=7);
      if(!valid)return response({error:"Invalid answers"},400);
      const score=questions.reduce((sum,q,i)=>sum+(q.correct_index===answers[i]?1:0),0);
      const {error:writeError}=await db.from("quiz_attempts").insert({quiz_id:id,telegram_id:user.id,answers,score,question_count:questions.length});
      if(writeError)throw writeError;return response({score,total:questions.length});
    }
    return response({error:"Unknown action"},400);
  }catch(e){const message=e instanceof Error?e.message:"Error";if(/Telegram|Unauthorized/.test(message))return response({error:"Unauthorized"},401);console.error("miniapp api error",message);return response({error:"Server error"},500);}
});