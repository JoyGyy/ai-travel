# TravelAI 项目说明书

> 写给你自己的项目全景图，帮助你快速理解整个项目的结构、数据流和关键设计。

---

## 一、这个项目是什么

一个 **AI 驱动的智能旅行规划助手**。用户输入目的地、天数、预算，AI 自动生成包含景点、餐饮、住宿的完整行程。

**核心功能：**

| 功能 | 说明 |
|------|------|
| 🗺️ AI 行程规划 | 输入城市+天数+预算，AI 推荐景点、生成每日行程、计算预算 |
| 💬 AI 对话咨询 | 类似 ChatGPT 的对话界面，支持 function calling 调用景点/天气/城市对比等工具 |
| 🏛️ 景点浏览 | 按城市/标签/价格筛选景点，查看详情、收藏、跳转购票 |
| 🌤️ 天气查询 | 查询城市实时天气和未来预报 |
| 👤 用户系统 | 注册/登录/个人中心（AI 额度、收藏列表、修改密码） |
| 🔗 行程分享 | 生成分享链接，他人可查看你的行程 |

---

## 二、技术栈一览

```
前端                              后端
─────────────────────            ─────────────────────
React 19                         Node.js + Express 4
TypeScript (strict: false)        ES Modules (type: module)
React Router 7                   PostgreSQL 16 (pg 驱动)
Ant Design 5                     SQLite (sql.js, 用户认证)
Zustand 5 (状态管理)              JWT 认证 (jsonwebtoken)
Vite 8 (构建)                     bcryptjs (密码哈希)
Vitest + Testing Library (测试)   SiliconFlow / DeepSeek LLM
```

**包管理：** 前后端各自独立的 pnpm，不是 monorepo workspace。

---

## 三、项目目录结构

```
react-travel/
├── src/                          # 前端源码
│   ├── api/                      # API 请求封装
│   │   ├── client.ts             #   请求基类（fetch + JWT + 错误处理）
│   │   ├── auth.ts               #   登录/注册/个人资料 API
│   │   ├── attractions.ts        #   景点列表/详情/收藏 API
│   │   └── weather.ts            #   天气 API
│   ├── components/               # 可复用组件
│   │   ├── Layout/               #   页面布局（<Outlet />）
│   │   ├── ProtectedRoute/       #   路由守卫（未登录跳转）
│   │   ├── ErrorBoundary/        #   错误边界
│   │   ├── ChatBubble/           #   聊天气泡
│   │   ├── AgentSteps/           #   AI 推荐步骤展示
│   │   ├── BudgetTable/          #   预算表格
│   │   ├── WeatherCard/          #   天气卡片
│   │   ├── SpotItem/             #   景点条目
│   │   ├── RAGSource/            #   RAG 来源标注
│   │   ├── HomeWeather/          #   首页天气组件
│   │   └── AccommodationCard/    #   住宿推荐卡片
│   ├── hooks/                    # 自定义 Hooks
│   │   ├── useSSE.ts             #   SSE 流式响应解析
│   │   ├── useWeather.ts         #   天气数据获取
│   │   └── useAppMessage.ts      #   Ant Design message 封装
│   ├── pages/                    # 页面组件（每个页面 = 一个文件夹）
│   │   ├── Home/                 #   首页（AI 行程规划入口）
│   │   ├── Detail/               #   行程详情页
│   │   ├── Chat/                 #   AI 对话页
│   │   ├── Weather/              #   天气查询页
│   │   ├── Attractions/          #   景点列表页
│   │   ├── AttractionDetail/     #   景点详情页
│   │   ├── Profile/              #   个人中心页
│   │   └── Login/                #   登录/注册页
│   ├── stores/                   # Zustand 状态管理
│   │   ├── auth.tsx              #   认证状态（JWT 持久化到 localStorage）
│   │   ├── itinerary.tsx         #   行程数据
│   │   └── chat.tsx              #   聊天状态
│   ├── router/index.tsx          # 路由配置
│   ├── types/                    # TypeScript 类型定义
│   │   ├── api.ts                #   API 响应/SSE 事件/用户类型
│   │   └── attraction.ts         #   景点相关类型
│   ├── constants/cities.ts       # 城市常量
│   ├── styles/global.css         # 全局样式
│   ├── App.tsx                   # 根组件（ConfigProvider + ErrorBoundary）
│   └── main.tsx                  # 入口文件
│
├── server/                       # 后端源码
│   ├── index.js                  # Express 入口，挂载所有路由
│   ├── config/
│   │   └── env.js                # 环境变量读取和校验
│   ├── db/                       # PostgreSQL
│   │   ├── index.js              #   连接池（pg.Pool）
│   │   ├── schema.sql            #   建表 DDL
│   │   └── seed.js               #   数据迁移脚本
│   ├── middleware/
│   │   ├── auth.js               #   JWT 认证中间件
│   │   ├── aiQuota.js            #   AI 使用额度检查
│   │   └── rateLimit.js          #   请求限流
│   ├── routes/                   # API 路由
│   │   ├── auth.js               #   注册/登录/个人资料/改密码
│   │   ├── travel.js             #   行程推荐（SSE 流式）
│   │   ├── chat.js               #   AI 对话（function calling）
│   │   ├── attractions.js        #   景点列表/详情/收藏
│   │   ├── admin/attractions.js  #   景点管理 CRUD
│   │   ├── weather.js            #   天气查询
│   │   └── share.js              #   行程分享
│   ├── services/                 # 业务逻辑层
│   │   ├── agent.js              #   ReAct Agent（解析意图→检索→规划→预算→建议）
│   │   ├── rag.js                #   RAG 检索（关键词 + TF-IDF 混合评分）
│   │   ├── tfidf.js              #   TF-IDF 算法实现
│   │   ├── llm.js                #   LLM 客户端（SiliconFlow/DeepSeek）
│   │   ├── auth.js               #   认证服务（SQLite 用户库 + AI 额度 + 收藏）
│   │   ├── weather.js            #   天气服务
│   │   ├── share.js              #   分享服务
│   │   └── attractions/          #   景点领域服务
│   │       ├── attractionService.js      # 业务逻辑（收藏合并、分页）
│   │       ├── attractionMatcher.js      # 行程→景点匹配器
│   │       └── providers/
│   │           └── pgAttractionProvider.js  # PostgreSQL 数据 Provider
│   ├── knowledge/
│   │   └── attractions.json      # RAG 知识库（15 城市 × 10 景点 + 美食/交通/住宿）
│   ├── data/
│   │   ├── users.db              # SQLite 用户数据库
│   │   └── shared_itineraries.json # 分享行程数据
│   └── utils/
│       ├── http.js               # 错误处理中间件
│       ├── sse.js                # SSE 发送工具
│       └── validation.js         # 参数校验工具
│
├── .env                          # 环境变量（JWT_SECRET、API_KEY、DATABASE_URL）
├── vite.config.js                # Vite 配置（端口 5181，/api 代理到 3030）
├── eslint.config.js              # ESLint 配置
└── tsconfig.json                 # TypeScript 配置
```

