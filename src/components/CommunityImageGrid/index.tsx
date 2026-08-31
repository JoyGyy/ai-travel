'use client'

import type { CommunityImage } from '@/types/community'
import Image from 'next/image'

import { useEffect, useRef, useState } from 'react'

interface CommunityImageGridProps {
  compact?: boolean
  images?: CommunityImage[]
}

const EMPTY_IMAGES: CommunityImage[] = []

export function CommunityImageGrid({ compact = false, images = EMPTY_IMAGES }: CommunityImageGridProps) {
  const safeImages = Array.isArray(images) ? images : EMPTY_IMAGES
  const [previewIndex, setPreviewIndex] = useState<null | number>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  // 预览打开时聚焦到对话框容器
  useEffect(() => {
    if (previewIndex !== null && dialogRef.current) {
      dialogRef.current.focus()
    }
  }, [previewIndex])

  // ESC 键关闭预览
  useEffect(() => {
    if (previewIndex === null)
      return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewIndex(null)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [previewIndex])

  if (safeImages.length === 0)
    return null

  const visibleImages = safeImages.slice(0, 9)

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

  const gridClasses = getGridClasses(visibleImages.length, compact)
  const imageAspectClasses = getImageAspectClasses(visibleImages.length, compact)

  return (
    <>
      <div className={`${gridClasses} overflow-hidden`}>
        {visibleImages.map((image, index) => (
          <button
            className={`w-full bg-travel-sand/18 ${imageAspectClasses}`}
            key={image.id || image.storageKey || image.url}
            onClick={() => handlePreview(index)}
            type="button"
          >
            <Image
              alt={image.altText || '旅行分享图片'}
              className="block h-full w-full object-cover"
              height={200}
              loading="lazy"
              sizes="(max-width: 640px) 33vw, 200px"
              src={image.url}
              width={200}
            />
          </button>
        ))}
      </div>

      {/* 图片预览模态框 */}
      {previewIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={handleClose}
          ref={dialogRef}
        >
          <button
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-3xl text-white backdrop-blur-sm transition-colors hover:bg-white/30 motion-reduce:transition-none"
            onClick={handleClose}
            type="button"
          >
            &times;
          </button>
          {previewIndex > 0 && (
            <button
              className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-3xl text-white backdrop-blur-sm transition-colors hover:bg-white/30 motion-reduce:transition-none"
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
            className="max-h-[80vh] max-w-[90vw] object-contain"
            height={600}
            sizes="90vw"
            src={visibleImages[previewIndex].url}
            width={800}
          />
          {previewIndex < visibleImages.length - 1 && (
            <button
              className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-3xl text-white backdrop-blur-sm transition-colors hover:bg-white/30 motion-reduce:transition-none"
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

/** 根据图片数量和 compact 模式决定网格列数和最大宽度 */
function getGridClasses(count: number, compact: boolean) {
  const base = compact
    ? 'gap-1.5 rounded-lg max-sm:gap-1.5'
    : 'gap-2.5 rounded-lg max-sm:gap-1.5'

  if (count === 1) {
    return `grid grid-cols-1 max-w-[520px] ${base}`
  }
  if (count === 2 || count === 4) {
    return `grid grid-cols-2 max-w-[560px] ${base}`
  }
  return `grid grid-cols-3 ${base}`
}

/** 根据图片数量和 compact 模式决定图片宽高比 */
function getImageAspectClasses(count: number, compact: boolean) {
  if (compact)
    return 'aspect-[4/3]'
  if (count === 1)
    return 'aspect-[16/10]'
  return 'aspect-square'
}
