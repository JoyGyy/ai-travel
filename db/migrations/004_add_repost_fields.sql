-- 004_add_repost_fields.sql
-- 为 community_posts 补充 post_type 和 original_post_id 字段及约束
-- 确保从旧版数据库平滑迁移

BEGIN;

ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS post_type TEXT NOT NULL DEFAULT 'original';
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS original_post_id TEXT REFERENCES community_posts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_community_posts_original ON community_posts(original_post_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'community_post_repost_target'
  ) THEN
    ALTER TABLE community_posts ADD CONSTRAINT community_post_repost_target CHECK (
      (post_type = 'original' AND original_post_id IS NULL)
      OR (post_type = 'repost' AND original_post_id IS NOT NULL)
    );
  END IF;
END $$;

INSERT INTO _migrations (name) VALUES ('004_add_repost_fields.sql') ON CONFLICT DO NOTHING;

COMMIT;

