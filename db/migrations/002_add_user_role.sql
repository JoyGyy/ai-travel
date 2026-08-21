-- 给 users 表添加 role 字段，支持管理员角色
-- 执行时间: 2026-08-21

BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(16) NOT NULL DEFAULT 'user';
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

INSERT INTO _migrations (name) VALUES ('002_add_user_role.sql') ON CONFLICT DO NOTHING;

COMMIT;
