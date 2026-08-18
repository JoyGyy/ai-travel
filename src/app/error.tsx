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
    console.error('页面错误:', error)
  }, [error])

  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div className="flex min-h-screen items-center justify-center bg-travel-surface p-6">
      <div className="max-w-100 rounded-2xl bg-white p-10 text-center shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
        <div className="mb-4 text-12">⚠️</div>
        <h2 className="mb-3 text-xl font-semibold text-stone-900">页面出了点问题</h2>
        <p className="mb-6 text-sm leading-relaxed text-gray-600" role="alert">
          {isDev ? (error.message || '发生了未知错误') : '页面加载出错，请稍后重试'}
        </p>
        {isDev && error.digest && (
          <p className="mb-4 text-xs text-gray-400">
            Digest:
            {' '}
            {error.digest}
          </p>
        )}
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