---

## 四、数据流：一次完整的旅行推荐是怎么跑的

这是项目最核心的流程，理解了这个就理解了大半个项目。

```
用户在首页输入 "北京 3天 5000元"
         │
         ▼
┌─ 前端 (Home/index.tsx) ─────────────────────────────────┐
│  1. 拼装参数，POST /api/travel/recommend                  │
│  2. 通过 useSSE hook 建立 SSE 长连接                      │
│  3. 实时接收 step/chunk/complete 事件并渲染               │
└──────────────────────────────────────────────────────────┘
         │ SSE 流
         ▼
┌─ 后端 (routes/travel.js → services/agent.js) ───────────┐
│                                                           │
│  Step 1: 解析意图                                         │
│    callLLM → 提取 {city, days, budget, tags}             │
│                                                           │
│  Step 2: RAG 知识库检索                                   │
│    rag.retrieve(city, tags, query)                        │
│    → 从 PostgreSQL attraction_knowledge 表查询            │
│    → 关键词评分(40%) + TF-IDF 语义评分(60%)               │
│    → 返回排序后的景点列表 + 美食/交通/季节                 │
│                                                           │
│  Step 3: 查询天气                                         │
│    weather.getWeather(city)                               │
│                                                           │
│  Step 4: 生成行程                                         │
│    callLLM(景点数据 + 天气 + 用户偏好) → 每日行程 JSON    │
│                                                           │
│  Step 5: 计算预算                                         │
│    门票 + 估算住宿/餐饮/交通                              │
│                                                           │
│  Step 6: 生成旅行贴士                                     │
│    callLLM → 注意事项和建议                               │
│                                                           │
│  每一步都通过 SSE 向前端推送 step(start/complete) 和 chunk │
└──────────────────────────────────────────────────────────┘
```

---

## 五、AI 对话系统怎么工作

聊天页面使用 **function calling** 模式，AI 可以调用工具获取实时数据：

