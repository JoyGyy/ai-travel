'use client'

import type { CommunityImage, CommunityItinerarySnapshot } from '@/types/community'

import { X, ImageIcon, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useRef, useState } from 'react'

import { createCommunityPost, uploadCommunityImages } from '@/api/community'
import { CommunityImageGrid } from '@/components/CommunityImageGrid'
import { CommunityItineraryPreview } from '@/components/CommunityItineraryPreview'
import { Button } from '@/components/ui/button'
import { useAppToast } from '@/hooks/useAppToast'

import './style.css'

function isImageFile(file: File) {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
}

export default function CommunityPostCreate() {
  const router = useRouter()
  const toast = useAppToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [city, setCity] = useState('')
  const [images, setImages] = useState<CommunityImage[]>([])
  const [snapshot, setSnapshot] = useState<CommunityItinerarySnapshot | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = useMemo(() => Boolean(content.trim() || images.length > 0 || snapshot), [content, images.length, snapshot])

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return

    const file = files[0]
    if (images.length >= 9) {
      toast.info('每条分享最多上传 9 张图片')
      return
    }
    if (!isImageFile(file)) {
      toast.error('仅支持 JPG、PNG 或 WebP 图片')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('单张图片不能超过 5MB')
      return
    }

    setUploading(true)
    try {
      const uploaded = await uploadCommunityImages([file])
      setImages(prev => [...prev, ...uploaded].slice(0, 9))
      toast.success('图片上传成功')
    }
    catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '图片上传失败')
    }
    finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  function removeImage(image: CommunityImage) {
    setImages(prev => prev.filter(item => (item.storageKey || item.url) !== (image.storageKey || image.url)))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) {
      toast.info('正文、图片和行程快照至少需要提供一项')
      return
    }

    setSubmitting(true)
    try {
      const post = await createCommunityPost({
        title: title.trim() || undefined,
        content: content.trim() || undefined,
        city: city.trim() || snapshot?.city,
        images,
        itinerarySnapshot: snapshot,
      })
      toast.success('已发布到社区')
      router.push(`/community/${post.id}`)
    }
    catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '发布失败')
    }
    finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="community-create travel-page-shell" aria-labelledby="community-create-title">
      <section className="community-create__hero travel-page-hero travel-ticket-edge travel-route-line">
        <p className="community-create__label">NEW POSTCARD</p>
        <h1 id="community-create-title">发布旅行分享</h1>
        <p>写下路线、照片和现场感受，让这份行程成为下一位旅友的参考。</p>
      </section>

      <section className="community-create__panel travel-surface-card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">标题</label>
            <input
              id="title"
              type="text"
              maxLength={80}
              placeholder="例如：成都三天两晚松弛路线"
              value={title}
              onChange={event => setTitle(event.target.value)}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">正文</label>
            <textarea
              id="content"
              maxLength={2000}
              rows={7}
              placeholder="分享你的路线、体验、避坑提醒或适合的人群"
              value={content}
              onChange={event => setContent(event.target.value)}
              className="flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="city" className="text-sm font-medium">城市</label>
            <input
              id="city"
              type="text"
              maxLength={50}
              placeholder="例如：成都"
              value={city}
              onChange={event => setCity(event.target.value)}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="community-create__upload-block">
            <div className="community-create__section-title">
              <ImageIcon aria-hidden="true" />
              <span>图片</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={event => handleUpload(event.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploading || images.length >= 9}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? '上传中...' : '上传图片'}
            </Button>
            <p className="community-create__hint">最多 9 张，支持 JPG、PNG、WebP，单张不超过 5MB。</p>
            {images.length > 0
              ? (
                  <div className="community-create__image-preview">
                    <CommunityImageGrid images={images} />
                    <div className="community-create__image-actions">
                      {images.map(image => (
                        <button key={image.storageKey || image.url} type="button" onClick={() => removeImage(image)}>
                          <X aria-hidden="true" />
                          移除图片
                        </button>
                      ))}
                    </div>
                  </div>
                )
              : null}
          </div>

          {snapshot
            ? (
                <div className="community-create__itinerary">
                  <CommunityItineraryPreview snapshot={snapshot} removable onRemove={() => setSnapshot(null)} />
                </div>
              )
            : null}

          {!canSubmit ? <p className="community-create__requirement">正文、图片和行程快照至少需要提供一项。</p> : null}

          <div className="community-create__actions">
            <Button type="button" variant="outline" onClick={() => router.push('/community')}>取消</Button>
            <Button type="submit" disabled={!canSubmit || uploading || submitting}>
              <Send aria-hidden="true" className="mr-2 h-4 w-4" />
              {submitting ? '发布中...' : '发布到社区'}
            </Button>
          </div>
        </form>
      </section>
    </main>
  )
}
