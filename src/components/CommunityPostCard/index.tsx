'use client'

import { Heart, MapPin, MessageCircle, Repeat2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'

import type { CommunityPost } from '@/types/community'

import { CommunityImageGrid } from '@/components/CommunityImageGrid'
import { CommunityItineraryPreview } from '@/components/CommunityItineraryPreview'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface CommunityPostCardProps {
  currentUserId?: string
  deletePending?: boolean
  likePending?: boolean
  onComment?: (post: CommunityPost) => void
  onDelete?: (post: CommunityPost) => void
  onLike?: (post: CommunityPost) => void
  onRepost?: (post: CommunityPost) => void
  post: CommunityPost
  repostPending?: boolean
}

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  return date.toLocaleDateString('zh-CN', { day: 'numeric', month: 'short' })
}

function getPostExcerpt(content: string) {
  if (content.length <= 80) return content
  return `${content.slice(0, 80)}...`
}

export const CommunityPostCard = React.memo(
  ({
    currentUserId,
    deletePending = false,
    likePending = false,
    onComment,
    onDelete,
    onLike,
    onRepost,
    post,
    repostPending = false,
  }: CommunityPostCardProps) => {
    const isAuthor = currentUserId === post.author.id
    const displayAuthor =
      post.postType === 'repost' && post.originalPost
        ? `${post.author.username} 转发了 ${post.originalPost.author.username}`
        : post.author.username

    const [isLikeAnimating, setIsLikeAnimating] = useState(false)

    const handleLike = () => {
      if (!post.likedByMe) {
        setIsLikeAnimating(true)
        setTimeout(setIsLikeAnimating, 600, false)
      }
      onLike?.(post)
    }

    const hasImages = post.images && post.images.length > 0

    return (
      <Card
        className={`group overflow-hidden rounded-xl transition-transform transition-shadow duration-200 ease-[var(--ease-standard)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] motion-reduce:transition-none motion-reduce:transform-none ${hasImages ? '' : ''}`}
      >
        <CardContent className="p-0">
          {/* 图片区域 - 占主要面积 */}
          {hasImages && (
            <Link
              className="block overflow-hidden cursor-pointer [&_.community-image-grid]:rounded-none [&_.community-image-grid__image]:transition-transform [&_.community-image-grid__image]:duration-300 [&_.community-image-grid__image]:ease-[var(--ease-standard)] group-hover:[&_.community-image-grid__image]:scale-103 motion-reduce:[&_.community-image-grid__image]:transition-none"
              href={`/community/${post.id}`}
            >
              <CommunityImageGrid compact images={post.images} />
            </Link>
          )}

          {/* 内容区域 */}
          <div className="flex flex-col gap-2 p-2.5 sm:p-3">
            {/* 用户信息 */}
            <div className="flex items-center justify-between gap-2">
              <Link
                className="flex items-center gap-2 no-underline text-inherit group/username"
                href={`/community?authorId=${post.author.id}`}
              >
                <Avatar className="h-7 w-7 shrink-0 bg-[linear-gradient(135deg,var(--color-primary),var(--travel-accent))] text-xs font-bold">
                  <AvatarFallback>{post.author.username.slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="max-w-[120px] truncate text-[13px] font-semibold transition-colors duration-200 group-hover/username:text-[var(--color-primary)]">
                  {displayAuthor}
                </span>
              </Link>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatTime(post.createdAt)}
              </span>
            </div>

            {/* 标题和内容 */}
            <Link
              className="flex flex-col gap-1 no-underline text-inherit cursor-pointer"
              href={`/community/${post.id}`}
            >
              {post.title && (
                <p className="!m-0 text-[13px] sm:text-sm font-semibold leading-snug text-travel-ink transition-colors duration-200 hover:text-[var(--color-primary)] motion-reduce:transition-none line-clamp-2">
                  {post.title}
                </p>
              )}
              {post.content && (
                <p className="!m-0 text-[13px] leading-relaxed text-muted-foreground line-clamp-2">
                  {getPostExcerpt(post.content)}
                </p>
              )}
            </Link>

            {/* 城市标签 */}
            {post.city && (
              <Badge className="self-start m-0 text-xs" variant="secondary">
                <MapPin className="mr-1" size={12} />
                {post.city}
              </Badge>
            )}

            {/* 行程预览（紧凑模式） */}
            {post.itinerarySnapshot && (
              <div className="mt-1">
                <CommunityItineraryPreview snapshot={post.itinerarySnapshot} />
              </div>
            )}

            {/* 原帖引用 */}
            {post.originalPost && (
              <Link
                className="flex flex-col gap-0.5 p-2 rounded-lg bg-[var(--travel-surface-muted)] no-underline text-inherit transition-colors duration-200 hover:bg-[var(--travel-frosted)] motion-reduce:transition-none"
                href={`/community/${post.originalPost.id}`}
              >
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  原帖
                </span>
                <span className="font-semibold truncate">
                  {post.originalPost.title || `${post.originalPost.city || '旅行'}分享`}
                </span>
              </Link>
            )}
            {post.postType === 'repost' && !post.originalPost && (
              <span className="text-xs py-1 text-muted-foreground">原帖已删除</span>
            )}

            {/* 操作栏 */}
            <div className="flex items-center justify-between mt-1 pt-2 border-t border-travel-border">
              <div className="flex gap-2">
                <Button
                  aria-label="点赞"
                  className={`text-travel-muted transition-colors transition-transform duration-200 ease-[var(--ease-standard)] hover:text-travel-ink hover:scale-105 active:scale-95 motion-reduce:transition-none motion-reduce:transform-none ${post.likedByMe ? 'text-destructive' : ''} ${isLikeAnimating ? 'animate-[likeHeartbeat_0.4s_var(--ease-spring)] motion-reduce:animate-none' : ''}`}
                  disabled={likePending}
                  onClick={handleLike}
                  size="sm"
                  variant="ghost"
                >
                  <Heart className={post.likedByMe ? 'fill-current' : ''} size={16} />
                  {post.likeCount || ''}
                </Button>
                <Button
                  aria-label="评论"
                  className="text-travel-muted transition-colors transition-transform duration-200 ease-[var(--ease-standard)] hover:text-travel-ink hover:scale-105 active:scale-95 motion-reduce:transition-none motion-reduce:transform-none"
                  onClick={() => onComment?.(post)}
                  size="sm"
                  variant="ghost"
                >
                  <MessageCircle size={16} />
                  {post.commentCount || ''}
                </Button>
                <Button
                  aria-label="转发"
                  className="text-travel-muted transition-colors transition-transform duration-200 ease-[var(--ease-standard)] hover:text-travel-ink hover:scale-105 active:scale-95 motion-reduce:transition-none motion-reduce:transform-none"
                  disabled={repostPending}
                  onClick={() => onRepost?.(post)}
                  size="sm"
                  variant="ghost"
                >
                  <Repeat2 size={16} />
                  {post.repostCount || ''}
                </Button>
              </div>

              {isAuthor && (
                <Button
                  aria-label="删除"
                  className="text-destructive"
                  disabled={deletePending}
                  onClick={() => onDelete?.(post)}
                  size="sm"
                  variant="ghost"
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  },
)
