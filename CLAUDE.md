# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

AI 驱动的智能旅行规划助手，基于 Next.js 16 全栈框架，集成 SiliconFlow/Qwen 与 DeepSeek 的 OpenAI 兼容接口，支持 ReAct Agent、function calling 对话和 RAG 检索增强生成。

## 常用命令

- `pnpm dev` — 启动 Next.js 开发服务器（端口 3000）
- `pnpm build` — 生产构建
- `pnpm start` — 启动生产服务器
- `pnpm lint` — ESLint 检查并自动修复
- `pnpm typecheck` — TypeScript 类型检查
- `pnpm test` — 启动 Vitest 测试（watch 模式）
- `pnpm test:run` — 运行一次测试

## 架构要点

### 技术栈
- **前端**: Next.js 16、React 19、TypeScript、Tailwind CSS v4、shadcn/ui、Zustand 5
- **后端**: Next.js Route Handlers、PostgreSQL (pg)
- **AI**: SiliconFlow/DeepSeek LLM、ReAct Agent、RAG
- **认证**: jose (JWT)、bcryptjs
- **测试**: Vitest
- **代码规范**: ESLint + Prettier、Husky + lint-staged

### 样式方案
项目采用 **Tailwind CSS** 为主：
- `src/app/` 页面 — 使用 **Tailwind CSS 工具类**
- `src/components/ui/` — shadcn/ui 组件，使用 **Tailwind CSS**
- `src/components/` 其他组件 — 部分仍使用传统 CSS 文件（BEM 风格类名）
- `src/app/globals.css` — 定义全局变量、自定义工具类和动画

### 目录结构
```
src/
├── app/              # App Router 页面 + API Routes
├── components/       # 可复用组件
│   ├── ui/           # shadcn/ui 基础组件（Tailwind）
│   └── home/         # 首页组件
├── lib/              # 服务层 + 工具函数
│   ├── services/     # 业务服务（auth、community、attractions）
│   ├── utils/        # 工具函数（http、csrf、logger、validation）
│   ├── ai/           # AI 提供商、工具和流处理
│   └── services/attractions/  # 景点匹配和服务
├── stores/           # Zustand 状态管理
├── hooks/            # 自定义 Hooks
├── api/              # 前端 API 客户端
├── db/               # 数据库 schema (SQL)
├── constants/        # 常量数据
├── knowledge/        # RAG 知识库（JSON）
├── types/            # TypeScript 类型定义
├── utils/            # 通用工具函数（storage 等）
├── styles/           # 全局样式
└── test/             # 测试配置
```

### 关键特性
- 流式 AI 响应（SSE）
- JWT 认证（jose 库，支持 Edge Runtime）
- CSRF 防护（HMAC-SHA256 + Double Submit Cookie）
- 滑动窗口限流
- RAG 检索增强生成
- 天气查询集成
- 景点收藏和社区分享

### 安全机制
- Middleware 层 JWT 有效性验证（使用 jose）
- 生产环境缺少 JWT_SECRET 时阻止启动
- 密码策略：至少 8 位，包含大小写字母和数字
- CSP 安全响应头
- httpOnly + secure Cookie

## 代码规范

- 格式化工具：Prettier（配置见 `.prettierrc`）
- Lint：ESLint（配置见 `eslint.config.mjs`），含 React、TypeScript、perfectionist 插件
- Git hooks：Husky + lint-staged，提交前自动运行 ESLint 和测试

## 环境变量

参考 `.env.example` 配置必要的 API 密钥：
- `JWT_SECRET` — JWT 签名密钥（至少 32 字符，生产环境必须）
- `DATABASE_URL` — PostgreSQL 连接串
- `SILICONFLOW_API_KEY` — SiliconFlow API 密钥
- `DEEPSEEK_API_KEY` — DeepSeek API 密钥

> ⚠️ 至少配置一个 LLM API Key，否则 AI 功能不可用。

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
