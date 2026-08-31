BEGIN;

ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE community_post_comments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_community_posts_deleted_at ON community_posts(deleted_at);
CREATE INDEX IF NOT EXISTS idx_community_post_comments_deleted_at ON community_post_comments(deleted_at);

INSERT INTO _migrations (name) VALUES ('003_add_deleted_at.sql') ON CONFLICT DO NOTHING;

COMMIT;

