'use client'

/**
 * 全局错误边界（Client Component）
 * Next.js App Router 的 error.tsx 自动捕获路由级错误
 */
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 可接入 Sentry 等监控服务
    console.error('页面错误:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-travel-surface p-6">
      <div className="max-w-[400px] rounded-2xl bg-white p-10 text-center shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
        <div className="mb-4 text-[48px]">⚠️</div>
        <h2 className="mb-3 text-xl font-semibold text-stone-900">页面出了点问题</h2>
        <p className="mb-6 text-sm leading-relaxed text-gray-600">
          {error.message || '发生了未知错误'}
        </p>
        <div className="flex justify-center gap-3">
          <button
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            onClick={reset}
            type="button"
          >
            重试
          </button>
        </div>
      </div>
    </div>
  )
}
