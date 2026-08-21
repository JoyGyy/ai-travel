'use client'

/**
 * 社区帖子详情页 — 帖子操作栏组件
 */
import { Heart, Repeat2, Share2, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface PostActionsProps {
  hasHydrated: boolean
  isAuthor: boolean
  isLikeAnimating: boolean
  likeCount: number
  likePending: boolean
  likedByMe: boolean
  onDelete: () => void
  onLike: () => void
  onRepost: () => void
  onShare: () => void
  postDeletePending: boolean
  repostCount: number
}

export function PostActions({
  hasHydrated,
  isAuthor,
  isLikeAnimating,
  likeCount,
  likePending,
  likedByMe,
  onDelete,
  onLike,
  onRepost,
  onShare,
  postDeletePending,
  repostCount,
}: PostActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        className={`${likedByMe ? 'text-primary' : ''} ${isLikeAnimating ? 'animate-bounce' : ''}`}
        disabled={likePending}
        onClick={onLike}
        variant="outline"
      >
        <Heart
          className={`mr-1 h-4 w-4 ${likedByMe ? 'fill-current' : ''}`}
        />
        {likeCount}
      </Button>
      <Button
        disabled={!hasHydrated}
        onClick={onRepost}
        variant="outline"
      >
        <Repeat2 className="mr-1 h-4 w-4" />
        {!hasHydrated ? '加载中...' : `转发 · ${repostCount}`}
      </Button>
      <Button onClick={onShare} variant="outline">
        <Share2 className="mr-1 h-4 w-4" />
        分享链接
      </Button>
      {isAuthor && (
        <Button disabled={postDeletePending} onClick={onDelete} variant="destructive">
          <Trash2 className="mr-1 h-4 w-4" />
          {postDeletePending ? '删除中...' : '删除帖子'}
        </Button>
      )}
    </div>
  )
}
