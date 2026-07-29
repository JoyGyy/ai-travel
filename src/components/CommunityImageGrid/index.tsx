'use client'

import type { CommunityImage } from '@/types/community'

import { useState } from 'react'

import './style.css'

interface CommunityImageGridProps {
  images: CommunityImage[]
  compact?: boolean
}

export function CommunityImageGrid({ images, compact = false }: CommunityImageGridProps) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)

  if (images.length === 0)
    return null

  const visibleImages = images.slice(0, 9)

  const handlePreview = (index: number) => {
    setPreviewIndex(index)
  }

  const handleClose = () => {
    setPreviewIndex(null)
  }

  const handlePrev = () => {
    if (previewIndex !== null && previewIndex > 0) {
      setPreviewIndex(previewIndex - 1)
    }
  }

  const handleNext = () => {
    if (previewIndex !== null && previewIndex < visibleImages.length - 1) {
      setPreviewIndex(previewIndex + 1)
    }
  }

  return (
    <>
      <div className={`community-image-grid community-image-grid--count-${visibleImages.length} ${compact ? 'community-image-grid--compact' : ''}`}>
        {visibleImages.map((image, index) => (
          <button
            key={image.id || image.storageKey || image.url}
            type="button"
            className="community-image-grid__image"
            onClick={() => handlePreview(index)}
          >
            <img
              src={image.url}
              alt={image.altText || '旅行分享图片'}
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {/* 图片预览模态框 */}
      {previewIndex !== null && (
        <div className="community-image-grid__preview" onClick={handleClose}>
          <button type="button" className="community-image-grid__close" onClick={handleClose} aria-label="关闭预览">
            &times;
          </button>
          {previewIndex > 0 && (
            <button type="button" className="community-image-grid__prev" onClick={(e) => { e.stopPropagation(); handlePrev() }} aria-label="上一张">
              &#8249;
            </button>
          )}
          <img
            src={visibleImages[previewIndex].url}
            alt={visibleImages[previewIndex].altText || '旅行分享图片'}
          />
          {previewIndex < visibleImages.length - 1 && (
            <button type="button" className="community-image-grid__next" onClick={(e) => { e.stopPropagation(); handleNext() }} aria-label="下一张">
              &#8250;
            </button>
          )}
        </div>
      )}
    </>
  )
}
