'use client'

import type { CommunityPost } from '@/types/community'
import { motion } from 'framer-motion'
import { Heart, MapPin, MessageCircle, Repeat2, Trash2 } from 'lucide-react'
import Link from 'next/link'

import React, { useState } from 'react'

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
  if (Number.isNaN(date.getTime()))
    return value

  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1)
    return '刚刚'
  if (minutes < 60)
    return `${minutes}分钟前`
  if (hours < 24)
    return `${hours}小时前`
  if (days < 7)
    return `${days}天前`

  return date.toLocaleDateString('zh-CN', { day: 'numeric', month: 'short' })
}

function getPostExcerpt(content: string) {
  if (content.length <= 80)
    return content
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
    const displayAuthor
      = post.postType === 'repost' && post.originalPost
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
        className={`group overflow-hidden rounded-3xl border border-stone-200/90 bg-[#FDFBF7] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-emerald-700/50 ${hasImages ? '' : ''}`}
      >
        <CardContent className="p-0">
          {/* 图片区域 - 占主要面积 */}
          {hasImages && (
            <Link
              className="block overflow-hidden cursor-pointer [&_.community-image-grid]:rounded-none [&_.community-image-grid__image]:transition-transform [&_.community-image-grid__image]:duration-500 group-hover:[&_.community-image-grid__image]:scale-105"
              href={`/community/${post.id}`}
            >
              <CommunityImageGrid compact images={post.images} />
            </Link>
          )}

          {/* 内容区域 */}
          <div className="flex flex-col gap-2 p-3 sm:p-4">
            {/* 用户信息 */}
            <div className="flex items-center justify-between gap-2">
              <Link
                className="flex items-center gap-2 no-underline text-inherit group/username"
                href={`/community?authorId=${post.author.id}`}
              >
                <Avatar className="h-7 w-7 shrink-0 bg-emerald-700 text-white text-xs font-bold shadow-2xs">
                  <AvatarFallback className="bg-emerald-700 text-white font-bold">{post.author.username.slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="max-w-[120px] truncate text-[13px] font-bold text-stone-900 transition-colors duration-200 group-hover/username:text-emerald-800">
                  {displayAuthor}
                </span>
              </Link>
              <span className="shrink-0 text-xs text-stone-400">
                {formatTime(post.createdAt)}
              </span>
            </div>

            {/* 标题和内容 */}
            <Link
              className="flex flex-col gap-1 no-underline text-inherit cursor-pointer"
              href={`/community/${post.id}`}
            >
              {post.title && (
                <p className="!m-0 font-serif text-sm font-bold leading-snug text-stone-900 transition-colors duration-200 hover:text-emerald-800 line-clamp-2">
                  {post.title}
                </p>
              )}
              {post.content && (
                <p className="!m-0 text-xs leading-relaxed text-stone-600 line-clamp-2">
                  {getPostExcerpt(post.content)}
                </p>
              )}
            </Link>

            {/* 城市标签 */}
            {post.city && (
              <Badge className="self-start m-0 text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-full font-bold">
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
                className="flex flex-col gap-0.5 p-2 rounded-lg bg-travel-surface-muted no-underline text-inherit transition-colors duration-200 hover:bg-travel-frosted motion-reduce:transition-none"
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
            {/* 操作栏 */}
            <div className="flex items-center justify-between mt-1 pt-2 border-t border-stone-200/80">
              <div className="flex gap-2">
                <div className="relative">
                  <Button
                    className={`text-stone-500 transition-all duration-200 hover:text-stone-900 hover:scale-105 active:scale-95 ${post.likedByMe ? 'text-red-500 hover:text-red-600' : ''} ${isLikeAnimating ? 'scale-125' : ''}`}
                    disabled={likePending}
                    onClick={handleLike}
                    size="sm"
                    variant="ghost"
                  >
                    <Heart className={post.likedByMe ? 'fill-red-500 text-red-500' : ''} size={16} />
                    <span className="font-bold text-xs">{post.likeCount || ''}</span>
                  </Button>
                  {isLikeAnimating && (
                    <motion.div
                      animate={{ opacity: 0, scale: 2 }}
                      className="pointer-events-none absolute inset-0 flex items-center justify-center"
                      initial={{ opacity: 1, scale: 0.8 }}
                      transition={{ duration: 0.5 }}
                    >
                      <span className="text-red-500 text-xs font-black">💖 +1</span>
                    </motion.div>
                  )}
                </div>
                <Button
                  className="text-travel-muted transition-colors transition-transform duration-200 ease-standard hover:text-travel-ink hover:scale-105 active:scale-95 motion-reduce:transition-none motion-reduce:transform-none"
                  onClick={() => onComment?.(post)}
                  size="sm"
                  variant="ghost"
                >
                  <MessageCircle size={16} />
                  {post.commentCount || ''}
                </Button>
                <Button
                  className="text-travel-muted transition-colors transition-transform duration-200 ease-standard hover:text-travel-ink hover:scale-105 active:scale-95 motion-reduce:transition-none motion-reduce:transform-none"
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
