-- 为 users 表添加邮箱唯一索引与大小写不敏感索引
-- 确保用户邮箱全局唯一，并加速用户名/邮箱双模式登录检索
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email));
