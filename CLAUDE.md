# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

AI 驱动的智能旅行规划助手，前后端分离架构。前端是 React 19 + JavaScript/JSX SPA，后端是 Node.js + Express（ES Modules），集成 SiliconFlow/Qwen 与 DeepSeek 的 OpenAI 兼容接口，支持 ReAct Agent、function calling 对话和 RAG 检索增强生成。

## 常用命令

### 前端（仓库根目录）
- `pnpm dev` — 启动 Vite 开发服务器（端口 5181，`/api` 代理到 3030）
- `pnpm build` — 生产构建
- `pnpm lint` — ESLint 检查
- `pnpm preview` — 预览构建产物

### 后端（`server/` 目录）
- `pnpm dev` — 启动 Express 服务（端口 3030）
- `pnpm start` — 同样执行 `node index.js`

开发时通常需要同时运行前端和后端。后端通过 `dotenv` 从仓库根目录读取 `.env`。当前项目没有配置测试脚本。

## 架构要点

### 包结构
- 仓库根目录是前端包，`server/` 是后端包；两边各自有 `package.json`、`pnpm-lock.yaml` 和 `node_modules`。
- 不是根级 pnpm workspace；`server/pnpm-workspace.yaml` 仅用于允许 `better-sqlite3` 构建。

### 前端
- 技术栈：React 19、React Router 7、Ant Design 5、Zustand 5、Vite 8，源码仍是 JavaScript/JSX。
- 路由在 `src/router/index.jsx`，使用 `createBrowserRouter`，页面通过 `React.lazy` 懒加载；`Detail` 和 `Chat` 受 `ProtectedRoute` 保护。
- `src/App.jsx` 通过 Ant Design `ConfigProvider` 配置全局主题。
- 状态分三类 Zustand store：`auth`（JWT 持久化到 `travel_auth`）、`itinerary`、`chat`。
- 流式 AI 响应由 `src/hooks/useSSE.js` 基于 `fetch` + `ReadableStream` 解析自定义 SSE JSON 行，事件类型包括 `chunk`、`step`、`notice`、`complete`。
- 天气查询使用 `src/hooks/useWeather.js`，认证接口直接在 `src/stores/auth.js` 中调用。
- 组件按 `src/components/<Component>/index.jsx` + `style.css` 组织；样式是普通 CSS，现有文件偏 BEM/语义类名。
- 路径别名：`@/*` 指向 `src/*`。

### 后端
- 入口：`server/index.js`。挂载路由：`/api/travel/recommend`、`/api/travel/chat`、`/api/weather`、`/api/auth/*`、分享相关接口和 `/api/health`。
- 限流在 `server/middleware/rateLimit.js`：AI 接口每分钟 15 次，认证接口每分钟 10 次。
- 行程推荐：`server/routes/travel.js` 调用 `server/services/agent.js`，按解析意图、搜索景点、查询天气、规划行程、计算预算、生成贴士的流程向前端推送 step 和 chunk。
- 聊天 Agent：`server/routes/chat.js` 使用 `callLLMWithTools` 和工具定义进行最多 5 轮 function calling；历史消息采用滑动窗口，旧消息提取城市摘要。
- RAG：`server/services/rag.js` 结合关键词匹配和 `server/services/tfidf.js`，数据源是 `server/knowledge/attractions.json`。
- LLM 客户端：`server/services/llm.js` 优先 SiliconFlow（`SILICONFLOW_API_KEY`），其次 DeepSeek（`DEEPSEEK_API_KEY`）；未配置 key 时返回空并触发确定性 Mock/知识库降级。
- 认证：`server/services/auth.js` 使用 bcryptjs + JWT + better-sqlite3，数据位于 `server/data/users.db`。
- 分享数据存放在 `server/data/shared_itineraries.json`。

## 关键配置与约定

- Vite 端口固定为 5181，后端默认 3030，前端通过 Vite proxy 访问 `/api`。
- CORS 允许 `http://localhost:5181` 和 `http://localhost:3000`。
- ESLint 只检查 `**/*.{js,jsx}`，忽略 `dist`；`src/router/**` 关闭 `react-refresh/only-export-components`。
- README 仍是 Vite 模板内容，不代表当前项目真实架构。
- 仓库中有 `AGENTS.md`，内容与本文件类似但面向 Codex；维护架构说明时注意两者可能需要同步。
