#!/bin/bash
# Travel AI 部署脚本（在本地开发机执行）
#
# 策略：本地构建 → 上传源码 + 构建产物 → 服务器装依赖 → 数据库迁移 → 重启
# 原因：生产服务器内存仅 1.8G，Next.js Turbopack 构建会触发 OOM，
#       因此构建放到本地（内存充足）完成，服务器只跑轻量的 next start。
#
# 用法：
#   ./deploy.sh                    # 使用默认 SSH 别名 ecs
#   DEPLOY_HOST=myhost ./deploy.sh # 指定 SSH 主机别名
#
# 部署时会保留的服务器数据（不会覆盖/删除）：
#   .env / .env.local                生产密钥
#   public/uploads/                  社区上传图片
#   data/shared_itineraries.json     行程分享记录（运行时数据）
#   logs/                            运行日志
#
# 可选环境变量：
#   DEPLOY_HOST           SSH 主机别名（默认 ecs）
#   DEPLOY_REMOTE_DIR     服务器项目目录（默认 /opt/react-travel-next）
#   DEPLOY_APP_NAME       PM2 应用名（默认 react-travel-next）
#   DEPLOY_REGISTRY       pnpm 源（默认国内镜像 npmmirror）
set -euo pipefail

HOST="${DEPLOY_HOST:-ecs}"
REMOTE_DIR="${DEPLOY_REMOTE_DIR:-/opt/react-travel-next}"
APP_NAME="${DEPLOY_APP_NAME:-react-travel-next}"
REGISTRY="${DEPLOY_REGISTRY:-https://registry.npmmirror.com}"

echo "🚀 开始部署 Travel AI → ${HOST}:${REMOTE_DIR}"
echo ""

# 1. 本地生产构建
echo "📦 [1/5] 本地生产构建..."
pnpm build

# 2. 上传源码 + 构建产物
#    先清理服务器上的纯代码目录（src/db），避免残留已删除的过期文件（如旧组件）。
#    注意：不清空 public/，以保留 public/uploads 下的用户上传图片。
echo "⬆️ [2/5] 上传源码与构建产物..."
tar czf - \
  --no-xattrs --no-acls \
  --exclude='node_modules' \
  --exclude='.next/dev' \
  --exclude='.next/cache' \
  --exclude='.git' \
  --exclude='.env' \
  --exclude='.env.local' \
  --exclude='logs' \
  --exclude='public/uploads' \
  --exclude='data/shared_itineraries.json' \
  --exclude='.DS_Store' \
  --exclude='._*' \
  --exclude='.claude' \
  --exclude='.mimocode' \
  --exclude='.playwright-mcp' \
  --exclude='.vscode' \
  --exclude='tsconfig.tsbuildinfo' \
  . | ssh "$HOST" "cd $REMOTE_DIR && rm -rf src db && tar xzf -"

# 3. 服务器安装生产依赖
#    服务器仅 1.8G 内存：构建已在本地完成，只需跑 next start，因此只装 --prod
#    生产依赖（省掉 eslint/typescript/vitest 等 900+ 包），并限制 pnpm 的 Node 堆
#    与网络并发，避免 pnpm install 在 1.8G 小内存机上 OOM。
echo "📦 [3/5] 服务器安装生产依赖..."
ssh "$HOST" "cd $REMOTE_DIR && NODE_OPTIONS='--max-old-space-size=768' pnpm install --prod --frozen-lockfile --registry=$REGISTRY --network-concurrency=4"

# 3.5 数据库迁移
#    只应用未执行的 db/migrations/*.sql（幂等），避免「代码用了新列但库没迁移」导致的 500。
#    使用 psql（scripts/db-migrate.sh），不依赖被 --prod 剪掉的 tsx。
echo "🗄️ [4/5] 应用数据库迁移..."
ssh "$HOST" "cd $REMOTE_DIR && bash scripts/db-migrate.sh"

# 4. 重启服务（首次部署时自动用 ecosystem.config.cjs 注册应用）
echo "🚀 [5/5] 重启服务..."
ssh "$HOST" "cd $REMOTE_DIR && (pm2 restart $APP_NAME || pm2 start ecosystem.config.cjs)"

# 5. 健康检查
echo "🏥 健康检查..."
sleep 4
ssh "$HOST" "curl -fsS http://localhost:3000/api/health && echo ' ✅' || echo '⚠️ 健康检查失败'"

echo ""
echo "✅ 部署完成！访问 https://joygytrip.cn"
