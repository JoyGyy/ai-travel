-- 005_add_chat_sessions.sql
-- 创建 AI 咨询手账会话表，支持多用户隔离、JSONB 消息存储与软删除

BEGIN;

CREATE TABLE IF NOT EXISTS chat_sessions (
  id TEXT PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '新的手账对话',
  city TEXT,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_deleted_at ON chat_sessions(deleted_at);

INSERT INTO _migrations (name) VALUES ('005_add_chat_sessions.sql') ON CONFLICT DO NOTHING;

COMMIT;

