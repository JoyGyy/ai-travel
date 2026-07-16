# React Travel

AI 驱动的智能旅行规划助手，采用前后端分离架构。前端提供城市选择、天气、AI 咨询和行程详情展示；后端提供认证、天气、行程推荐、聊天 Agent、RAG 检索和分享接口。

## 技术栈

### 前端
- React 19 + JavaScript/JSX
- Vite 8
- React Router 7
- Ant Design 5
- Zustand 5
- 普通 CSS + BEM/语义类名

### 后端
- Node.js + Express（ES Modules）
- SQLite（better-sqlite3）
- bcryptjs + JWT
- SiliconFlow/Qwen 主用，DeepSeek 备用
- JSON 知识库 + 关键词/TF-IDF RAG
- SSE 流式响应

## 项目结构

```text
.
├── src/                 # 前端源码
│   ├── components/      # 组件
│   ├── hooks/           # useSSE、useWeather 等 Hook
│   ├── pages/           # Home、Detail、Weather、Chat、Login
│   ├── router/          # React Router 配置
│   └── stores/          # Zustand 状态
├── server/              # Express 后端包
│   ├── knowledge/       # RAG 知识库
│   ├── routes/          # API 路由
│   ├── services/        # Agent、LLM、RAG、认证等服务
│   └── data/            # SQLite 与分享数据
├── deploy/              # 部署配置示例
├── docs/                # 项目规范与部署文档
├── vite.config.js       # Vite 配置，端口 5181，/api 代理到 3030
└── .env.example         # 后端环境变量示例
```

> 当前不是根级 pnpm workspace。前端和后端需要分别安装依赖。

## 环境变量

复制示例文件：

```bash
cp .env.example .env
```

至少需要配置：

```env
JWT_SECRET=replace-with-a-random-secret-at-least-32-chars
```

LLM API Key 可留空。未配置 `SILICONFLOW_API_KEY` 和 `DEEPSEEK_API_KEY` 时，后端会自动进入 Mock/知识库降级模式，仍可用于本地开发和演示。

## 安装依赖

前端：

```bash
pnpm install
```

后端：

```bash
cd server
pnpm install
```

## 本地开发

需要同时启动后端和前端。

后端（端口 3030）：

```bash
cd server
pnpm dev
```

前端（端口 5181）：

```bash
pnpm dev
```

访问：

```text
http://localhost:5181
```

前端通过 Vite proxy 将 `/api` 代理到 `http://localhost:3030`。

## 常用命令

### 前端（仓库根目录）

```bash
pnpm dev        # 启动 Vite 开发服务器
pnpm build      # 生产构建
pnpm lint       # ESLint 检查前端源码和 Vite 配置
pnpm typecheck  # TS 配置与路径解析基线检查
pnpm check      # 依次执行 lint、typecheck、build
pnpm preview    # 预览构建产物
```

### 后端（server/ 目录）

```bash
pnpm dev    # 启动 Express 服务
pnpm start  # 启动 Express 服务
pnpm check  # Node 语法检查
```

## API 与 Mock 模式

核心接口：

- `GET /api/health` — 健康检查
- `POST /api/auth/register` — 注册
- `POST /api/auth/login` — 登录
- `GET /api/weather?city=北京` — 天气查询
- `POST /api/travel/recommend` — SSE 行程推荐
- `POST /api/travel/chat` — SSE AI 对话

AI 相关接口会优先调用配置的 LLM 供应商；未配置 Key 或模型不可用时，会降级到确定性 Mock/知识库结果，便于离线开发和稳定演示。

## 数据说明

- 用户数据存储在 `server/data/users.db`，该文件被 git 忽略。
- 分享数据存储在 `server/data/shared_itineraries.json`。
- 景点知识库位于 `server/knowledge/attractions.json`。

## 部署

推荐个人项目首版使用阿里云 ECS 裸机部署：

- Nginx 托管 `dist/` 静态资源
- `/api` 反向代理到本机 `3030` 端口
- PM2 守护 Express 后端

详细步骤见：[阿里云 ECS 部署说明](docs/deployment/aliyun-ecs.md)。

## 当前测试状态

项目目前配置了最小 E2E 验证，覆盖首页、注册、天气查询和 AI 咨询核心路径。

```bash
pnpm e2e
```

日常基础验证仍以 `pnpm check` 和后端 `pnpm check` 为主。

## 性能基线

当前包体积观察见：[包体积观察基线](docs/performance/bundle-baseline.md)。
