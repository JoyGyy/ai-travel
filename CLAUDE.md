# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

AI 驱动的智能旅行规划助手，前后端分离架构。前端 React 19 + TypeScript SPA，后端 Node.js + Express（ES Modules），集成 LLM（SiliconFlow/Qwen + DeepSeek）实现 ReAct Agent 和 RAG 检索增强生成。

## 常用命令

### 前端（根目录）
- `pnpm dev` — 启动 Vite 开发服务器（端口 5181，/api 代理到 3030）
- `pnpm build` — TypeScript 类型检查 + Vite 生产构建
- `pnpm lint` — ESLint 检查
- `pnpm test` — Vitest 单次运行
- `pnpm test:watch` — Vitest 监听模式
- `pnpm test:coverage` — 测试覆盖率（v8）

### 后端（server/ 目录）
- `pnpm dev` — 启动 Express 服务器（端口 3030）

开发时需同时运行前后端。后端会从父目录读取 `.env` 文件。

## 架构要点

### 前后端双包结构
根目录为前端（pnpm），`server/` 为独立后端（独立 package.json 和 node_modules）。非 monorepo，无 workspace 配置。

### 前端架构
- **路由**：`src/router/index.tsx`，`createBrowserRouter` + `React.lazy` 懒加载所有页面
- **状态管理**：四个 Zustand store — `auth`（JWT 持久化）、`itinerary`（行程数据）、`chat`（聊天消息）、`history`（用户历史，localStorage 按用户 ID 隔离）
- **SSE 流式**：`src/hooks/useSSE.ts` 处理服务端推送事件，UTF-8 安全分块解码
- **路径别名**：`@/*` 映射到 `src/*`

### 后端架构
- **Agent 系统**：`server/services/agent.js` 实现 ReAct 模式，6 步工具链（解析意图→搜索景点→查询天气→规划行程→计算预算→生成贴士），通过 SSE 流式推送
- **Chat Agent**：`server/routes/chat.js` 使用 LLM function calling 实现多工具对话，滑动窗口维护上下文
- **RAG 检索**：`server/services/rag.js` 组合关键词匹配 + TF-IDF（`server/services/tfidf.js`），数据源为 `server/knowledge/attractions.json`
- **LLM 客户端**：`server/services/llm.js` 支持 SiliconFlow（主）和 DeepSeek（备），OpenAI 兼容 API 格式，含 function calling
- **Mock 模式**：未配置 API key 时自动降级为确定性模拟响应
- **认证**：bcrypt 密码哈希 + JWT，SQLite（better-sqlite3）存储用户

### 分享功能
- **分享卡片**：`src/components/ShareCard` 生成 750×1334 PNG（html-to-image）
- **分享弹窗**：`src/components/SharePopup` 提供保存图片和复制链接
- **分享落地页**：`src/pages/Share` 展示公开行程（`/share/:id`，无需认证）
- **后端存储**：`server/services/share.js` 用 JSON 文件存储，nanoid 生成短 ID，SHA-256 幂等检查
- **OG 标签限制**：SPA 动态注入的 OG meta 标签对社交爬虫无效（微信/小红书等不会执行 JS），需 SSR 或预渲染才能解决

### 关键配置
- Vite 开发服务器端口 5181，后端 3030，`/api` 代理连接两者
- TypeScript 严格模式（`noUnusedLocals`、`noUnusedParameters`、`noFallthroughCasesInSwitch`、`verbatimModuleSyntax`）
- Vitest 使用 jsdom 环境，测试文件可放在 `src/` 和 `server/` 两个目录
