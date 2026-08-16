# 数据库 Migration 管理

## 目录结构

```
db/
├── migrations/          # SQL migration 文件（按文件名排序执行）
│   └── 001_baseline.sql # 基线 schema（11 张表 + 索引）
├── migrate.ts           # Migration 管理脚本
└── README.md            # 本文件
```

## 使用方法

### 查看状态
```bash
pnpm db:migrate:status
```

### 执行 migration
```bash
pnpm db:migrate
```

### 清空数据库并重建（⚠️ 危险）
```bash
pnpm db:migrate:fresh
```

## 添加新 Migration

1. 在 `migrations/` 目录创建新文件，格式: `NNN_description.sql`
2. 编写 SQL（使用 `BEGIN/COMMIT` 包裹事务）
3. 运行 `pnpm db:migrate` 应用

### 示例

```sql
-- migrations/002_add_user_email.sql
BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

COMMIT;
```

## 注意事项

- Migration 文件一旦应用不要修改，后续变更用新文件
- 使用 `IF NOT EXISTS` / `IF EXISTS` 保证幂等性
- 基线文件 `001_baseline.sql` 是从 git 历史恢复的完整 schema
