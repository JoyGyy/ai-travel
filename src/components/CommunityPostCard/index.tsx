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

import './style.css'

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
      <Card className={`community-post-card ${hasImages ? 'community-post-card--has-images' : ''}`}>
        <CardContent className="p-0">
          {/* 图片区域 - 占主要面积 */}
          {hasImages && (
            <Link className="community-post-card__image-wrapper" href={`/community/${post.id}`}>
              <CommunityImageGrid compact images={post.images} />
            </Link>
          )}

          {/* 内容区域 */}
          <div className="community-post-card__content">
            {/* 用户信息 */}
            <div className="community-post-card__meta">
              <Link
                className="community-post-card__user"
                href={`/community?authorId=${post.author.id}`}
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
            <Link className="community-post-card__body" href={`/community/${post.id}`}>
              {post.title && (
                <p className="community-post-card__title line-clamp-2">{post.title}</p>
              )}
              {post.content && (
                <p className="community-post-card__excerpt line-clamp-2 text-muted-foreground">
                  {getPostExcerpt(post.content)}
                </p>
              )}
            </Link>

            {/* 城市标签 */}
            {post.city && (
              <Badge className="community-post-card__city" variant="secondary">
                <MapPin className="mr-1" size={12} />
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
                className="community-post-card__quote"
                href={`/community/${post.originalPost.id}`}
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
                  className={`community-post-card__action-btn ${post.likedByMe ? 'community-post-card__action-btn--liked' : ''} ${isLikeAnimating ? 'community-post-card__action-btn--animating' : ''}`}
                  disabled={likePending}
                  onClick={handleLike}
                  size="sm"
                  variant="ghost"
                >
                  <Heart className={post.likedByMe ? 'fill-current' : ''} size={16} />
                  {post.likeCount || ''}
                </Button>
                <Button onClick={() => onComment?.(post)} size="sm" variant="ghost">
                  <MessageCircle size={16} />
                  {post.commentCount || ''}
                </Button>
                <Button
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
