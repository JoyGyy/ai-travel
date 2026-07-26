#!/bin/bash
# Next.js 项目部署脚本
# 用法: ./deploy.sh

set -e

echo "🚀 开始部署 Travel AI (Next.js)..."

# 1. 安装依赖
echo "📦 安装依赖..."
pnpm install --frozen-lockfile

# 2. 构建项目
echo "🔨 构建项目..."
pnpm build

# 3. 重启 PM2 服务
echo "🔄 重启服务..."
pm2 restart ecosystem.config.cjs || pm2 start ecosystem.config.cjs

# 4. 检查服务状态
echo "✅ 检查服务状态..."
pm2 status

# 5. 等待服务就绪
echo "⏳ 等待服务就绪..."
sleep 3

# 6. 健康检查
echo "🏥 健康检查..."
curl -s http://localhost:3000/api/health || echo "⚠️ 健康检查失败"

echo ""
echo "✅ 部署完成！"
echo "   访问: http://localhost:3000"
echo "   日志: pm2 logs react-travel-next"
