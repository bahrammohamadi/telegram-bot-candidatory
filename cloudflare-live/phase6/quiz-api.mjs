// Reuse the existing isolated quizzes / quiz_questions / quiz_attempts tables.
// Grade on server only. Never send correct_index before a completed submission.
const quizResponse=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});
const quizIdValid=id=>Number.isSafeInteger(id)&&id>0&&id<100000000;
async function publishedQuiz(db,id){
  return db.prepare("SELECT id,title,description FROM quizzes WHERE id=? AND published=1").bind(id).first();
}
async function quizQuestions(db,quizId){
  const r=await db.prepare("SELECT id,prompt,options_json,correct_index,position FROM quiz_questions WHERE quiz_id=? ORDER BY position,id").bind(quizId).all();
  return r.results||[];
}
function safeOptions(q){
  let options;try{options=JSON.parse(q.options_json)}catch{return null}
  if(!Array.isArray(options)||options.length<2||options.length>8||options.some(x=>typeof x!=="string"||x.length>400)||!Number.isSafeInteger(q.correct_index)||q.correct_index>=options.length||q.correct_index<0)return null;
  return options;
}
function gradeFeedback(q,selected,source){
  const opt=safeOptions(q);
  return {question_id:q.id,prompt:q.prompt,selected_index:selected,correct_index:q.correct_index,is_correct:selected===q.correct_index,correct_answer:opt[q.correct_index],rationale:source?.rationale||"",source_url:source?.source_url||""};
}
async function quizGuidance(db,ids){
  const result=new Map();
  for(const id of ids){
    const r=await db.prepare("SELECT rationale,source_url FROM quiz_guidance_v1 WHERE question_id=?").bind(id).first();
    result.set(id,r||{});
  }
  return result;
}
export async function handleQuiz(db,user,b){
  if(b?.action==="catalog"){
    const rows=await db.prepare("SELECT q.id,q.title,q.description,(SELECT COUNT(*) FROM quiz_questions p WHERE p.quiz_id=q.id) AS question_count FROM quizzes q WHERE q.published=1 ORDER BY q.id LIMIT 30").all();
    return quizResponse({ok:true,quizzes:rows.results||[]});
  }
  if(b?.action==="history"){
    const rows=await db.prepare("SELECT a.id AS attempt_id,a.quiz_id,q.title,a.score,a.question_count,a.submitted_at FROM quiz_attempts a JOIN quizzes q ON q.id=a.quiz_id WHERE a.telegram_id=? ORDER BY a.submitted_at DESC,a.id DESC LIMIT 50").bind(user.id).all();
    return quizResponse({ok:true,attempts:rows.results||[]});
  }
  if(b?.action==="review"){
    if(typeof b.attempt_id!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(b.attempt_id))return quizResponse({error:"INVALID_ATTEMPT_ID"},400);
    const previous=await db.prepare("SELECT a.quiz_id,a.answers_json,a.score,a.question_count,a.submitted_at,q.title FROM quiz_attempts a JOIN quizzes q ON q.id=a.quiz_id WHERE a.id=? AND a.telegram_id=?").bind(b.attempt_id,user.id).first();
    if(!previous)return quizResponse({error:"ATTEMPT_NOT_FOUND"},404);
    const questions=await quizQuestions(db,previous.quiz_id);
    let answers;try{answers=JSON.parse(previous.answers_json)}catch{return quizResponse({error:"ATTEMPT_DATA_INVALID"},503)}
    if(!answers||typeof answers!=="object"||Array.isArray(answers))return quizResponse({error:"ATTEMPT_DATA_INVALID"},503);
    const guidance=await quizGuidance(db,questions.map(q=>q.id));
    const feedback=questions.filter(q=>safeOptions(q)).map(q=>gradeFeedback(q,answers[String(q.id)],guidance.get(q.id)));
    return quizResponse({ok:true,quiz_id:previous.quiz_id,title:previous.title,score:previous.score,question_count:previous.question_count,submitted_at:previous.submitted_at,feedback});
  }
  if(!quizIdValid(b?.quiz_id))return quizResponse({error:"INVALID_QUIZ_ID"},400);
  const quiz=await publishedQuiz(db,b.quiz_id);
  if(!quiz)return quizResponse({error:"QUIZ_NOT_FOUND"},404);
  const questions=await quizQuestions(db,b.quiz_id);
  if(questions.length<2||questions.length>20)return quizResponse({error:"QUIZ_NOT_READY"},503);
  const optionLists=questions.map(safeOptions);
  if(optionLists.some(x=>x===null))return quizResponse({error:"QUIZ_NOT_READY"},503);
  if(b.action==="start"){
    return quizResponse({ok:true,quiz,questions:questions.map((q,i)=>({id:q.id,prompt:q.prompt,options:optionLists[i],position:q.position}))});
  }
  if(b.action!=="submit")return quizResponse({error:"UNKNOWN_ACTION"},400);
  const answers=b.answers;
  if(!answers||typeof answers!=="object"||Array.isArray(answers))return quizResponse({error:"INVALID_ANSWERS"},400);
  const keys=Object.keys(answers);
  if(keys.length!==questions.length||keys.some(k=>!/^[1-9]\d*$/.test(k)))return quizResponse({error:"INVALID_ANSWERS"},400);
  let score=0;
  for(let i=0;i<questions.length;i++){
    const q=questions[i],selected=answers[String(q.id)];
    if(!Number.isSafeInteger(selected)||selected<0||selected>=optionLists[i].length)return quizResponse({error:"INVALID_ANSWERS"},400);
    if(selected===q.correct_index)score++;
  }
  const attempts=await db.prepare("SELECT COUNT(*) AS n FROM quiz_attempts WHERE telegram_id=? AND quiz_id=? AND submitted_at>=datetime('now','-1 day')").bind(user.id,b.quiz_id).first();
  if((attempts?.n||0)>=20)return quizResponse({error:"QUIZ_DAILY_LIMIT"},429);
  const attemptId=crypto.randomUUID();
  await db.batch([
    db.prepare("INSERT INTO candidate_users(telegram_id,display_name,username) VALUES(?,?,?) ON CONFLICT(telegram_id) DO NOTHING").bind(user.id,user.name,user.username),
    db.prepare("INSERT INTO quiz_attempts(id,quiz_id,telegram_id,answers_json,score,question_count) VALUES(?,?,?,?,?,?)").bind(attemptId,b.quiz_id,user.id,JSON.stringify(answers),score,questions.length)
  ]);
  const guidance=await quizGuidance(db,questions.map(q=>q.id));
  return quizResponse({ok:true,attempt_id:attemptId,score,question_count:questions.length,feedback:questions.map(q=>gradeFeedback(q,answers[String(q.id)],guidance.get(q.id)))},201);
}
