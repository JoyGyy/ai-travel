# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

AI 驱动的智能旅行规划助手，基于 Next.js 16 全栈框架，集成 SiliconFlow/Qwen 与 DeepSeek 的 OpenAI 兼容接口，支持 ReAct Agent、function calling 对话和 RAG 检索增强生成。

## 常用命令

- `pnpm dev` — 启动 Next.js 开发服务器（端口 3000）
- `pnpm build` — 生产构建
- `pnpm start` — 启动生产服务器
- `pnpm lint` — ESLint 检查

## 架构要点

### 技术栈
- Next.js 16、React 19、TypeScript、Tailwind CSS v4、shadcn/ui
- Zustand 5 状态管理、jose JWT 认证
- App Router（`src/app/` 目录结构）
- API Routes 处理后端逻辑

### 目录结构
- `src/app/` — 页面和 API 路由
- `src/components/` — 可复用组件（含 `ui/` 基础组件和 `home/` 首页组件）
- `src/stores/` — Zustand 状态管理
- `src/api/` — API 客户端
- `src/types/` — TypeScript 类型定义
- `src/lib/` — 工具库和服务（认证、限流、CSRF、AI 提供商等）
- `src/hooks/` — 自定义 Hooks
- `src/constants/` — 常量数据
- `src/db/` — Drizzle ORM schema 和数据库配置
- `data/` — 数据文件（用户数据库、分享数据等）

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

## 环境变量

参考 `.env.example` 配置必要的 API 密钥：
- `JWT_SECRET` — JWT 签名密钥（至少 32 字符，生产环境必须）
- `DATABASE_URL` — PostgreSQL 连接串
- `SILICONFLOW_API_KEY` — SiliconFlow API 密钥
- `DEEPSEEK_API_KEY` — DeepSeek API 密钥

> ⚠️ 至少配置一个 LLM API Key，否则 AI 功能不可用。
