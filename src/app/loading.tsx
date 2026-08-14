/**
 * 全局加载状态（Server Component）
 * Next.js App Router 的 loading.tsx 自动展示
 */
export default function Loading() {
  return (
    <div aria-live="polite" className="layout-loading" role="status">
      <div aria-hidden="true" className="layout-loading__spinner" />
      <span className="layout-loading__text">加载中...</span>
    </div>
  )
}
