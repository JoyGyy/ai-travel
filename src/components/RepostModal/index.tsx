/**
 * 转发弹窗组件
 * 社区列表页和详情页共享
 */
'use client'

import { Link, Repeat2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'

interface RepostModalProps {
  /** 图标类型：Repeat2 用于列表页，Link 用于详情页 */
  icon?: 'link' | 'repost'
  /** 关闭弹窗 */
  onClose: () => void
  /** 提交转发 */
  onSubmit: (content: string) => Promise<boolean>
  /** 是否显示弹窗 */
  open: boolean
  /** 转发中状态 */
  pending?: boolean
  /** 目标帖子标题或内容预览 */
  targetTitle: string
}

/**
 * 转发弹窗组件
 * 提取自社区列表页和详情页的重复代码
 */
export function RepostModal({
  icon = 'repost',
  onClose,
  onSubmit,
  open,
  pending = false,
  targetTitle,
}: RepostModalProps) {
  const [content, setContent] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)

  // 打开时聚焦对话框
  useEffect(() => {
    if (open && dialogRef.current) {
      dialogRef.current.focus()
    }
  }, [open])

  // ESC 键关闭
  useEffect(() => {
    if (!open)
      return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open)
    return null

  const handleSubmit = async () => {
    const success = await onSubmit(content)
    if (success) {
      setContent('')
      onClose()
    }
  }

  const Icon = icon === 'link' ? Link : Repeat2

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
      onClick={onClose}
      ref={dialogRef}
    >
      <div
        className="bg-background rounded-2xl p-6 max-w-lg w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">转发旅行分享</h3>
        <p className="text-muted-foreground mb-4">可以直接转发，也可以写一句给旅友的补充说明。</p>
        <textarea
          className="flex min-h-20 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm mb-4"
          maxLength={500}
          onChange={event => setContent(event.target.value)}
          placeholder="例如：这条路线适合第一次去成都的朋友"
          rows={4}
          value={content}
        />
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <Icon />
          <span>{targetTitle}</span>
        </div>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} variant="outline">
            取消
          </Button>
          <Button disabled={pending} onClick={handleSubmit}>
            {pending ? '转发中...' : '转发'}
          </Button>
        </div>
      </div>
    </div>
  )
}
