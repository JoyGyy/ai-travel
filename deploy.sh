#!/bin/bash
set -e

echo "========== 1. 构建前端 =========="
cd /Users/joygy/Documents/react/react-travel
pnpm build

echo "========== 2. 上传 dist 到服务器 =========="
scp -r dist/* ecs:/opt/react-travel/dist/

echo "========== 3. 上传 server 到服务器 =========="
tar -czf - --exclude='node_modules' --exclude='data' --no-mac-metadata server/ | ssh ecs "cd /opt/react-travel && tar -xzf -"

echo "========== 3.5 上传 PM2 配置 =========="
scp ecosystem.config.cjs ecs:/opt/react-travel/

echo "========== 4. 重启后端 =========="
# 确保服务器有 pnpm，没有则安装
ssh ecs 'command -v pnpm >/dev/null 2>&1 || npm install -g pnpm'
ssh ecs "cd /opt/react-travel/server && pnpm install --prod && pm2 restart react-travel-server || pm2 start ../ecosystem.config.cjs"

echo ""
echo "========== 部署完成！=========="
echo "访问 https://joygytrip.cn 查看更新"