```
用户: "成都和西安哪个更适合带孩子去？"
         │
         ▼
┌─ 后端 (routes/chat.js) ─────────────────────────────────┐
│                                                           │
│  1. 构建消息（滑动窗口，旧消息提取城市摘要）              │
│  2. 调用 LLM (callLLMWithTools)                          │
│  3. LLM 返回 tool_call: compare_cities("成都","西安")    │
│  4. 执行工具 → 从 RAG 知识库查询两城数据                 │
│  5. 将工具结果反馈给 LLM                                 │
│  6. LLM 生成最终回答                                     │
│  7. 最多 5 轮工具调用                                    │
│                                                           │
│  可用工具:                                                │
│  - search_travel_info  搜索景点信息                       │
│  - get_city_list       获取城市列表                       │
│  - compare_cities      对比两个城市                       │
│  - get_travel_tips     获取旅行建议                       │
│  - get_weather         查询天气                           │
│  - search_product_attractions 搜索精选景点                │
└──────────────────────────────────────────────────────────┘
```

---

## 六、数据库设计

项目使用 **两个数据库**：

### PostgreSQL（景点和知识库）

```sql
-- 景点主表（30 条产品数据）
attractions (id, name, city, ticket_type, price_text, cover_image,
             summary, description, address, opening_hours,
             recommended_duration, aliases[], highlights[],
             tips[], suitable_for[], booking_links JSONB)

-- 标签表（多对多关系）
tags (id, name)
attraction_tags (attraction_id, tag_id)

-- RAG 知识库表（153 条，15 城市 × 10 景点 + 城市元数据）
attraction_knowledge (id, city, name, description, ticket,
                      duration, tips, indoor, tags[],
                      food[], transport, best_season,
                      accommodation JSONB, nightlife JSONB)
```

### SQLite（用户数据）

```sql
-- 用户表
users (id, username, password, created_at)

-- AI 使用额度（每天 10 次）
ai_usage (user_id, usage_date, used_count)

-- 收藏表
user_favorite_attractions (id, user_id, attraction_id, created_at)
```

**为什么用两个数据库？** 用户认证用 SQLite 是因为 sql.js(WASM) 无需原生编译，部署简单。景点数据用 PostgreSQL 是因为需要全文搜索、分页查询和未来扩展。

---

## 七、SSE 流式响应机制

前端通过 `useSSE` hook 实现实时流式展示：

```
前端 fetch POST → 后端返回 ReadableStream
                    │
                    ▼
              后端逐行发送 JSON:
              {"type":"step","step":1,"name":"解析意图","status":"start"}
              {"type":"step","step":1,"name":"解析意图","status":"complete","data":{...}}
              {"type":"chunk","content":"第一天上午可以去..."}
              {"type":"complete","data":{...}}
                    │
                    ▼
              前端按 type 分发到对应回调:
              onStep → 更新步骤状态
              onChunk → 追加文本到输出区
              onComplete → 渲染最终行程数据
```

---

## 八、状态管理（Zustand）

三个独立 store，各自管理一块状态：

| Store | 文件 | 持久化 | 职责 |
|-------|------|--------|------|
| `useAuthStore` | stores/auth.tsx | ✅ localStorage `travel_auth` | 用户信息、JWT token、登录/注册/登出 |
| `useItineraryStore` | stores/itinerary.tsx | ❌ | 行程推荐结果、加载状态 |
| `useChatStore` | stores/chat.tsx | ❌ | 聊天消息列表、对话历史 |

---

## 九、路由和权限

所有页面都是懒加载（`React.lazy`），包裹在 `ErrorBoundary` 中：

| 路径 | 页面 | 需要登录 | 说明 |
|------|------|----------|------|
| `/` | Home | ❌ | 首页，AI 行程规划入口 |
| `/login` | Login | ❌ | 登录/注册 |
| `/weather` | Weather | ❌ | 天气查询 |
| `/detail` | Detail | ✅ | 行程详情（推荐结果展示） |
| `/chat` | Chat | ✅ | AI 对话 |
| `/attractions` | Attractions | ✅ | 景点列表（分页+筛选+收藏） |
| `/attractions/:id` | AttractionDetail | ✅ | 景点详情+购票入口 |
| `/profile` | Profile | ✅ | 个人中心（额度/收藏/改密码） |

`ProtectedRoute` 组件检查 Zustand 中的 user 状态，未登录则跳转 `/login`。

---

## 十、API 接口总览

### 认证 `/api/auth`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/register` | 注册（用户名 2-20 字，密码 6+ 位） |
| POST | `/login` | 登录，返回 JWT（7 天有效） |
| GET | `/me` | 获取当前用户信息 |
| GET | `/profile` | 获取个人资料（含 AI 额度+收藏列表） |
| PUT | `/password` | 修改密码 |

### 行程推荐 `/api/travel`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/recommend` | AI 行程推荐（SSE 流式） |
| POST | `/chat` | AI 对话（function calling，最多 5 轮） |
| POST | `/share` | 生成分享链接 |
| GET | `/share/:id` | 查看分享的行程 |

