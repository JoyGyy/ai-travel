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
- Next.js 16、React 19、TypeScript、Ant Design 5、Zustand 5
- App Router（`src/app/` 目录结构）
- API Routes 处理后端逻辑

### 目录结构
- `src/app/` — 页面和 API 路由
- `src/components/` — 可复用组件
- `src/stores/` — Zustand 状态管理
- `src/api/` — API 客户端
- `src/types/` — TypeScript 类型定义
- `src/lib/` — 工具库和服务
- `data/` — 数据文件（用户数据库、分享数据等）

### 关键特性
- 流式 AI 响应（SSE）
- JWT 认证
- RAG 检索增强生成
- 天气查询集成
- 景点收藏和社区分享

## 环境变量

参考 `.env.example` 配置必要的 API 密钥：
- `SILICONFLOW_API_KEY` — SiliconFlow API 密钥
- `DEEPSEEK_API_KEY` — DeepSeek API 密钥
- `JWT_SECRET` — JWT 签名密钥
