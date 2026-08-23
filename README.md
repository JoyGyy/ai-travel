# Travel AI - Next.js 全栈版

AI 驱动的智能旅行规划助手，基于 Next.js App Router 全栈架构。

## 技术栈

- **前端**: React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui + Zustand 5
- **后端**: Next.js Route Handlers + PostgreSQL (`pg` 连接池 + SQL migrations)
- **AI**: SiliconFlow LLM + ReAct Agent + RAG
- **认证**: jose (JWT) + bcryptjs
- **测试**: Vitest
- **代码规范**: ESLint + Prettier + Husky + lint-staged
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
# - SILICONFLOW_API_KEY
```

### 3. 初始化数据库

```bash
# 创建数据库
createdb travel_db

# 执行 SQL migrations
pnpm db:migrate
```

### 4. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

## 常用命令

| 命令              | 说明                      |
| ----------------- | ------------------------- |
| `pnpm dev`        | 启动开发服务器            |
| `pnpm build`      | 生产构建                  |
| `pnpm start`      | 启动生产服务              |
| `pnpm lint`       | ESLint 检查并自动修复     |
| `pnpm typecheck`  | TypeScript 类型检查       |
| `pnpm test`       | Vitest 测试（watch 模式） |
| `pnpm test:run`   | 运行一次测试              |
| `pnpm db:migrate` | 执行数据库迁移            |
| `pnpm rag:evaluate` | 运行 RAG 离线检索评测（需数据库） |

## 项目结构

```
src/
├── app/                    # App Router 页面 + API Routes
│   ├── api/                # API 路由（auth、travel、community、weather）
│   └── (pages)/            # 页面路由
├── components/             # UI 组件
│   ├── ui/                 # shadcn/ui 基础组件（Tailwind）
│   └── home/               # 首页组件
├── lib/                    # 服务层 + 工具函数
│   ├── services/           # 业务服务（auth、community、attractions、embedding）
│   ├── utils/              # 工具函数（http、csrf、logger、validation）
│   └── ai/                 # AI 提供商、工具和流处理
├── stores/                 # Zustand 状态管理
├── hooks/                  # 自定义 Hooks
├── api/                    # 前端 API 客户端
├── db/                     # SQL migrations + 数据库迁移脚本
├── constants/              # 常量数据
├── knowledge/              # RAG 知识库（JSON）
├── types/                  # TypeScript 类型定义
├── utils/                  # 通用工具函数（storage 等）
├── styles/                 # 全局样式
└── test/                   # 测试配置
```

## 样式方案

项目采用混合样式策略：

- **shadcn/ui 组件**（`src/components/ui/`）：使用 Tailwind CSS 工具类
- **业务组件和页面**：使用传统 CSS 文件，配合 BEM 风格类名
- **设计变量**：通过 Tailwind 配置 + CSS 自定义属性统一管理颜色、圆角等

## 安全特性

- **JWT 认证**: 使用 jose 库，支持 Edge Runtime，Middleware 层验证 token 有效性
- **CSRF 防护**: HMAC-SHA256 签名 + Double Submit Cookie 模式
- **限流**: 滑动窗口算法，按用户/IP 限制请求频率
- **密码策略**: 至少 8 位，包含大小写字母和数字
- **安全头**: CSP、X-Frame-Options、X-Content-Type-Options
- **环境校验**: 生产环境缺少关键变量时阻止启动
- **模型凭据隔离**: 模型 API Key 只保存在服务端环境变量中，不接受浏览器传入的第三方密钥或 URL

## AI 可观测性与评测

- 每次 AI 请求都会记录关联 ID、操作类型、耗时、token 用量、结束原因和调用过的工具名；日志不包含用户输入或密钥。
- 工具调用获得的景点数据会作为“参考来源”展示在对话回答下方，便于用户追溯回答依据。
- `pnpm rag:evaluate` 运行 12 条固定旅行查询，输出 `Hit@1`、`Hit@3` 和 `MRR`。更新知识库、Embedding 模型或排序权重后，应对比指标并人工检查低分用例。

## 部署

> ⚠️ 生产服务器内存仅 1.8G，**不要在服务器上执行 `pnpm build`**（会触发 OOM 导致构建产物损坏）。构建在本地完成，部署脚本只上传产物。

在**本地开发机**执行部署脚本：

```bash
./deploy.sh                 # 使用默认 SSH 别名 ecs
DEPLOY_HOST=myhost ./deploy.sh  # 指定 SSH 主机别名
```

脚本流程：本地 `pnpm build` → 上传源码 + `.next` 产物 → 服务器安装依赖（国内镜像）→ 重启 PM2 → 健康检查。

部署时自动保留服务器上的运行数据：`.env`（密钥）、`public/uploads/`（社区图片）、`data/shared_itineraries.json`（分享记录）、`logs/`。

参考 `nginx.conf` 配置 Nginx 反向代理。

## 环境变量

| 变量                  | 必填 | 说明                         |
| --------------------- | ---- | ---------------------------- |
| `JWT_SECRET`          | ✅   | JWT 签名密钥（至少 32 字符） |
| `DATABASE_URL`        | ✅   | PostgreSQL 连接串            |
| `SILICONFLOW_API_KEY` | ⚠️   | SiliconFlow API Key          |

> ⚠️ 必须配置 SILICONFLOW_API_KEY，否则 AI 功能不可用。
