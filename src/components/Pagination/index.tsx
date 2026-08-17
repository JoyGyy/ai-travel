/**
 * 分页组件
 * 提取自社区列表页、详情页和景点列表页的重复代码
 */
'use client'

import { Button } from '@/components/ui/button'

interface PaginationProps {
  /** 额外的 CSS 类名 */
  className?: string
  /** 页码变化回调 */
  onPageChange: (page: number) => void
  /** 当前页码（从 1 开始） */
  page: number
  /** 每页条数 */
  pageSize: number
  /** 总条数 */
  total: number
}

/**
 * 分页组件
 * 提供上一页/下一页按钮和页码显示
 */
export function Pagination({
  className = '',
  onPageChange,
  page,
  pageSize,
  total,
}: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize)

  if (totalPages <= 1)
    return null

  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <Button disabled={page <= 1} onClick={() => onPageChange(page - 1)} variant="outline">
        上一页
      </Button>
      <span className="text-sm text-muted-foreground">
        第
        {' '}
        {page}
        {' '}
        页，共
        {' '}
        {totalPages}
        {' '}
        页
      </span>
      <Button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        variant="outline"
      >
        下一页
      </Button>
    </div>
  )
}
