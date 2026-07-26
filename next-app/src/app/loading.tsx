/**
 * 全局加载状态（Server Component）
 * Next.js App Router 的 loading.tsx 自动展示
 */
export default function Loading() {
  return (
    <div className="layout-loading" role="status" aria-live="polite">
      <div className="layout-loading__spinner" aria-hidden="true" />
      <span className="layout-loading__text">加载中...</span>
    </div>
  )
}
