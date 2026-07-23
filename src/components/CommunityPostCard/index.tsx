import { useState } from 'react'
import type { CommunityPost } from '@/types/community'
import { CommentOutlined, DeleteOutlined, HeartFilled, HeartOutlined, RetweetOutlined } from '@ant-design/icons'
import { Button, Tag } from 'antd'
import { Link } from 'react-router-dom'

import { CommunityImageGrid } from '@/components/CommunityImageGrid'
import { CommunityItineraryPreview } from '@/components/CommunityItineraryPreview'

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
  if (Number.isNaN(date.getTime()))
    return value

  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getPostExcerpt(content: string) {
  if (content.length <= 140)
    return content
  return `${content.slice(0, 140)}...`
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
    ? `${post.author.username} 转发了 ${post.originalPost.author.username} 的旅行分享`
    : post.author.username

  // 点赞动画状态
  const [isLikeAnimating, setIsLikeAnimating] = useState(false)

  const handleLike = () => {
    if (!post.likedByMe) {
      setIsLikeAnimating(true)
      setTimeout(() => setIsLikeAnimating(false), 600)
    }
    onLike?.(post)
  }

  return (
    <article className="community-post-card travel-surface-card travel-ticket-edge" aria-labelledby={`community-post-${post.id}`}>
      <header className="community-post-card__header">
        <Link className="community-post-card__avatar" to={`/community?authorId=${post.author.id}`} aria-label={`查看${post.author.username}的分享`}>
          {post.author.username.slice(0, 1).toUpperCase()}
        </Link>
        <div className="community-post-card__author">
          <p>{displayAuthor}</p>
          <span>{formatTime(post.createdAt)}</span>
        </div>
        {post.city ? <Tag className="travel-tag travel-tag--info">{post.city}</Tag> : null}
      </header>

      <Link className="community-post-card__body" to={`/community/${post.id}`}>
        {post.title ? <h2 id={`community-post-${post.id}`}>{post.title}</h2> : <h2 id={`community-post-${post.id}`} className="sr-only">旅行分享</h2>}
        {post.content ? <p>{getPostExcerpt(post.content)}</p> : null}
      </Link>

      <CommunityImageGrid images={post.images} compact />

      {post.itinerarySnapshot ? <CommunityItineraryPreview snapshot={post.itinerarySnapshot} /> : null}

      {post.originalPost
        ? (
            <Link className="community-post-card__quote" to={`/community/${post.originalPost.id}`}>
              <span>原帖</span>
              <strong>{post.originalPost.title || `${post.originalPost.city || '旅行'}分享`}</strong>
              <p>{post.originalPost.content || '这是一条行程分享。'}</p>
            </Link>
          )
        : post.postType === 'repost'
          ? <div className="community-post-card__quote community-post-card__quote--missing">原帖已删除</div>
          : null}

      <footer className="community-post-card__actions" aria-label="帖子操作">
        <Button
          type="text"
          className={`community-post-card__like-btn ${post.likedByMe ? 'community-post-card__like-btn--liked' : ''} ${isLikeAnimating ? 'community-post-card__like-btn--animating' : ''}`}
          icon={post.likedByMe ? <HeartFilled aria-hidden="true" /> : <HeartOutlined aria-hidden="true" />}
          loading={likePending}
          aria-label={post.likedByMe ? '取消点赞' : '点赞'}
          aria-pressed={post.likedByMe}
          onClick={handleLike}
        >
          {post.likeCount}
        </Button>
        <Button
          type="text"
          icon={<CommentOutlined aria-hidden="true" />}
          aria-label="查看评论"
          onClick={() => onComment?.(post)}
        >
          {post.commentCount}
        </Button>
        <Button
          type="text"
          icon={<RetweetOutlined aria-hidden="true" />}
          loading={repostPending}
          aria-label="转发帖子"
          onClick={() => onRepost?.(post)}
        >
          {post.repostCount}
        </Button>
        {isAuthor
          ? (
              <Button
                type="text"
                danger
                icon={<DeleteOutlined aria-hidden="true" />}
                loading={deletePending}
                aria-label="删除帖子"
                onClick={() => onDelete?.(post)}
              >
                删除
              </Button>
            )
          : null}
      </footer>
    </article>
  )
}
