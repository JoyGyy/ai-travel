/**
 * Vite 环境类型声明
 *
 * 扩展 Vite 客户端类型，声明 CSS 模块的类型定义，
 * 使 TypeScript 能正确识别 *.css 导入。
 */
/// <reference types="vite/client" />

// --- 自定义环境变量类型声明 ---
interface ImportMetaEnv {
  /** Sentry DSN 地址 */
  readonly VITE_SENTRY_DSN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// --- CSS 模块类型声明 ---
declare module '*.css' {
  const content: Record<string, string>
  export default content
}
