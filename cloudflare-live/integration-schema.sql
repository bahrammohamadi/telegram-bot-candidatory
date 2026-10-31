-- Production schema only, captured 2026-10-31; no user records.
-- Apply only to a NEW isolated integration database. Never run over Production.
PRAGMA foreign_keys=ON;
CREATE TABLE admin_audit(id TEXT PRIMARY KEY,workspace_id TEXT,actor_id INTEGER NOT NULL,action TEXT NOT NULL,record_type TEXT NOT NULL,record_id TEXT NOT NULL DEFAULT '',detail TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE ai_daily_usage(telegram_id INTEGER NOT NULL REFERENCES candidate_users(telegram_id),day TEXT NOT NULL CHECK(length(day)=10),requests INTEGER NOT NULL DEFAULT 0 CHECK(requests>=0),PRIMARY KEY(telegram_id,day));

CREATE TABLE ai_global_usage(day TEXT PRIMARY KEY CHECK(length(day)=10),requests INTEGER NOT NULL DEFAULT 0 CHECK(requests>=0));

CREATE TABLE ai_usage_v2 (id TEXT PRIMARY KEY, telegram_id INTEGER NOT NULL REFERENCES candidate_users(telegram_id) ON DELETE CASCADE, feature TEXT NOT NULL, provider TEXT NOT NULL, model TEXT, status TEXT NOT NULL CHECK(status IN ('success','failure')), units INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE app_feedback_v1 (id TEXT PRIMARY KEY,telegram_id INTEGER NOT NULL,section TEXT NOT NULL,kind TEXT NOT NULL CHECK(kind IN ('bug','idea','question')),description TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','reviewing','resolved')),admin_note TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE candidate_checklist_items(id TEXT PRIMARY KEY,telegram_id INTEGER NOT NULL REFERENCES candidate_users(telegram_id) ON DELETE CASCADE,item_key TEXT NOT NULL,label TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','done')),source_type TEXT NOT NULL DEFAULT 'recommended',updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(telegram_id,item_key));

