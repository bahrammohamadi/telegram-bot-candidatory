-- Candidatory Telegram Mini App — isolated schema, server-only access.
create table if not exists public.candidate_users (
 telegram_id bigint primary key,
 display_name text not null default '',
 username text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.lessons (
 id bigint generated always as identity primary key,
 title text not null,
 summary text not null default '',
 body text not null default '',
 position integer not null default 0,
 published boolean not null default false
);
create table if not exists public.quizzes (
 id bigint generated always as identity primary key,
 title text not null,
 description text not null default '',
 published boolean not null default false
);
create table if not exists public.quiz_questions (
 id bigint generated always as identity primary key,
 quiz_id bigint not null references public.quizzes(id) on delete cascade,
 prompt text not null,
 options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 8),
 correct_index integer not null check (correct_index >= 0 and correct_index <= 7),
 position integer not null default 0
);
create table if not exists public.quiz_attempts (
 id uuid primary key default gen_random_uuid(),
 quiz_id bigint not null references public.quizzes(id),
 telegram_id bigint not null references public.candidate_users(telegram_id),
 answers jsonb not null,
 score integer not null,
 question_count integer not null,
 submitted_at timestamptz not null default now()
);
create index if not exists idx_attempts_user on public.quiz_attempts(telegram_id, submitted_at desc);
create index if not exists idx_questions_quiz on public.quiz_questions(quiz_id, position);
alter table public.candidate_users enable row level security;
alter table public.lessons enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
-- No public RLS policies. Only trusted Edge Function using service role accesses these tables.
revoke all on public.candidate_users, public.lessons, public.quizzes, public.quiz_questions, public.quiz_attempts from anon, authenticated;
-- Example lesson only, safe to re-run without duplicating:
insert into public.lessons(title,summary,body,position,published)
select 'آشنایی با کاندیداتوری','مفاهیم اولیه و برنامه‌ریزی','این درس نمونه است و باید پیش از انتشار عمومی با محتوای تأییدشده جایگزین شود.',1,false
where not exists (select 1 from public.lessons where title='آشنایی با کاندیداتوری');
