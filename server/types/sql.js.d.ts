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
