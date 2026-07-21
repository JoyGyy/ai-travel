-- 景点数据库 Schema
-- 使用 pg_trgm 扩展支持模糊搜索
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- pgvector 扩展支持向量搜索
CREATE EXTENSION IF NOT EXISTS vector;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id          VARCHAR(64) PRIMARY KEY,
  username    VARCHAR(64) UNIQUE NOT NULL,
  password    VARCHAR(128) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI 使用额度表
CREATE TABLE IF NOT EXISTS ai_usage (
  user_id     VARCHAR(64) NOT NULL REFERENCES users(id),
  usage_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  used_count  INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, usage_date)
);

-- 用户收藏景点表
CREATE TABLE IF NOT EXISTS user_favorite_attractions (
  user_id       VARCHAR(64) NOT NULL REFERENCES users(id),
  attraction_id VARCHAR(64) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, attraction_id)
);

-- 景点主表
CREATE TABLE IF NOT EXISTS attractions (
  id                   TEXT PRIMARY KEY,
  name                 TEXT NOT NULL,
  city                 TEXT NOT NULL,
  ticket_type          TEXT NOT NULL DEFAULT 'free',
  price_text           TEXT NOT NULL DEFAULT '',
  cover_image          TEXT NOT NULL DEFAULT '',
  summary              TEXT NOT NULL DEFAULT '',
  description          TEXT NOT NULL DEFAULT '',
  address              TEXT NOT NULL DEFAULT '',
  opening_hours        TEXT NOT NULL DEFAULT '',
  recommended_duration TEXT NOT NULL DEFAULT '',
  aliases              TEXT[] DEFAULT '{}',
  highlights           TEXT[] DEFAULT '{}',
  tips                 TEXT[] DEFAULT '{}',
  suitable_for         TEXT[] DEFAULT '{}',
  booking_links        JSONB DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
  id   SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- 景点-标签关联表
CREATE TABLE IF NOT EXISTS attraction_tags (
  attraction_id TEXT    NOT NULL REFERENCES attractions(id) ON DELETE CASCADE,
  tag_id        INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (attraction_id, tag_id)
);

-- RAG 知识库表（替代 attractions.json）
CREATE TABLE IF NOT EXISTS attraction_knowledge (
  id            SERIAL PRIMARY KEY,
  city          TEXT NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  ticket        NUMERIC NOT NULL DEFAULT 0,
  duration      TEXT NOT NULL DEFAULT '',
  tips          TEXT NOT NULL DEFAULT '',
  indoor        BOOLEAN NOT NULL DEFAULT false,
  tags          TEXT[] DEFAULT '{}',
  food          TEXT[] DEFAULT '{}',
  transport     TEXT NOT NULL DEFAULT '',
  best_season   TEXT NOT NULL DEFAULT '',
  accommodation JSONB DEFAULT '[]',
  nightlife     JSONB DEFAULT '[]',
  embedding     vector(1024),
  UNIQUE(city, name)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_attractions_city      ON attractions(city);
CREATE INDEX IF NOT EXISTS idx_attractions_name_trgm ON attractions USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_knowledge_city        ON attraction_knowledge(city);
CREATE INDEX IF NOT EXISTS idx_attraction_tags_tag   ON attraction_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding   ON attraction_knowledge USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);
