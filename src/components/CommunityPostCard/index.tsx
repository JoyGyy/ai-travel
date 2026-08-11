'use client'

import type { CommunityPost } from '@/types/community'

import { Heart, MapPin, MessageCircle, Repeat2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'

import { CommunityImageGrid } from '@/components/CommunityImageGrid'
import { CommunityItineraryPreview } from '@/components/CommunityItineraryPreview'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

import './style.css'

interface CommunityPostCardProps {
  post: CommunityPost
  currentUserId?: string
  likePending?: boolean
  repostPending?: boolean
  deletePending?: boolean
  onLike?: (post: CommunityPost) => void
  onComment?: (post: CommunityPost) => void
  onRepost?: (post: CommunityPost) => void
  onDelete?: (post: CommunityPost) => void
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

  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

function getPostExcerpt(content: string) {
  if (content.length <= 80) return content
  return `${content.slice(0, 80)}...`
}

export const CommunityPostCard = React.memo(function CommunityPostCard({
  post,
  currentUserId,
  likePending = false,
  repostPending = false,
  deletePending = false,
  onLike,
  onComment,
  onRepost,
  onDelete,
}: CommunityPostCardProps) {
  const isAuthor = currentUserId === post.author.id
  const displayAuthor =
    post.postType === 'repost' && post.originalPost
      ? `${post.author.username} 转发了 ${post.originalPost.author.username}`
      : post.author.username

  const [isLikeAnimating, setIsLikeAnimating] = useState(false)

  const handleLike = () => {
    if (!post.likedByMe) {
      setIsLikeAnimating(true)
      setTimeout(() => setIsLikeAnimating(false), 600)
    }
    onLike?.(post)
  }

  const hasImages = post.images && post.images.length > 0

  return (
    <Card className={`community-post-card ${hasImages ? 'community-post-card--has-images' : ''}`}>
      <CardContent className="p-0">
        {/* 图片区域 - 占主要面积 */}
        {hasImages && (
          <Link href={`/community/${post.id}`} className="community-post-card__image-wrapper">
            <CommunityImageGrid images={post.images} compact />
          </Link>
        )}

        {/* 内容区域 */}
        <div className="community-post-card__content">
          {/* 用户信息 */}
          <div className="community-post-card__meta">
            <Link
              href={`/community?authorId=${post.author.id}`}
              className="community-post-card__user"
            >
              <Avatar className="community-post-card__avatar h-7 w-7">
                <AvatarFallback>{post.author.username.slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="community-post-card__username font-semibold">{displayAuthor}</span>
            </Link>
            <span className="community-post-card__time text-muted-foreground">
              {formatTime(post.createdAt)}
            </span>
          </div>

          {/* 标题和内容 */}
          <Link href={`/community/${post.id}`} className="community-post-card__body">
            {post.title && <p className="community-post-card__title line-clamp-2">{post.title}</p>}
            {post.content && (
              <p className="community-post-card__excerpt line-clamp-2 text-muted-foreground">
                {getPostExcerpt(post.content)}
              </p>
            )}
          </Link>

          {/* 城市标签 */}
          {post.city && (
            <Badge variant="secondary" className="community-post-card__city">
              <MapPin size={12} className="mr-1" />
              {post.city}
            </Badge>
          )}

          {/* 行程预览（紧凑模式） */}
          {post.itinerarySnapshot && (
            <div className="community-post-card__itinerary">
              <CommunityItineraryPreview snapshot={post.itinerarySnapshot} />
            </div>
          )}

          {/* 原帖引用 */}
          {post.originalPost && (
            <Link
              href={`/community/${post.originalPost.id}`}
              className="community-post-card__quote"
            >
              <span className="community-post-card__quote-label text-muted-foreground">原帖</span>
              <span className="font-semibold truncate">
                {post.originalPost.title || `${post.originalPost.city || '旅行'}分享`}
              </span>
            </Link>
          )}
          {post.postType === 'repost' && !post.originalPost && (
            <span className="community-post-card__quote-missing text-muted-foreground">
              原帖已删除
            </span>
          )}

          {/* 操作栏 */}
          <div className="community-post-card__actions">
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={`community-post-card__action-btn ${post.likedByMe ? 'community-post-card__action-btn--liked' : ''} ${isLikeAnimating ? 'community-post-card__action-btn--animating' : ''}`}
                disabled={likePending}
                onClick={handleLike}
              >
                <Heart size={16} className={post.likedByMe ? 'fill-current' : ''} />
                {post.likeCount || ''}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onComment?.(post)}>
                <MessageCircle size={16} />
                {post.commentCount || ''}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={repostPending}
                onClick={() => onRepost?.(post)}
              >
                <Repeat2 size={16} />
                {post.repostCount || ''}
              </Button>
            </div>

            {isAuthor && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                disabled={deletePending}
                onClick={() => onDelete?.(post)}
              >
                <Trash2 size={16} />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
