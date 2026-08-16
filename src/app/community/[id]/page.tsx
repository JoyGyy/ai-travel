'use client'

import { ArrowLeft, Heart, Repeat2, Send, Share2, Trash2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import type { CommunityComment, CommunityPost } from '@/types/community'

import {
  createCommunityComment,
  deleteCommunityComment,
  deleteCommunityPost,
  fetchCommunityComments,
  fetchCommunityPost,
} from '@/api/community'
import { CommunityImageGrid } from '@/components/CommunityImageGrid'
import { CommunityItineraryPreview } from '@/components/CommunityItineraryPreview'
import { CommunityPostCard } from '@/components/CommunityPostCard'
import { Pagination } from '@/components/Pagination'
import { RepostModal } from '@/components/RepostModal'
import { Button } from '@/components/ui/button'
import { useAppToast } from '@/hooks/useAppToast'
import { useCommunityActions } from '@/hooks/useCommunityActions'
import { formatRelativeTime } from '@/lib/utils/date'

const COMMENT_PAGE_SIZE = 20

export default function CommunityPostDetail() {
  const params = useParams()
  const id = (params?.id as string) || ''
  const router = useRouter()
  const toast = useAppToast()

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
  const [repostPending, setRepostPending] = useState(false)
  const [isLikeAnimating, setIsLikeAnimating] = useState(false)

  const { hasHydrated, requireLogin, submitRepost, toggleLike, user } = useCommunityActions({
    onLikeSuccess: (_postId, likedByMe, likeCount) => {
      if (post) {
        setPost({ ...post, likeCount, likedByMe })
      }
    },
  })

  useEffect(() => {
    let cancelled = false
    async function loadPost() {
      setLoading(true)
      setError('')
      try {
        const data = await fetchCommunityPost(id)
        if (!cancelled) setPost(data)
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : '帖子加载失败')
      } finally {
        if (!cancelled) setLoading(false)
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
      if (!id) return
      setCommentsLoading(true)
      try {
        const data = await fetchCommunityComments(id, {
          page: commentPage,
          pageSize: COMMENT_PAGE_SIZE,
        })
        if (!cancelled) {
          setComments(data.items)
          setCommentTotal(data.total)
        }
      } catch (err: unknown) {
        if (!cancelled) toast.error(err instanceof Error ? err.message : '评论加载失败')
      } finally {
        if (!cancelled) setCommentsLoading(false)
      }
    }
    loadComments()
    return () => {
      cancelled = true
    }
  }, [commentPage, id, toast])

  // requireLogin, toggleLike, submitRepost 已从 useCommunityActions hook 获取

  async function handleLike() {
    if (!post) return

    if (!post.likedByMe) {
      setIsLikeAnimating(true)
      setTimeout(() => setIsLikeAnimating(false), 600)
    }

    setLikePending(true)
    try {
      await toggleLike(post.id, post.likedByMe)
    } finally {
      setLikePending(false)
    }
  }

  async function submitComment() {
    if (!post || !requireLogin('评论')) return

    const content = commentInput.trim()
    if (!content) {
      toast.info('请输入评论内容')
      return
    }

    setCommentSubmitting(true)
    try {
      const result = await createCommunityComment(post.id, { content })
      setComments((prev) => (commentPage === 1 ? [...prev, result.comment] : prev))
      setCommentTotal(result.commentCount)
      setPost({ ...post, commentCount: result.commentCount })
      setCommentInput('')
      toast.success('评论已发布')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '评论发布失败')
    } finally {
      setCommentSubmitting(false)
    }
  }

  async function removeComment(comment: CommunityComment) {
    setDeletePendingId(comment.id)
    try {
      await deleteCommunityComment(comment.id)
      setComments((prev) => prev.filter((item) => item.id !== comment.id))
      setCommentTotal((prev) => Math.max(0, prev - 1))
      if (post) setPost({ ...post, commentCount: Math.max(0, post.commentCount - 1) })
      toast.success('评论已删除')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '删除评论失败')
    } finally {
      setDeletePendingId('')
    }
  }

  async function removePost() {
    if (!post) return

    setPostDeletePending(true)
    try {
      await deleteCommunityPost(post.id)
      toast.success('帖子已删除')
      router.push('/community')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '删除帖子失败')
    } finally {
      setPostDeletePending(false)
    }
  }

  async function handleSubmitRepost(content: string) {
    if (!post) return false

    setRepostPending(true)
    try {
      const success = await submitRepost(post.id, content)
      if (success) {
        setRepostOpen(false)
        router.push('/community')
      }
      return success
    } finally {
      setRepostPending(false)
    }
  }

  async function shareLink() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          text: post?.content || '看看这条旅行分享',
          title: post?.title || '旅行社区分享',
          url,
        })
        return
      } catch {
        // 用户取消系统分享时降级复制链接
      }
    }
    await navigator.clipboard.writeText(url)
    toast.success('链接已复制')
  }

  if (loading) {
    return (
      <main
        aria-labelledby="community-detail-loading"
        className="travel-page-shell gap-6"
      >
        <div
          aria-live="polite"
          className="grid min-h-[260px] place-items-center gap-3 rounded-[28px] p-[26px] text-center"
          role="status"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          <h1 className="text-xl font-bold text-travel-ink" id="community-detail-loading">
            加载旅行分享中...
          </h1>
        </div>
      </main>
    )
  }

  if (error || !post) {
    return (
      <main aria-labelledby="community-detail-error" className="travel-page-shell gap-6">
        <div className="grid min-h-[260px] place-items-center gap-3 rounded-[28px] p-[26px] text-center" role="alert">
          <h1 className="text-xl font-bold text-travel-ink" id="community-detail-error">
            帖子暂时无法打开
          </h1>
          <p className="text-travel-muted">{error || '帖子不存在或已删除'}</p>
          <div className="flex gap-3">
            <Button onClick={() => setReloadKey((prev) => prev + 1)}>重试</Button>
            <Button onClick={() => router.push('/community')}>返回社区</Button>
          </div>
        </div>
      </main>
    )
  }

  const isAuthor = user?.id === post.author.id

  return (
    <main aria-labelledby="community-detail-title" className="travel-page-shell gap-6">
      {/* 页面进入动画 */}
      <style jsx global>{`
        @keyframes detailFadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .community-detail > * {
          animation: detailFadeIn 0.5s ease-out backwards;
        }
        .community-detail > *:nth-child(1) { animation-delay: 0s; }
        .community-detail > *:nth-child(2) { animation-delay: 0.1s; }
        .community-detail > *:nth-child(3) { animation-delay: 0.2s; }
        .community-detail > *:nth-child(4) { animation-delay: 0.3s; }
      `}</style>

      <button
        className="inline-flex w-fit items-center gap-2 rounded-full bg-white/78 px-4 py-2.5 text-sm font-extrabold text-travel-ink shadow-sm transition-all hover:-translate-x-1 hover:text-accent hover:shadow-md"
        onClick={() => router.back()}
        type="button"
      >
        <ArrowLeft aria-hidden="true" />
        返回
      </button>

      <section className="travel-surface-card travel-ticket-edge grid gap-[18px] rounded-[28px] p-[26px]">
        <header className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="grid h-12 w-12 place-items-center rounded-full bg-primary text-lg font-bold text-white"
          >
            {post.author.username.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-travel-ink">{post.author.username}</p>
            <span className="text-sm text-travel-muted">{formatRelativeTime(post.createdAt)}</span>
          </div>
        </header>

        <h1 className="text-2xl font-bold text-travel-ink" id="community-detail-title">
          {post.title || `${post.city || '旅行'}分享`}
        </h1>

        {post.content ? (
          <p className="whitespace-pre-wrap leading-relaxed text-travel-ink">{post.content}</p>
        ) : null}

        <CommunityImageGrid images={post.images} />

        {post.itinerarySnapshot ? (
          <CommunityItineraryPreview mode="detail" snapshot={post.itinerarySnapshot} />
        ) : null}

        {post.originalPost ? (
          <CommunityPostCard post={{ ...post.originalPost, originalPost: null }} />
        ) : post.postType === 'repost' ? (
          <div className="rounded-xl bg-muted/50 p-4 text-center text-travel-muted">
            原帖已删除
          </div>
        ) : null}

        <div aria-label="帖子操作" className="flex flex-wrap gap-2">
          <Button
            aria-pressed={post.likedByMe}
            className={`${post.likedByMe ? 'text-primary' : ''} ${isLikeAnimating ? 'animate-bounce' : ''}`}
            disabled={likePending}
            onClick={handleLike}
            variant="outline"
          >
            <Heart
              aria-hidden="true"
              className={`mr-1 h-4 w-4 ${post.likedByMe ? 'fill-current' : ''}`}
            />
            {likePending ? '...' : post.likeCount}
          </Button>
          <Button
            disabled={!hasHydrated}
            onClick={() => (requireLogin('转发') ? setRepostOpen(true) : undefined)}
            variant="outline"
          >
            <Repeat2 aria-hidden="true" className="mr-1 h-4 w-4" />
            {!hasHydrated ? '加载中...' : `转发 · ${post.repostCount}`}
          </Button>
          <Button onClick={shareLink} variant="outline">
            <Share2 aria-hidden="true" className="mr-1 h-4 w-4" />
            分享链接
          </Button>
          {isAuthor ? (
            <Button disabled={postDeletePending} onClick={removePost} variant="destructive">
              <Trash2 aria-hidden="true" className="mr-1 h-4 w-4" />
              {postDeletePending ? '删除中...' : '删除帖子'}
            </Button>
          ) : null}
        </div>
      </section>

      <section
        aria-labelledby="community-comments-title"
        className="travel-surface-card grid gap-[18px] rounded-[28px] p-[26px]"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-travel-ink" id="community-comments-title">
            评论
          </h2>
          <span className="text-sm text-travel-muted">{commentTotal} 条</span>
        </div>

        <div className="grid gap-3">
          <textarea
            className="flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            maxLength={500}
            onChange={(event) => setCommentInput(event.target.value)}
            placeholder="写下你的建议、问题或补充体验"
            rows={4}
            value={commentInput}
          />
          <Button disabled={!hasHydrated || commentSubmitting} onClick={submitComment}>
            <Send aria-hidden="true" className="mr-1 h-4 w-4" />
            {!hasHydrated ? '加载中...' : commentSubmitting ? '发布中...' : '发布评论'}
          </Button>
        </div>

        {commentsLoading ? (
          <div className="flex items-center justify-center gap-3 py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            <span className="text-travel-muted">加载评论中...</span>
          </div>
        ) : null}

        {!commentsLoading && comments.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>还没有评论，来写第一条吧</p>
          </div>
        ) : null}

        {!commentsLoading && comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <article className="grid gap-2 rounded-xl border p-4" key={comment.id}>
                <div className="flex items-center gap-2">
                  <strong className="text-sm font-semibold text-travel-ink">
                    {comment.author.username}
                  </strong>
                  <span className="text-xs text-travel-muted">
                    {formatRelativeTime(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-travel-ink">{comment.content}</p>
                {comment.author.id === user?.id ? (
                  <Button
                    className="justify-self-start text-destructive"
                    disabled={deletePendingId === comment.id}
                    onClick={() => removeComment(comment)}
                    size="sm"
                    variant="link"
                  >
                    {deletePendingId === comment.id ? '删除中...' : '删除'}
                  </Button>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}

        <Pagination
          className="flex justify-center"
          onPageChange={setCommentPage}
          page={commentPage}
          pageSize={COMMENT_PAGE_SIZE}
          total={commentTotal}
        />
      </section>

      <RepostModal
        icon="link"
        onClose={() => setRepostOpen(false)}
        onSubmit={handleSubmitRepost}
        open={repostOpen}
        pending={repostPending}
        targetTitle={post.title || post.content || `${post.city || '旅行'}分享`}
      />
    </main>
  )
}
