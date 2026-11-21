import {QUIZ_BANK} from './quiz-bank.mjs';

// Idempotent fixture seeding for isolated D1. Never run against production.
export async function seedQuizzes(db){
  const stmts=[];
  for(const quiz of QUIZ_BANK){
    stmts.push(db.prepare("INSERT OR IGNORE INTO quizzes(id,title,description,published) VALUES(?,?,?,1)").bind(quiz.id,quiz.title,quiz.description));
    for(const q of quiz.questions){
      stmts.push(db.prepare("INSERT OR IGNORE INTO quiz_questions(id,quiz_id,prompt,options_json,correct_index,position) VALUES(?,?,?,?,?,?)").bind(q.id,quiz.id,q.prompt,JSON.stringify(q.options),q.correct,quiz.questions.indexOf(q)+1));
      stmts.push(db.prepare("INSERT OR IGNORE INTO quiz_guidance_v1(question_id,rationale,source_url) VALUES(?,?,?)").bind(q.id,q.rationale,q.source));
    }
  }
  await db.batch(stmts);
  const check=await db.prepare("SELECT COUNT(*) AS n FROM quiz_questions WHERE quiz_id IN (91001,91002)").first();
  if(check?.n!==10)throw Error('QUIZ_FIXTURE_MISMATCH');
  return {quizzes:QUIZ_BANK.length,questions:check.n};
}
