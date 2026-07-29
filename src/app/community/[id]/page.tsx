'use client'

import type { CommunityComment, CommunityPost } from '@/types/community'

import { ArrowLeft, Trash2, Heart, Link, Repeat2, Send, Share2 } from 'lucide-react'
// Antd 组件已迁移
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import {
  createCommunityComment,
  deleteCommunityComment,
  deleteCommunityPost,
  fetchCommunityComments,
  fetchCommunityPost,
  likeCommunityPost,
  repostCommunityPost,
  unlikeCommunityPost,
} from '@/api/community'
import { CommunityImageGrid } from '@/components/CommunityImageGrid'
import { CommunityItineraryPreview } from '@/components/CommunityItineraryPreview'
import { CommunityPostCard } from '@/components/CommunityPostCard'
import { useAppToast } from '@/hooks/useAppToast'
import { useAuthStore } from '@/stores/auth'

import './style.css'

const COMMENT_PAGE_SIZE = 20

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime()))
    return value
  return date.toLocaleString('zh-CN')
}

export default function CommunityPostDetail() {
  const params = useParams()
  const id = (params?.id as string) || ''
  const router = useRouter()
  const toast = useAppToast()
  const user = useAuthStore(state => state.user)
  const hasHydrated = useAuthStore(state => state._hasHydrated)

  const [post, setPost] = useState<CommunityPost | null>(null)
  const [comments, setComments] = useState<CommunityComment[]>([])
  const [commentTotal, setCommentTotal] = useState(0)
  const [commentPage, setCommentPage] = useState(1)
  const [commentInput, setCommentInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [likePending, setLikePending] = useState(false)
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [deletePendingId, setDeletePendingId] = useState('')
  const [postDeletePending, setPostDeletePending] = useState(false)
  const [repostOpen, setRepostOpen] = useState(false)
  const [repostContent, setRepostContent] = useState('')
  const [repostPending, setRepostPending] = useState(false)
  const [isLikeAnimating, setIsLikeAnimating] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadPost() {
      setLoading(true)
      setError('')
      try {
        const data = await fetchCommunityPost(id)
        if (!cancelled)
          setPost(data)
      }
      catch (err: unknown) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : '帖子加载失败')
      }
      finally {
        if (!cancelled)
          setLoading(false)
      }
    }
    loadPost()
    return () => {
      cancelled = true
    }
  }, [id, reloadKey])

  useEffect(() => {
    let cancelled = false
    async function loadComments() {
      if (!id)
        return
      setCommentsLoading(true)
      try {
        const data = await fetchCommunityComments(id, { page: commentPage, pageSize: COMMENT_PAGE_SIZE })
        if (!cancelled) {
          setComments(data.items)
          setCommentTotal(data.total)
        }
      }
      catch (err: unknown) {
        if (!cancelled)
          toast.error(err instanceof Error ? err.message : '评论加载失败')
      }
      finally {
        if (!cancelled)
          setCommentsLoading(false)
      }
    }
    loadComments()
    return () => {
      cancelled = true
    }
  }, [commentPage, id, message])

  function requireLogin(action: string) {
    if (!hasHydrated) {
      toast.loading('正在恢复登录状态...')
      return false
    }
    if (!user) {
      toast.info(`请先登录后${action}`)
      router.push('/login')
      return false
    }
    return true
  }

  async function toggleLike() {
    if (!post || !requireLogin('点赞'))
      return

    if (!post.likedByMe) {
      setIsLikeAnimating(true)
      setTimeout(() => setIsLikeAnimating(false), 600)
    }

    setLikePending(true)
    try {
      const result = post.likedByMe ? await unlikeCommunityPost(post.id) : await likeCommunityPost(post.id)
      setPost({ ...post, likedByMe: result.likedByMe, likeCount: result.likeCount })
      toast.success(result.likedByMe ? '已点赞' : '已取消点赞')
    }
    catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '点赞失败')
    }
    finally {
      setLikePending(false)
    }
  }

  async function submitComment() {
    if (!post || !requireLogin('评论'))
      return

    const content = commentInput.trim()
    if (!content) {
      toast.warning('请输入评论内容')
      return
    }

    setCommentSubmitting(true)
    try {
      const result = await createCommunityComment(post.id, { content })
      setComments(prev => commentPage === 1 ? [...prev, result.comment] : prev)
      setCommentTotal(result.commentCount)
      setPost({ ...post, commentCount: result.commentCount })
      setCommentInput('')
      toast.success('评论已发布')
    }
    catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '评论发布失败')
    }
    finally {
      setCommentSubmitting(false)
    }
  }

  async function removeComment(comment: CommunityComment) {
    setDeletePendingId(comment.id)
    try {
      await deleteCommunityComment(comment.id)
      setComments(prev => prev.filter(item => item.id !== comment.id))
      setCommentTotal(prev => Math.max(0, prev - 1))
      if (post)
        setPost({ ...post, commentCount: Math.max(0, post.commentCount - 1) })
      toast.success('评论已删除')
    }
    catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '删除评论失败')
    }
    finally {
      setDeletePendingId('')
    }
  }

  async function removePost() {
    if (!post)
      return

    setPostDeletePending(true)
    try {
      await deleteCommunityPost(post.id)
      toast.success('帖子已删除')
      router.push('/community')
    }
    catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '删除帖子失败')
    }
    finally {
      setPostDeletePending(false)
    }
  }

  async function submitRepost() {
    if (!post || !requireLogin('转发'))
      return

    setRepostPending(true)
    try {
      const repost = await repostCommunityPost(post.id, repostContent.trim())
      toast.success('已转发到社区')
      setRepostOpen(false)
      router.push(`/community/${repost.id}`)
    }
    catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '转发失败')
    }
    finally {
      setRepostPending(false)
    }
  }

  async function shareLink() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: post?.title || '旅行社区分享', text: post?.content || '看看这条旅行分享', url })
        return
      }
      catch {
        // 用户取消系统分享时降级复制链接
      }
    }
    await navigator.clipboard.writeText(url)
    toast.success('链接已复制')
  }

  if (loading) {
    return (
      <main className="community-detail travel-page-shell" aria-labelledby="community-detail-loading">
        <div className="community-detail__state travel-surface-card" role="status" aria-live="polite">
          <Spin />
          <h1 id="community-detail-loading">加载旅行分享中...</h1>
        </div>
      </main>
    )
  }

  if (error || !post) {
    return (
      <main className="community-detail travel-page-shell" aria-labelledby="community-detail-error">
        <div className="community-detail__state travel-surface-card" role="alert">
          <h1 id="community-detail-error">帖子暂时无法打开</h1>
          <p>{error || '帖子不存在或已删除'}</p>
          <div className="community-detail__state-actions">
            <Button type="primary" onClick={() => setReloadKey(prev => prev + 1)}>重试</Button>
            <Button onClick={() => router.push('/community')}>返回社区</Button>
          </div>
        </div>
      </main>
    )
  }

  const isAuthor = user?.id === post.author.id

  return (
    <main className="community-detail travel-page-shell" aria-labelledby="community-detail-title">
      <button type="button" className="community-detail__back" onClick={() => router.back()}>
        <ArrowLeft aria-hidden="true" />
        返回
      </button>

      <section className="community-detail__post travel-surface-card travel-ticket-edge">
        <header className="community-detail__header">
          <div className="community-detail__avatar" aria-hidden="true">{post.author.username.slice(0, 1).toUpperCase()}</div>
          <div>
            <p>{post.author.username}</p>
            <span>{formatTime(post.createdAt)}</span>
          </div>
        </header>
        <h1 id="community-detail-title">{post.title || `${post.city || '旅行'}分享`}</h1>
        {post.content ? <p className="community-detail__content">{post.content}</p> : null}
        <CommunityImageGrid images={post.images} />
        {post.itinerarySnapshot ? <CommunityItineraryPreview snapshot={post.itinerarySnapshot} mode="detail" /> : null}
        {post.originalPost
          ? <CommunityPostCard post={{ ...post.originalPost, originalPost: null }} />
          : post.postType === 'repost'
            ? <div className="community-detail__missing travel-surface-card">原帖已删除</div>
            : null}

        <div className="community-detail__actions" aria-label="帖子操作">
          <Button
            className={`community-detail__like-btn ${post.likedByMe ? 'community-detail__like-btn--liked' : ''} ${isLikeAnimating ? 'community-detail__like-btn--animating' : ''}`}
            icon={post.likedByMe ? <Heart aria-hidden="true" /> : <Heart aria-hidden="true" />}
            loading={likePending}
            aria-pressed={post.likedByMe}
            onClick={toggleLike}
          >
            {post.likeCount}
          </Button>
          <Button icon={<Repeat2 aria-hidden="true" />} onClick={() => (requireLogin('转发') ? setRepostOpen(true) : undefined)}>
            转发
            {' '}
            ·
            {' '}
            {post.repostCount}
          </Button>
          <Button icon={<Share2 aria-hidden="true" />} onClick={shareLink}>分享链接</Button>
          {isAuthor
            ? (
                <Popconfirm title="确认删除这条帖子？" okText="删除" cancelText="取消" onConfirm={removePost}>
                  <Button danger icon={<Trash2 aria-hidden="true" />} loading={postDeletePending}>删除帖子</Button>
                </Popconfirm>
              )
            : null}
        </div>
      </section>

      <section className="community-detail__comments travel-surface-card" aria-labelledby="community-comments-title">
        <div className="community-detail__comments-header">
          <h2 id="community-comments-title">评论</h2>
          <span>
            {commentTotal}
            {' '}
            条
          </span>
        </div>
        <div className="community-detail__comment-form">
          <Input.TextArea value={commentInput} rows={4} maxLength={500} showCount placeholder="写下你的建议、问题或补充体验" onChange={event => setCommentInput(event.target.value)} />
          <Button type="primary" icon={<Send aria-hidden="true" />} loading={commentSubmitting} onClick={submitComment}>发布评论</Button>
        </div>

        {commentsLoading
          ? (
              <div className="community-detail__comments-loading">
                <Spin />
                加载评论中...
              </div>
            )
          : null}
        {!commentsLoading && comments.length === 0 ? <Empty description="还没有评论，来写第一条吧" /> : null}
        {!commentsLoading && comments.length > 0
          ? (
              <div className="community-detail__comment-list">
                {comments.map(comment => (
                  <article key={comment.id} className="community-detail__comment">
                    <div>
                      <strong>{comment.author.username}</strong>
                      <span>{formatTime(comment.createdAt)}</span>
                    </div>
                    <p>{comment.content}</p>
                    {comment.author.id === user?.id
                      ? (
                          <Button type="link" danger loading={deletePendingId === comment.id} onClick={() => removeComment(comment)}>
                            删除
                          </Button>
                        )
                      : null}
                  </article>
                ))}
              </div>
            )
          : null}
        {commentTotal > COMMENT_PAGE_SIZE
          ? <Pagination current={commentPage} pageSize={COMMENT_PAGE_SIZE} total={commentTotal} onChange={setCommentPage} />
          : null}
      </section>

      <Modal title="转发旅行分享" open={repostOpen} okText="转发" cancelText="取消" confirmLoading={repostPending} onOk={submitRepost} onCancel={() => setRepostOpen(false)}>
        <p className="community-detail__modal-intro">可以直接转发，也可以写一句给旅友的补充说明。</p>
        <Input.TextArea value={repostContent} rows={4} maxLength={500} showCount placeholder="写一句转发附言" onChange={event => setRepostContent(event.target.value)} />
        <div className="community-detail__modal-target">
          <Link aria-hidden="true" />
          <span>{post.title || post.content || `${post.city || '旅行'}分享`}</span>
        </div>
      </Modal>
    </main>
  )
}
