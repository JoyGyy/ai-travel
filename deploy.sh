#!/bin/bash
# Travel AI 部署脚本（在本地开发机执行）
#
# 策略：本地构建 → 上传源码 + 构建产物 → 服务器装依赖 + 重启
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
echo "📦 [1/4] 本地生产构建..."
pnpm build

# 2. 上传源码 + 构建产物
#    先清理服务器上的纯代码目录（src/db），避免残留已删除的过期文件（如旧组件）。
#    注意：不清空 public/，以保留 public/uploads 下的用户上传图片。
echo "⬆️ [2/4] 上传源码与构建产物..."
tar czf - \
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

# 3. 服务器安装依赖 + 重启（首次部署时自动用 ecosystem.config.cjs 注册应用）
echo "📦 [3/4] 服务器安装依赖并重启服务..."
ssh "$HOST" "cd $REMOTE_DIR && pnpm install --frozen-lockfile --registry=$REGISTRY && (pm2 restart $APP_NAME || pm2 start ecosystem.config.cjs)"

# 4. 健康检查
echo "🏥 [4/4] 健康检查..."
sleep 4
ssh "$HOST" "curl -fsS http://localhost:3000/api/health && echo ' ✅' || echo '⚠️ 健康检查失败'"

echo ""
echo "✅ 部署完成！访问 https://joygytrip.cn"
