-- 添加邮箱验证码表
-- 用于存储注册、重置密码等场景的邮件验证码
CREATE TABLE IF NOT EXISTS email_verification_codes (
  id          SERIAL PRIMARY KEY,
  email       VARCHAR(255) NOT NULL,
  code        VARCHAR(16) NOT NULL,
  type        VARCHAR(32) NOT NULL DEFAULT 'register',
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_verification_email_type ON email_verification_codes (email, type);
CREATE INDEX IF NOT EXISTS idx_email_verification_expires_at ON email_verification_codes (expires_at);
