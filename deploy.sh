#!/bin/bash
set -e

echo "========== 1. 构建前端 =========="
cd /Users/joygy/Documents/react/react-travel
pnpm build

echo "========== 2. 上传 dist 到服务器 =========="
scp -r dist ecs:/opt/react-travel/

echo "========== 3. 上传 server 到服务器 =========="
scp -r server ecs:/opt/react-travel/

echo "========== 4. 重启后端 =========="
ssh ecs "cd /opt/react-travel/server && npm install --omit=dev 2>/dev/null; pm2 restart travel-server"

echo ""
echo "========== 部署完成！=========="
echo "访问 https://joygytrip.cn 查看更新"
