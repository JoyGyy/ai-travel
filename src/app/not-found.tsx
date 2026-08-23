'use client'

import { SearchX } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-travel-surface p-6">
      <div className="max-w-100 rounded-lg border border-travel-ink/8 bg-white p-10 text-center shadow-[0_8px_28px_rgba(34,111,120,0.08)]">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <SearchX className="h-7 w-7" />
        </div>
        <h2 className="mb-3 text-xl font-semibold text-travel-ink">页面不存在</h2>
        <p className="mb-6 text-sm leading-relaxed text-travel-muted">
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