### 景点 `/api/attractions`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 景点列表（支持 city/keyword/tag/ticketType/page/pageSize） |
| GET | `/:id` | 景点详情 |
| GET | `/favorites` | 我的收藏 |
| POST | `/:id/favorite` | 收藏 |
| DELETE | `/:id/favorite` | 取消收藏 |

### 景点管理 `/api/admin/attractions`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 分页列表 |
| GET | `/:id` | 详情 |
| POST | `/` | 创建景点 |
| PUT | `/:id` | 更新景点 |
| DELETE | `/:id` | 删除景点 |

### 其他

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/weather?city=xxx` | 天气查询 |
| GET | `/api/health` | 健康检查 |

---

## 十一、关键配置

### 环境变量 `.env`

```bash
# 必须配置
JWT_SECRET=your-secret-key-at-least-32-chars

# AI 服务（二选一或都配，优先 SiliconFlow）
SILICONFLOW_API_KEY=sk-xxx
DEEPSEEK_API_KEY=sk-xxx

# PostgreSQL（不配则后端无法启动景点相关功能）
DATABASE_URL=postgresql://joygy@localhost:5432/travel
```

### 端口

| 服务 | 端口 | 说明 |
|------|------|------|
| Vite 前端 | 5181 | `pnpm dev` 启动 |
| Express 后端 | 3030 | `cd server && pnpm dev` 启动 |
| 前端 `/api` 代理 | → 3030 | Vite 自动代理，开发时前后端同源 |

### 限流

| 接口 | 限制 |
|------|------|
| AI 接口（推荐/对话） | 每分钟 15 次 |
| 认证接口 | 每分钟 10 次 |
| 注册 | 每小时 5 次 |
| AI 使用额度 | 每用户每天 10 次 |

---

## 十二、开发常用命令

```bash
# 前端
pnpm dev          # 启动开发服务器 (端口 5181)
pnpm lint         # ESLint 检查
pnpm typecheck    # TypeScript 类型检查
pnpm build        # 生产构建
pnpm check        # lint + typecheck + build 一键检查
pnpm test         # 单元测试 (watch 模式)

# 后端
cd server
pnpm dev          # 启动后端 (端口 3030)
pnpm check        # Node 语法检查

# 数据库
node server/db/seed.js   # 运行数据迁移（JSON → PostgreSQL）
```

---

## 十三、核心设计模式

### Provider 模式（景点数据）

```
routes/attractions.js
    │
    ▼
attractionService.js          ← 业务逻辑层（合并收藏、分页）
    │
    ▼
pgAttractionProvider.js       ← 数据层（PostgreSQL 查询）
```

如果将来要换数据库（比如 MongoDB），只需新建一个 provider 文件，service 层不用改。

### RAG 检索模式

```
用户查询 → 关键词匹配(40%) + TF-IDF 语义相似度(60%) → 混合排序 → 返回最相关景点
```

TF-IDF 索引在服务启动时从 PostgreSQL 加载数据并构建，对中文使用 bigram 分词（如 "故宫" → ["故", "故宫", "宫"]）。

### ReAct Agent 模式

```
意图解析 → 知识检索 → 天气查询 → 行程生成 → 预算计算 → 旅行建议
  (LLM)    (RAG+DB)   (API)      (LLM)     (计算)     (LLM)
```

每一步通过 SSE 实时推送给前端，用户可以看到 AI 的"思考过程"。

---

## 十四、文件间依赖关系速查

```
前端数据流:
pages/ → api/*.ts → api/client.ts → fetch → Vite proxy → 后端
pages/ → stores/*.tsx → localStorage (持久化)
pages/ → hooks/useSSE.ts → ReadableStream → 后端 SSE

后端数据流:
routes/*.js → services/*.js → db/index.js → PostgreSQL / SQLite
routes/chat.js → services/llm.js → SiliconFlow / DeepSeek API
routes/travel.js → services/agent.js → services/rag.js → PostgreSQL
```

---

## 十五、已知的技术债和可改进点

| 项目 | 现状 | 可改进 |
|------|------|--------|
| TypeScript | `strict: false` | 逐步开启 strict 模式 |
| 后端语言 | 纯 JavaScript | 迁移到 TypeScript |
| 测试覆盖 | 部分组件有单元测试 | 补充 API 集成测试 |
| 用户认证 | SQLite (sql.js WASM) | 统一到 PostgreSQL |
| 图片管理 | 硬编码 URL | 接入 OSS/CDN |
| RAG 搜索 | TF-IDF + 关键词 | 升级为向量搜索 (pgvector) |
| 错误监控 | console.log | 接入 Sentry 等监控服务 |
