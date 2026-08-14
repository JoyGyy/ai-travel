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
    <div className="error-boundary">
      <div className="error-boundary__content">
        <div className="error-boundary__icon">⚠️</div>
        <h2 className="error-boundary__title">页面出了点问题</h2>
        <p className="error-boundary__message">{error.message || '发生了未知错误'}</p>
        <div className="error-boundary__actions">
          <button
            className="error-boundary__btn error-boundary__btn--primary"
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
