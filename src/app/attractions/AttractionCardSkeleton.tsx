'use client'

/**
 * 景点列表页 — 骨架屏组件
 */
import { Skeleton } from '@/components/ui/skeleton'

export function AttractionCardSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <div className="travel-surface-card travel-ticket-edge overflow-hidden" key={i}>
          <Skeleton className="h-62.5 w-full rounded-none" />
          <div className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <Skeleton className="h-5 w-2/5" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="mb-3 h-4 w-full" />
            <div className="mb-3 flex items-center gap-2">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-14" />
            </div>
            <div className="mb-4 flex gap-1.5">
              <Skeleton className="h-5 w-14" />
              <Skeleton className="h-5 w-14" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}
