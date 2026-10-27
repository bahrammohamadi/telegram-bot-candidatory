-- Plan/entitlement registry. Manual administration only: does not create a paid checkout.
CREATE TABLE IF NOT EXISTS service_plans(id TEXT PRIMARY KEY,name TEXT NOT NULL UNIQUE,description TEXT NOT NULL DEFAULT '',max_members INTEGER NOT NULL DEFAULT 3 CHECK(max_members BETWEEN 1 AND 1000),active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS workspace_entitlements(workspace_id TEXT PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,plan_id TEXT NOT NULL REFERENCES service_plans(id),expires_at TEXT,assigned_by INTEGER NOT NULL,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO service_plans(id,name,description,max_members,active) VALUES
('basic','آموزشی پایه','آموزش و مدیریت پایه',3,1),
('team','تیمی','مدیریت تیم‌ها',20,1),
('organization','سازمانی','فضاهای کاری بزرگ‌تر',100,1);
