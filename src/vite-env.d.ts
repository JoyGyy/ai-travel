/**
 * Vite 环境类型声明
 *
 * 扩展 Vite 客户端类型，声明 CSS 模块的类型定义，
 * 使 TypeScript 能正确识别 *.css 导入。
 */
/// <reference types="vite/client" />

// --- CSS 模块类型声明 ---
declare module '*.css' {
  const content: Record<string, string>
  export default content
}
