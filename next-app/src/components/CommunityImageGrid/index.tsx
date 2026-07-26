import type { CommunityImage } from '@/types/community'
import { Image } from 'antd'

import './style.css'

interface CommunityImageGridProps {
  images: CommunityImage[]
  compact?: boolean
}

export function CommunityImageGrid({ images, compact = false }: CommunityImageGridProps) {
  if (images.length === 0)
    return null

  const visibleImages = images.slice(0, 9)

  return (
    <Image.PreviewGroup>
      <div className={`community-image-grid community-image-grid--count-${visibleImages.length} ${compact ? 'community-image-grid--compact' : ''}`}>
        {visibleImages.map(image => (
          <Image
            key={image.id || image.storageKey || image.url}
            className="community-image-grid__image"
            src={image.url}
            alt={image.altText || '旅行分享图片'}
            loading="lazy"
            preview={{ mask: '预览图片' }}
          />
        ))}
      </div>
    </Image.PreviewGroup>
  )
}