CREATE TABLE candidate_profile_details (telegram_id INTEGER PRIMARY KEY, details_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(details_json)), updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE candidate_profiles(telegram_id INTEGER PRIMARY KEY REFERENCES candidate_users(telegram_id) ON DELETE CASCADE,election_type TEXT NOT NULL CHECK(election_type IN ('council','parliament','presidency','other')),district TEXT NOT NULL DEFAULT '',stage TEXT NOT NULL CHECK(stage IN ('planning','registration','operations','report')),professional_summary TEXT NOT NULL DEFAULT '',updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE candidate_subscriptions_v2 (telegram_id INTEGER PRIMARY KEY REFERENCES candidate_users(telegram_id) ON DELETE CASCADE, plan_id TEXT NOT NULL DEFAULT 'free' CHECK(plan_id IN ('free','professional')), status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','expired','revoked')), expires_at TEXT, source TEXT NOT NULL DEFAULT 'system' CHECK(source IN ('system','admin','verified_payment')), updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE candidate_users(telegram_id INTEGER PRIMARY KEY,display_name TEXT NOT NULL DEFAULT '',username TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE content_revision_requests(id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,title TEXT NOT NULL,body TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','review','approved','rejected')),created_by INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE creative_projects_v2(id TEXT PRIMARY KEY,telegram_id INTEGER NOT NULL REFERENCES candidate_users(telegram_id) ON DELETE CASCADE,kind TEXT NOT NULL CHECK(kind IN ('poster','portrait','presentation','social','infographic')),title TEXT NOT NULL,project_json TEXT NOT NULL CHECK(json_valid(project_json)),updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE design_service_orders_v2 (id TEXT PRIMARY KEY,telegram_id INTEGER NOT NULL REFERENCES candidate_users(telegram_id),service TEXT NOT NULL CHECK(service IN ('portrait','notice','presentation','brand')),title TEXT NOT NULL,brief TEXT NOT NULL,style TEXT NOT NULL DEFAULT 'formal',status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted','reviewing','quoted','working','ready','closed','cancelled')),quote_toman INTEGER,admin_note TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE election_legal_personal_checks(telegram_id INTEGER NOT NULL REFERENCES candidate_users(telegram_id) ON DELETE CASCADE,source_id TEXT NOT NULL REFERENCES election_legal_sources(id) ON DELETE CASCADE,acknowledged_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(telegram_id,source_id));

CREATE TABLE election_legal_sources(id TEXT PRIMARY KEY,election_type TEXT NOT NULL CHECK(election_type IN ('council','parliament','presidency','other')),title TEXT NOT NULL,topic TEXT NOT NULL CHECK(topic IN ('registration','documents','deadlines','finance','general')),source_url TEXT NOT NULL,issuer TEXT NOT NULL,source_date TEXT NOT NULL DEFAULT '',reviewed_at TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','approved','archived')),notes TEXT NOT NULL DEFAULT '',created_by INTEGER,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE event_rsvps(workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,event_id TEXT NOT NULL REFERENCES workspace_events(id) ON DELETE CASCADE,telegram_id INTEGER NOT NULL REFERENCES candidate_users(telegram_id),response TEXT NOT NULL CHECK(response IN ('going','unable')),updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(event_id,telegram_id));

CREATE TABLE lesson_bookmarks(telegram_id INTEGER NOT NULL REFERENCES candidate_users(telegram_id) ON DELETE CASCADE,lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(telegram_id,lesson_id));

CREATE TABLE lesson_notes(telegram_id INTEGER NOT NULL REFERENCES candidate_users(telegram_id) ON DELETE CASCADE,lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,note TEXT NOT NULL CHECK(length(note)<=2000),updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(telegram_id,lesson_id));

CREATE TABLE lesson_progress(telegram_id INTEGER NOT NULL REFERENCES candidate_users(telegram_id) ON DELETE CASCADE,lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(telegram_id,lesson_id));

CREATE TABLE lessons(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,summary TEXT NOT NULL DEFAULT '',body TEXT NOT NULL DEFAULT '',position INTEGER NOT NULL DEFAULT 0,published INTEGER NOT NULL DEFAULT 0 CHECK(published IN (0,1)));

CREATE TABLE manual_payment_requests_v2 (id TEXT PRIMARY KEY,telegram_id INTEGER NOT NULL REFERENCES candidate_users(telegram_id), plan_id TEXT NOT NULL DEFAULT 'professional',reference TEXT NOT NULL,receipt_file_id TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),admin_id INTEGER,reviewed_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE personal_action_plans_v1(id TEXT PRIMARY KEY,telegram_id INTEGER NOT NULL REFERENCES candidate_users(telegram_id) ON DELETE CASCADE,title TEXT NOT NULL,objective TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','completed')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE personal_action_steps_v1(id TEXT PRIMARY KEY,plan_id TEXT NOT NULL REFERENCES personal_action_plans_v1(id) ON DELETE CASCADE,title TEXT NOT NULL,due_date TEXT,status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','done')),position INTEGER NOT NULL DEFAULT 0);

CREATE TABLE personal_ai_history_v1(id TEXT PRIMARY KEY,telegram_id INTEGER NOT NULL,mode TEXT NOT NULL,topic TEXT NOT NULL,result_text TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE personal_calendar_v1(id TEXT PRIMARY KEY,telegram_id INTEGER NOT NULL REFERENCES candidate_users(telegram_id) ON DELETE CASCADE,title TEXT NOT NULL,starts_at TEXT NOT NULL,notes TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','done','cancelled')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE personal_decisions_v2(id TEXT PRIMARY KEY,telegram_id INTEGER NOT NULL REFERENCES candidate_users(telegram_id) ON DELETE CASCADE,title TEXT NOT NULL,reason TEXT NOT NULL DEFAULT '',next_action TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','done')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE personal_goals_v2 (id TEXT PRIMARY KEY,telegram_id INTEGER NOT NULL REFERENCES candidate_users(telegram_id) ON DELETE CASCADE,title TEXT NOT NULL CHECK(length(title) BETWEEN 3 AND 180),details TEXT NOT NULL DEFAULT '',target_date TEXT,status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','done')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE privacy_requests(id TEXT PRIMARY KEY,telegram_id INTEGER NOT NULL REFERENCES candidate_users(telegram_id),request_type TEXT NOT NULL CHECK(request_type IN ('export','delete','correct')),details TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','reviewing','done','rejected')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,resolved_at TEXT);

CREATE TABLE product_pricing_v2 (plan_id TEXT PRIMARY KEY,price_toman INTEGER NOT NULL CHECK(price_toman>=0),duration_days INTEGER NOT NULL CHECK(duration_days>0),currency TEXT NOT NULL DEFAULT 'TOMAN',payment_enabled INTEGER NOT NULL DEFAULT 0 CHECK(payment_enabled IN (0,1)),updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE public_commitments(id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,title TEXT NOT NULL CHECK(length(title) BETWEEN 2 AND 240),description TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','review','published','completed')),evidence_link TEXT NOT NULL DEFAULT '',created_by INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE quiz_attempts(id TEXT PRIMARY KEY,quiz_id INTEGER NOT NULL REFERENCES quizzes(id),telegram_id INTEGER NOT NULL REFERENCES candidate_users(telegram_id),answers_json TEXT NOT NULL CHECK(json_valid(answers_json)),score INTEGER NOT NULL,question_count INTEGER NOT NULL,submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE quiz_questions(id INTEGER PRIMARY KEY AUTOINCREMENT,quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,prompt TEXT NOT NULL,options_json TEXT NOT NULL CHECK(json_valid(options_json)),correct_index INTEGER NOT NULL CHECK(correct_index BETWEEN 0 AND 7),position INTEGER NOT NULL DEFAULT 0);

CREATE TABLE quizzes(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',published INTEGER NOT NULL DEFAULT 0 CHECK(published IN (0,1)));

CREATE TABLE readiness_attempts(id TEXT PRIMARY KEY,telegram_id INTEGER NOT NULL REFERENCES candidate_users(telegram_id),answers_json TEXT NOT NULL CHECK(json_valid(answers_json)),score INTEGER NOT NULL,max_score INTEGER NOT NULL,submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE readiness_questions(id TEXT PRIMARY KEY,title TEXT NOT NULL,question TEXT NOT NULL,options_json TEXT NOT NULL CHECK(json_valid(options_json)),position INTEGER NOT NULL);

CREATE TABLE request_limits(telegram_id INTEGER NOT NULL,window_bucket INTEGER NOT NULL,request_count INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(telegram_id,window_bucket));

CREATE TABLE service_plans(id TEXT PRIMARY KEY,name TEXT NOT NULL UNIQUE,description TEXT NOT NULL DEFAULT '',max_members INTEGER NOT NULL DEFAULT 3 CHECK(max_members BETWEEN 1 AND 1000),active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE subscription_payments_v2 (id TEXT PRIMARY KEY, telegram_id INTEGER NOT NULL REFERENCES candidate_users(telegram_id), provider TEXT NOT NULL, provider_reference TEXT UNIQUE, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','verified','failed','refunded')), amount_minor INTEGER NOT NULL CHECK(amount_minor>=0), currency TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, verified_at TEXT);

CREATE TABLE support_tickets(id TEXT PRIMARY KEY,telegram_id INTEGER NOT NULL REFERENCES candidate_users(telegram_id),subject TEXT NOT NULL CHECK(length(subject) BETWEEN 3 AND 200),message TEXT NOT NULL CHECK(length(message) BETWEEN 5 AND 3000),status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','reviewing','resolved','closed')),admin_reply TEXT NOT NULL DEFAULT '' CHECK(length(admin_reply)<=3000),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE user_preferences(telegram_id INTEGER PRIMARY KEY REFERENCES candidate_users(telegram_id) ON DELETE CASCADE,daily_goal INTEGER NOT NULL DEFAULT 1 CHECK(daily_goal BETWEEN 1 AND 5),updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE user_text_versions_v1(id TEXT PRIMARY KEY,telegram_id INTEGER NOT NULL,field_key TEXT NOT NULL,body TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE workspace_documents(id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,title TEXT NOT NULL CHECK(length(title) BETWEEN 2 AND 200),category TEXT NOT NULL DEFAULT 'general',source_url TEXT NOT NULL CHECK(length(source_url)<=2048),visibility TEXT NOT NULL DEFAULT 'members' CHECK(visibility IN ('members','managers')),created_by INTEGER NOT NULL REFERENCES candidate_users(telegram_id),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE workspace_entitlements(workspace_id TEXT PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,plan_id TEXT NOT NULL REFERENCES service_plans(id),expires_at TEXT,assigned_by INTEGER NOT NULL,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE workspace_events(id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,title TEXT NOT NULL CHECK(length(title) BETWEEN 2 AND 240),starts_at TEXT NOT NULL,location TEXT NOT NULL DEFAULT '',description TEXT NOT NULL DEFAULT '',created_by INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE workspace_expenses(id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,description TEXT NOT NULL,amount_minor INTEGER NOT NULL CHECK(amount_minor>=0),currency TEXT NOT NULL DEFAULT 'IRR',category TEXT NOT NULL DEFAULT 'general',spent_at TEXT NOT NULL,created_by INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE workspace_invitations(id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,invited_telegram_id INTEGER NOT NULL REFERENCES candidate_users(telegram_id),role TEXT NOT NULL CHECK(role IN ('admin','editor','member','auditor')),status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','revoked')),created_by INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,expires_at TEXT NOT NULL);

CREATE TABLE workspace_members(workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,telegram_id INTEGER NOT NULL REFERENCES candidate_users(telegram_id),role TEXT NOT NULL CHECK(role IN ('owner','admin','editor','member','auditor')),status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','disabled')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(workspace_id,telegram_id));

CREATE TABLE workspace_notifications(id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,title TEXT NOT NULL,body TEXT NOT NULL DEFAULT '',created_by INTEGER NOT NULL REFERENCES candidate_users(telegram_id),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE workspace_tasks(id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,title TEXT NOT NULL CHECK(length(title) BETWEEN 2 AND 240),description TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','doing','done')),priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high')),due_date TEXT,assignee_id INTEGER REFERENCES candidate_users(telegram_id),created_by INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE workspaces(id TEXT PRIMARY KEY,name TEXT NOT NULL CHECK(length(name) BETWEEN 2 AND 120),jurisdiction TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended','archived')),created_by INTEGER NOT NULL REFERENCES candidate_users(telegram_id),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE INDEX idx_action_plan_owner ON personal_action_plans_v1(telegram_id);

CREATE INDEX idx_ai_daily_day ON ai_daily_usage(day);

CREATE INDEX idx_ai_usage_v2_user_month ON ai_usage_v2(telegram_id,created_at);

CREATE INDEX idx_app_feedback_user ON app_feedback_v1(telegram_id,created_at DESC);

CREATE INDEX idx_attempts_user ON quiz_attempts(telegram_id,submitted_at DESC);

CREATE INDEX idx_audit_workspace ON admin_audit(workspace_id,created_at DESC);

CREATE INDEX idx_calendar_owner ON personal_calendar_v1(telegram_id,starts_at);

CREATE INDEX idx_candidate_checklist_owner ON candidate_checklist_items(telegram_id,status);

CREATE INDEX idx_commitments_ws ON public_commitments(workspace_id,status);

CREATE INDEX idx_content_ws ON content_revision_requests(workspace_id,status);

CREATE INDEX idx_creative_projects_v2_owner ON creative_projects_v2(telegram_id,updated_at);

CREATE INDEX idx_decisions_owner ON personal_decisions_v2(telegram_id,created_at);

CREATE INDEX idx_design_service_orders_status ON design_service_orders_v2(status);

CREATE INDEX idx_design_service_orders_user ON design_service_orders_v2(telegram_id,created_at);

CREATE INDEX idx_docs_workspace ON workspace_documents(workspace_id,created_at DESC);

CREATE INDEX idx_event_rsvps_workspace ON event_rsvps(workspace_id,event_id);

CREATE INDEX idx_events_ws ON workspace_events(workspace_id,starts_at);

CREATE INDEX idx_expenses_ws ON workspace_expenses(workspace_id,spent_at);

CREATE INDEX idx_invites_user ON workspace_invitations(invited_telegram_id,status,expires_at);

CREATE INDEX idx_legal_sources_public ON election_legal_sources(election_type,status,topic);

CREATE INDEX idx_manual_payments_status ON manual_payment_requests_v2(status,created_at);

CREATE INDEX idx_member_user ON workspace_members(telegram_id,status);

CREATE INDEX idx_personal_ai_history_user ON personal_ai_history_v1(telegram_id,created_at DESC);

CREATE INDEX idx_personal_goals_owner ON personal_goals_v2(telegram_id,status,created_at);

CREATE INDEX idx_privacy_owner ON privacy_requests(telegram_id,created_at DESC);

CREATE INDEX idx_questions_quiz ON quiz_questions(quiz_id,position);

CREATE INDEX idx_quiz_attempt_user ON quiz_attempts(telegram_id,submitted_at DESC);

CREATE INDEX idx_readiness_user ON readiness_attempts(telegram_id,submitted_at DESC);

CREATE INDEX idx_subscription_payments_user ON subscription_payments_v2(telegram_id,created_at);

CREATE INDEX idx_support_status ON support_tickets(status,created_at DESC);

CREATE INDEX idx_support_user ON support_tickets(telegram_id,created_at DESC);

CREATE INDEX idx_tasks_ws ON workspace_tasks(workspace_id,status,due_date);

CREATE INDEX idx_user_text_versions_v1 ON user_text_versions_v1(telegram_id,field_key,created_at DESC);

CREATE INDEX idx_ws_notifications ON workspace_notifications(workspace_id,created_at DESC);
