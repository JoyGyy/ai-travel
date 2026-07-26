# Travel AI - Next.js 全栈版

AI 驱动的智能旅行规划助手，基于 Next.js App Router 全栈架构。

## 技术栈

- **前端**: React 19 + TypeScript + Ant Design 5 + Zustand 5
- **后端**: Next.js Route Handlers + PostgreSQL
- **AI**: SiliconFlow/DeepSeek LLM + ReAct Agent + RAG
- **部署**: PM2 + Nginx

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，填入以下必填项：
# - JWT_SECRET（至少 32 字符）
# - DATABASE_URL（PostgreSQL 连接串）
# - SILICONFLOW_API_KEY 或 DEEPSEEK_API_KEY（至少一个）
```

### 3. 初始化数据库

```bash
# 创建数据库
createdb travel_db

# 导入 schema
psql -d travel_db -f src/db/schema.sql
```

### 4. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

## 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 生产构建 |
| `pnpm start` | 启动生产服务 |
| `pnpm lint` | ESLint 检查 |

## 项目结构

```
src/
├── app/                    # App Router 页面 + API Routes
├── components/             # UI 组件
├── lib/                    # 服务层 + 工具函数
├── stores/                 # Zustand 状态管理
├── hooks/                  # 自定义 Hooks
├── api/                    # 前端 API 客户端
└── types/                  # TypeScript 类型
```

## 部署

```bash
# 构建并启动
pnpm build
pm2 start ecosystem.config.cjs

# 或使用部署脚本
./deploy.sh
```

参考 `nginx.conf` 配置 Nginx 反向代理。

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `JWT_SECRET` | ✅ | JWT 签名密钥（至少 32 字符） |
| `DATABASE_URL` | ✅ | PostgreSQL 连接串 |
| `SILICONFLOW_API_KEY` | ⚠️ | SiliconFlow API Key |
| `DEEPSEEK_API_KEY` | ⚠️ | DeepSeek API Key |

> ⚠️ 至少配置一个 LLM API Key，否则 AI 功能将降级为 Mock 模式。
