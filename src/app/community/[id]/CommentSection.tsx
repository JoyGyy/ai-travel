'use client'

/**
 * 社区帖子详情页 — 评论区组件
 */
import type { CommunityComment } from '@/types/community'

import { Send } from 'lucide-react'

import { Pagination } from '@/components/Pagination'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/utils/date'

const COMMENT_PAGE_SIZE = 20

interface CommentSectionProps {
  commentPage: number
  commentSubmitting: boolean
  commentTotal: number
  comments: CommunityComment[]
  commentsLoading: boolean
  deletePendingId: string
  hasHydrated: boolean
  input: string
  onChangePage: (page: number) => void
  onChangeInput: (value: string) => void
  onDelete: (comment: CommunityComment) => void
  onSubmit: () => void
  userId?: string
}

export function CommentSection({
  commentPage,
  commentSubmitting,
  commentTotal,
  comments,
  commentsLoading,
  deletePendingId,
  hasHydrated,
  input,
  onChangeInput,
  onChangePage,
  onDelete,
  onSubmit,
  userId,
}: CommentSectionProps) {
  return (
    <section
      className="animate-detail-fade-in [animation-delay:0.2s] travel-surface-card grid gap-[18px] rounded-[28px] p-[26px]"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-travel-ink" id="community-comments-title">
          评论
        </h2>
        <span className="text-sm text-travel-muted">
          {commentTotal}
          {' '}
          条
        </span>
      </div>

      <div className="grid gap-3">
        <textarea
          className="flex min-h-20 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          maxLength={500}
          onChange={event => onChangeInput(event.target.value)}
          placeholder="写下你的建议、问题或补充体验"
          rows={4}
          value={input}
        />
        <Button disabled={!hasHydrated || commentSubmitting} onClick={onSubmit}>
          <Send className="mr-1 h-4 w-4" />
          {!hasHydrated ? '加载中...' : commentSubmitting ? '发布中...' : '发布评论'}
        </Button>
      </div>

      {commentsLoading && (
        <div className="flex items-center justify-center gap-3 py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          <span className="text-travel-muted">加载评论中...</span>
        </div>
      )}

      {!commentsLoading && comments.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">
          <p>还没有评论，来写第一条吧</p>
        </div>
      )}

      {!commentsLoading && comments.length > 0 && (
        <div className="space-y-4">
          {comments.map(comment => (
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
              {comment.author.id === userId && (
                <Button
                  className="justify-self-start text-destructive"
                  disabled={deletePendingId === comment.id}
                  onClick={() => onDelete(comment)}
                  size="sm"
                  variant="link"
                >
                  {deletePendingId === comment.id ? '删除中...' : '删除'}
                </Button>
              )}
            </article>
          ))}
        </div>
      )}

      <Pagination
        className="flex justify-center"
        onPageChange={onChangePage}
        page={commentPage}
        pageSize={COMMENT_PAGE_SIZE}
        total={commentTotal}
      />
    </section>
  )
}
