# AGENTS.md

This file provides rules and instructions for AI agents working in this codebase.

## 1. 核心铁律：严禁自动提交 Git，由用户审查后手动提交

> ⚠️ **强制行为准则**：
> 1. **严禁自动执行 Git 提交**：AI 在完成代码修改与测试验证后，**绝对不可擅自或自动执行 `git commit` 或 `git push`**！
> 2. **人工审查与手动提交**：所有代码变更必须在用户亲自审查（Code Review）完毕后，**由用户手动执行 Git 提交**。

---

## 2. 修改完成后的答复规范 (Post-Modification Summary)

每次完成代码编写、重构或 Bug 修复后，向用户汇报时必须遵循：

1. **简明扼要，拒绝冗长**：
   - **严禁**大段罗列无关流水账或逐行机械复述代码；
   - 用精炼的要点总结，**让用户能快速、一眼看懂“这次具体干了什么”**即可。
2. **汇报结构建议**：
   - **核心目的/问题**：1~2 句话点明修改目标或根因；
   - **核心改动**：点出涉及的核心文件及 2~3 个关键改动要点；
   - **验证状态**：说明 TypeScript 类型检查与测试通过情况；
   - **建议 Commit 信息**：附带一条建议的 Conventional Commit 文本，方便用户直接复制手动提交。

---

## 3. Git 提交参考规范 (Conventional Commits)

供用户手动提交时参考的语义化规范：

```text
<type>(<scope>): <清晰的中文简要说明>
```

- **Type**:
  - `feat`: 新增功能特性
  - `fix`: 修复 Bug / 异常
  - `refactor`: 重构代码（不改变外部行为）
  - `style`: 样式、UI 排版与视觉微调
  - `perf`: 性能优化
  - `test`: 测试用例新增或调整
  - `chore`: 依赖、构建或工程配置变动
  - `docs`: 文档变更
- **Scope**:
  - `chat`, `community`, `attractions`, `weather`, `auth`, `map`, `db`, `api`, `ui`, `store`

---

## 4. 代码质量与反模式规范

- ❌ **严禁遗留调试垃圾**：交付审查前必须清理临时文件、无用的 `console.log`、临时注释等。
- ❌ **严禁破坏可验证性**：修改交付给用户前，必须确保 `tsc --noEmit` 类型检查通过，且相关 Vitest 单元测试全部通过。
- ❌ **严禁隐式边界漏洞**：注意防御性编程与类型安全，杜绝除零、`NaN`、空引用等潜在异常。
