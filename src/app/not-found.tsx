'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-travel-surface p-6">
      <div className="max-w-100 rounded-2xl bg-white p-10 text-center shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
        <div className="mb-4 text-12">🔍</div>
        <h2 className="mb-3 text-xl font-semibold text-stone-900">页面不存在</h2>
        <p className="mb-6 text-sm leading-relaxed text-gray-600">
          你访问的页面不存在或已被移除
        </p>
        <Link
          className="inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          href="/"
        >
          返回首页
        </Link>
      </div>
    </div>
  )
}
