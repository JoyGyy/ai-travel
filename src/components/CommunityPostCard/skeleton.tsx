import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function CommunityPostCardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-xl">
      <CardContent className="p-0">
        {/* 图片占位 */}
        <Skeleton className="h-48 w-full aspect-[4/3] bg-[linear-gradient(90deg,#f0f0f0_25%,#e0e0e0_50%,#f0f0f0_75%)] bg-[length:200%_100%] animate-[skeletonShimmer_1.5s_infinite]" />

        {/* 内容区域 */}
        <div className="flex flex-col gap-2.5 p-3">
          {/* 用户信息 */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>

          {/* 标题 */}
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-4 w-[70%]" />

          {/* 操作栏 */}
          <div className="flex gap-2 pt-2.5 border-t border-[#f0f0f0]">
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-8 w-12" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
