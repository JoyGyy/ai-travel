import { Card, Skeleton } from 'antd'

import './skeleton.css'

export function CommunityPostCardSkeleton() {
  return (
    <Card
      className="community-post-card-skeleton"
      styles={{ body: { padding: 0 } }}
    >
      {/* 图片占位 */}
      <div className="skeleton-image-placeholder" />

      {/* 内容区域 */}
      <div className="skeleton-content">
        {/* 用户信息 */}
        <div className="skeleton-meta">
          <Skeleton.Avatar active size={28} />
          <Skeleton.Input active size="small" style={{ width: 80, height: 16 }} />
        </div>

        {/* 标题 */}
        <Skeleton.Input active size="small" block style={{ height: 20 }} />
        <Skeleton.Input active size="small" style={{ width: '70%', height: 16 }} />

        {/* 操作栏 */}
        <div className="skeleton-actions">
          <Skeleton.Button active size="small" style={{ width: 50 }} />
          <Skeleton.Button active size="small" style={{ width: 50 }} />
          <Skeleton.Button active size="small" style={{ width: 50 }} />
        </div>
      </div>
    </Card>
  )
}
