/**
 * sql.js 类型声明
 * sql.js 是 SQLite 的 WebAssembly 实现，提供内存中的 SQLite 数据库操作
 */
declare module 'sql.js' {
  interface SqlJsConfig {
    locateFile?: (file: string) => string
  }

  interface Database {
    run(sql: string, params?: unknown[]): void
    exec(sql: string, params?: unknown[]): Array<{ columns: string[], values: unknown[][] }>
    export(): Uint8Array
    close(): void
  }

  interface SqlJsStatic {
    Database: new (data?: ArrayLike<number>) => Database
  }

  export default function initSqlJs(config?: SqlJsConfig): Promise<SqlJsStatic>
  export type { Database, SqlJsConfig, SqlJsStatic }
}
