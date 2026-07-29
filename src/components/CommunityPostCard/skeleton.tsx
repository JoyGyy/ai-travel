import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import './skeleton.css'

export function CommunityPostCardSkeleton() {
  return (
    <Card className="community-post-card-skeleton">
      <CardContent className="p-0">
        {/* 图片占位 */}
        <Skeleton className="skeleton-image-placeholder h-48 w-full" />

        {/* 内容区域 */}
        <div className="skeleton-content">
          {/* 用户信息 */}
          <div className="skeleton-meta flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>

          {/* 标题 */}
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-4 w-[70%]" />

          {/* 操作栏 */}
          <div className="skeleton-actions flex gap-2">
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-8 w-12" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
