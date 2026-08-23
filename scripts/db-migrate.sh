#!/bin/bash
# 应用数据库迁移
#
# 依赖 psql，不依赖 tsx / devDependencies（服务器用 pnpm install --prod 时会剪掉它们）。
# 在 deploy.sh 中由服务器执行：bash scripts/db-migrate.sh
#
# 用法:
#   DATABASE_URL=... bash scripts/db-migrate.sh   # 显式指定连接串
#   bash scripts/db-migrate.sh                    # 从 .env 读取 DATABASE_URL
#
# 逻辑：确保 _migrations 表存在，按文件名顺序逐个执行未应用的 db/migrations/*.sql，
# 并在每个迁移执行成功后登记到 _migrations（幂等）。
set -euo pipefail

cd "$(dirname "$0")/.."

# ---- 读取 DATABASE_URL（优先环境变量，其次 .env）----
DATABASE_URL="${DATABASE_URL:-}"
if [ -z "$DATABASE_URL" ] && [ -f .env ]; then
  DATABASE_URL=$(grep -E '^DATABASE_URL=' .env | tail -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
fi
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL 未设置（未提供环境变量，且 .env 中不存在）" >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "❌ 未找到 psql，请先安装 PostgreSQL 客户端" >&2
  exit 1
fi

# ---- 确保迁移记录表存在 ----
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -tAc \
  "CREATE TABLE IF NOT EXISTS _migrations (id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW());"

# ---- 逐个应用未执行的迁移 ----
applied=0
for f in db/migrations/*.sql; do
  name=$(basename "$f")
  done_flag=$(psql "$DATABASE_URL" -tAc "SELECT 1 FROM _migrations WHERE name='$name'" | tr -d '[:space:]')
  if [ -n "$done_flag" ]; then
    echo "⏭️  跳过（已应用）: $name"
    continue
  fi

  echo "▶ 应用迁移: $name"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f" || { echo "❌ 迁移失败: $name" >&2; exit 1; }
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -tAc \
    "INSERT INTO _migrations (name) VALUES ('$name') ON CONFLICT DO NOTHING;" >/dev/null
  applied=$((applied + 1))
done

if [ "$applied" -eq 0 ]; then
  echo "✅ 没有待执行的迁移"
else
  echo "🎉 已应用 $applied 个迁移"
fi
