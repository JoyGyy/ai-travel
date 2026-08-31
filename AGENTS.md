# AGENTS.md

This file provides rules and instructions for AI agents working in this codebase.

## 1. 核心铁律：修改完成后必须自动分批提交 (Mandatory Auto Batch & Atomic Commits)

> ⚠️ **强制规范**：
> 1. **修改完成自动提交**：每次开发、重构或 Bug 修复任务在完成代码修改与测试验证通过后，**必须主动、自动执行 Git 提交**，无需等待用户额外发出提交指令！
> 2. **严禁一次性巨型提交**：**严禁一次性提交一个包含大量跨模块文件的大变更（NO Giant Commits）**！必须按照逻辑边界与架构分层**小步分批提交（Batch Commits）**！

---

## 2. 分批拆分准则 (Commit Batching Strategy)

在执行 `git commit` 时，必须按以下维度之一进行精确拆分：

### 维度 A：按全栈架构分层分批（推荐）
1. **第 1 批（数据与存储层）**：`db/migrations/`, `db/schema.sql` -> `feat(db): ...`
2. **第 2 批（后端服务与 API 校验层）**：`src/lib/services/`, `src/app/api/**/route.ts` -> `feat(api): ...` / `fix(community): ...`
3. **第 3 批（客户端状态与请求层）**：`src/stores/`, `src/api/`, `src/hooks/` -> `feat(store): ...` / `fix(chat): ...`
4. **第 4 批（前端 UI 与页面渲染层）**：`src/components/`, `src/app/**/page.tsx` -> `feat(ui): ...` / `style(card): ...`
5. **第 5 批（自动化测试用例层）**：`**/*.test.ts`, `**/*.test.tsx` -> `test(community): ...`

### 维度 B：按独立业务域分批
如果同时修复或开发了多个业务模块（例如 `auth`、`chat`、`community`、`attractions`、`weather`），**必须每个业务域单独成一个 Commit**，绝对不可合并混杂。

---

## 3. Commit Message 规范

统一使用 **Conventional Commits** 语义化规范：

```text
<type>(<scope>): <清晰的中文简要说明>
```

- **Type**:
  - `feat`: 新增功能特性
  - `fix`: 修复 Bug / 异常
  - `refactor`: 重构代码（不改变外部行为）
  - `style`: 样式、UI 排版与视觉调整
  - `perf`: 性能优化
  - `test`: 测试用例新增或调整
  - `chore`: 依赖、构建或工程配置变动
  - `docs`: 文档变更
- **Scope**:
  - `chat`, `community`, `attractions`, `weather`, `auth`, `map`, `db`, `api`, `ui`, `store`

---

## 4. 严禁的反模式 (Prohibited Anti-Patterns)

- ❌ **严禁 `git add .` 打包提交**：必须使用 `git add <file1> <file2>` 精确添加相关文件。
- ❌ **严禁模糊提交信息**：如 `update`、`fix bug`、`changes`、`commit`。
- ❌ **严禁混入临时调试内容**：提交前必须清理无用的临时文件、未使用的 `console.log` 等。
- ❌ **严禁破坏单次提交的可验证性**：每一个 Commit 提交前都应确保 TypeScript 类型检查和相关单元测试能够通过。
