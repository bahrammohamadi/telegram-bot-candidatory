// Read-only learning and task progress for the signed Telegram owner.
// Counts are raw activity metrics, not claims about candidate quality or voter behavior.
const progressResponse=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});
const safeNumber=value=>Number.isFinite(Number(value))?Number(value):0;
export async function handleProgress(db,user,body){
  if(body?.action!=="overview")return progressResponse({error:"UNKNOWN_ACTION"},400);
  const id=user.id;
  const [profile,goals,calendar,practice,quizzes,availableQuizzes]=await Promise.all([
    db.prepare("SELECT 1 AS present FROM candidate_profiles WHERE telegram_id=? LIMIT 1").bind(id).first(),
    db.prepare("SELECT COUNT(*) AS total,SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) AS completed,SUM(CASE WHEN status='open' AND target_date IS NOT NULL AND target_date < date('now') THEN 1 ELSE 0 END) AS overdue FROM personal_goals_v2 WHERE telegram_id=?").bind(id).first(),
    db.prepare("SELECT COUNT(*) AS total,SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) AS completed,SUM(CASE WHEN status='scheduled' THEN 1 ELSE 0 END) AS scheduled FROM personal_calendar_v1 WHERE telegram_id=?").bind(id).first(),
    db.prepare("SELECT COUNT(*) AS total,SUM(CASE WHEN kind='speech' THEN 1 ELSE 0 END) AS speech,SUM(CASE WHEN kind='qa' THEN 1 ELSE 0 END) AS qa,COALESCE(SUM(duration_seconds),0) AS duration_seconds,ROUND(AVG(self_score),1) AS self_rating FROM practice_sessions_v1 WHERE telegram_id=?").bind(id).first(),
    db.prepare("SELECT COUNT(*) AS attempts,COUNT(DISTINCT quiz_id) AS unique_quizzes,COALESCE(SUM(score),0) AS correct_answers,COALESCE(SUM(question_count),0) AS answered_questions FROM quiz_attempts WHERE telegram_id=?").bind(id).first(),
    db.prepare("SELECT COUNT(*) AS n FROM quizzes WHERE published=1 AND id IN (SELECT quiz_id FROM quiz_questions GROUP BY quiz_id HAVING count(*) BETWEEN 2 AND 20)").first()
  ]);
  const totalAnswers=safeNumber(quizzes?.answered_questions);
  return progressResponse({
    ok:true,scope:"authenticated_test_account",generated_at:new Date().toISOString(),
    profile:{completed:Boolean(profile?.present)},
    goals:{total:safeNumber(goals?.total),completed:safeNumber(goals?.completed),overdue:safeNumber(goals?.overdue)},
    calendar:{total:safeNumber(calendar?.total),completed:safeNumber(calendar?.completed),scheduled:safeNumber(calendar?.scheduled)},
    practice:{total:safeNumber(practice?.total),speech:safeNumber(practice?.speech),qa:safeNumber(practice?.qa),duration_seconds:safeNumber(practice?.duration_seconds),self_rating:practice?.self_rating===null||practice?.self_rating===undefined?null:safeNumber(practice.self_rating)},
    quizzes:{attempts:safeNumber(quizzes?.attempts),unique_quizzes:safeNumber(quizzes?.unique_quizzes),available_quizzes:safeNumber(availableQuizzes?.n),correct_answers:safeNumber(quizzes?.correct_answers),answered_questions:totalAnswers,correct_percentage:totalAnswers?Math.round(1000*safeNumber(quizzes?.correct_answers)/totalAnswers)/10:null}
  });
}
