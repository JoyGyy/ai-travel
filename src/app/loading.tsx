/**
 * 全局加载状态（Server Component）
 * Next.js App Router 的 loading.tsx 自动展示
 */
export default function Loading() {
  return (
    <div
      aria-live="polite"
      className="min-h-dvh flex flex-col items-center justify-center gap-3 text-travel-ocean"
      role="status"
    >
      <div
        aria-hidden="true"
        className="w-[34px] h-[34px] border-[3px] border-primary/16 border-t-primary rounded-full animate-spin motion-reduce:animate-none"
      />
      <span className="text-[13px] font-bold text-travel-muted">加载中...</span>
    </div>
  )
}
