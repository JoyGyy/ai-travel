import { useState } from 'react'
import type { CommunityPost } from '@/types/community'
import { CommentOutlined, DeleteOutlined, EnvironmentOutlined, HeartFilled, HeartOutlined, RetweetOutlined } from '@ant-design/icons'
import { Avatar, Button, Card, Space, Tag, Typography } from 'antd'
import { Link } from 'react-router-dom'

import { CommunityImageGrid } from '@/components/CommunityImageGrid'
import { CommunityItineraryPreview } from '@/components/CommunityItineraryPreview'

import './style.css'

const { Text, Paragraph } = Typography

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
  if (Number.isNaN(date.getTime()))
    return value

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

export function CommunityPostCard({
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
  const displayAuthor = post.postType === 'repost' && post.originalPost
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
    <Card
      className={`community-post-card ${hasImages ? 'community-post-card--has-images' : ''}`}
      hoverable
      styles={{
        body: { padding: 0 },
      }}
    >
      {/* 图片区域 - 占主要面积 */}
      {hasImages && (
        <Link to={`/community/${post.id}`} className="community-post-card__image-wrapper">
          <CommunityImageGrid images={post.images} compact />
        </Link>
      )}

      {/* 内容区域 */}
      <div className="community-post-card__content">
        {/* 用户信息 */}
        <div className="community-post-card__meta">
          <Link to={`/community?authorId=${post.author.id}`} className="community-post-card__user">
            <Avatar size={28} className="community-post-card__avatar">
              {post.author.username.slice(0, 1).toUpperCase()}
            </Avatar>
            <Text strong className="community-post-card__username">{displayAuthor}</Text>
          </Link>
          <Text type="secondary" className="community-post-card__time">{formatTime(post.createdAt)}</Text>
        </div>

        {/* 标题和内容 */}
        <Link to={`/community/${post.id}`} className="community-post-card__body">
          {post.title && (
            <Paragraph ellipsis={{ rows: 2 }} className="community-post-card__title">
              {post.title}
            </Paragraph>
          )}
          {post.content && (
            <Paragraph ellipsis={{ rows: 2 }} type="secondary" className="community-post-card__excerpt">
              {getPostExcerpt(post.content)}
            </Paragraph>
          )}
        </Link>

        {/* 城市标签 */}
        {post.city && (
          <Tag icon={<EnvironmentOutlined />} color="blue" className="community-post-card__city">
            {post.city}
          </Tag>
        )}

        {/* 行程预览（紧凑模式） */}
        {post.itinerarySnapshot && (
          <div className="community-post-card__itinerary">
            <CommunityItineraryPreview snapshot={post.itinerarySnapshot} />
          </div>
        )}

        {/* 原帖引用 */}
        {post.originalPost && (
          <Link to={`/community/${post.originalPost.id}`} className="community-post-card__quote">
            <Text type="secondary" className="community-post-card__quote-label">原帖</Text>
            <Text strong ellipsis>{post.originalPost.title || `${post.originalPost.city || '旅行'}分享`}</Text>
          </Link>
        )}
        {post.postType === 'repost' && !post.originalPost && (
          <Text type="secondary" className="community-post-card__quote-missing">原帖已删除</Text>
        )}

        {/* 操作栏 */}
        <div className="community-post-card__actions">
          <Space size={4}>
            <Button
              type="text"
              size="small"
              className={`community-post-card__action-btn ${post.likedByMe ? 'community-post-card__action-btn--liked' : ''} ${isLikeAnimating ? 'community-post-card__action-btn--animating' : ''}`}
              icon={post.likedByMe ? <HeartFilled /> : <HeartOutlined />}
              loading={likePending}
              onClick={handleLike}
            >
              {post.likeCount || ''}
            </Button>
            <Button
              type="text"
              size="small"
              icon={<CommentOutlined />}
              onClick={() => onComment?.(post)}
            >
              {post.commentCount || ''}
            </Button>
            <Button
              type="text"
              size="small"
              icon={<RetweetOutlined />}
              loading={repostPending}
              onClick={() => onRepost?.(post)}
            >
              {post.repostCount || ''}
            </Button>
          </Space>

          {isAuthor && (
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={deletePending}
              onClick={() => onDelete?.(post)}
            />
          )}
        </div>
      </div>
    </Card>
  )
}
