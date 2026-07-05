# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

AI 驱动的智能旅行规划助手，前后端分离架构。前端 React 19 + JavaScript SPA，后端 Node.js + Express（ES Modules），集成 LLM（SiliconFlow/Qwen + DeepSeek）实现 ReAct Agent 和 RAG 检索增强生成。

## 常用命令

### 前端（根目录）
- `pnpm dev` — 启动 Vite 开发服务器（端口 5181，/api 代理到 3030）
- `pnpm build` — Vite 生产构建
- `pnpm lint` — ESLint 检查

### 后端（server/ 目录）
- `pnpm dev` — 启动 Express 服务器（端口 3030）

开发时需同时运行前后端。后端会从父目录读取 `.env` 文件。

## 架构要点

### 前后端双包结构
根目录为前端（pnpm），`server/` 为独立后端（独立 package.json 和 node_modules）。非 monorepo，无 workspace 配置。

### 前端架构
- **技术栈**：React 19 + JavaScript/JSX + Ant Design 5 + Zustand 5 + Vite 8
- **CSS 方案**：普通 CSS 文件 + BEM 命名，每个组件/页面一个 style.css
- **路由**：`src/router/index.jsx`，`createBrowserRouter` + `React.lazy` 懒加载所有页面
- **状态管理**：三个 Zustand store — `auth`（JWT 持久化）、`itinerary`（行程数据）、`chat`（聊天消息）
- **SSE 流式**：`src/hooks/useSSE.js` 处理服务端推送事件，UTF-8 安全分块解码
- **API 模块**：`src/api/index.js` 统一管理后端接口调用
- **路径别名**：`@/*` 映射到 `src/*`
- **纯桌面端**：不做移动端适配，主内容区 max-width 1200px 居中

### 页面列表
- Home（首页）、Detail（详情页）、Weather（天气）、Chat（AI 咨询）、Login（登录页）

### 后端架构
- **Agent 系统**：`server/services/agent.js` 实现 ReAct 模式，6 步工具链（解析意图→搜索景点→查询天气→规划行程→计算预算→生成贴士），通过 SSE 流式推送
- **Chat Agent**：`server/routes/chat.js` 使用 LLM function calling 实现多工具对话，滑动窗口维护上下文
- **RAG 检索**：`server/services/rag.js` 组合关键词匹配 + TF-IDF（`server/services/tfidf.js`），数据源为 `server/knowledge/attractions.json`
- **LLM 客户端**：`server/services/llm.js` 支持 SiliconFlow（主）和 DeepSeek（备），OpenAI 兼容 API 格式，含 function calling
- **Mock 模式**：未配置 API key 时自动降级为确定性模拟响应
- **认证**：bcrypt 密码哈希 + JWT，SQLite（better-sqlite3）存储用户

### 关键配置
- Vite 开发服务器端口 5181，后端 3030，`/api` 代理连接两者
