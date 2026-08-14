'use client'

import Image from 'next/image'
import { useState } from 'react'

import type { CommunityImage } from '@/types/community'

import './style.css'

interface CommunityImageGridProps {
  compact?: boolean
  images: CommunityImage[]
}

export function CommunityImageGrid({ compact = false, images }: CommunityImageGridProps) {
  const [previewIndex, setPreviewIndex] = useState<null | number>(null)

  if (images.length === 0) return null

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
      <div
        className={`community-image-grid community-image-grid--count-${visibleImages.length} ${compact ? 'community-image-grid--compact' : ''}`}
      >
        {visibleImages.map((image, index) => (
          <button
            className="community-image-grid__image"
            key={image.id || image.storageKey || image.url}
            onClick={() => handlePreview(index)}
            type="button"
          >
            <Image
              alt={image.altText || '旅行分享图片'}
              height={200}
              loading="lazy"
              src={image.url}
              unoptimized
              width={200}
            />
          </button>
        ))}
      </div>

      {/* 图片预览模态框 */}
      {previewIndex !== null && (
        <div className="community-image-grid__preview" onClick={handleClose}>
          <button
            aria-label="关闭预览"
            className="community-image-grid__close"
            onClick={handleClose}
            type="button"
          >
            &times;
          </button>
          {previewIndex > 0 && (
            <button
              aria-label="上一张"
              className="community-image-grid__prev"
              onClick={(e) => {
                e.stopPropagation()
                handlePrev()
              }}
              type="button"
            >
              &#8249;
            </button>
          )}
          <Image
            alt={visibleImages[previewIndex].altText || '旅行分享图片'}
            height={600}
            src={visibleImages[previewIndex].url}
            unoptimized
            width={800}
          />
          {previewIndex < visibleImages.length - 1 && (
            <button
              aria-label="下一张"
              className="community-image-grid__next"
              onClick={(e) => {
                e.stopPropagation()
                handleNext()
              }}
              type="button"
            >
              &#8250;
            </button>
          )}
        </div>
      )}
    </>
  )
}
