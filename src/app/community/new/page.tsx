'use client'

import { ImageIcon, Send, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useRef, useState } from 'react'

import type { CommunityImage, CommunityItinerarySnapshot } from '@/types/community'

import { createCommunityPost, uploadCommunityImages } from '@/api/community'
import { CommunityImageGrid } from '@/components/CommunityImageGrid'
import { CommunityItineraryPreview } from '@/components/CommunityItineraryPreview'
import { Button } from '@/components/ui/button'
import { useAppToast } from '@/hooks/useAppToast'

import './style.css'

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

  const canSubmit = useMemo(
    () => Boolean(content.trim() || images.length > 0 || snapshot),
    [content, images.length, snapshot],
  )

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
      setImages((prev) => [...prev, ...uploaded].slice(0, 9))
      toast.success('图片上传成功')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '图片上传失败')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  function removeImage(image: CommunityImage) {
    setImages((prev) =>
      prev.filter((item) => (item.storageKey || item.url) !== (image.storageKey || image.url)),
    )
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
        city: city.trim() || snapshot?.city,
        content: content.trim() || undefined,
        images,
        itinerarySnapshot: snapshot,
        title: title.trim() || undefined,
      })
      toast.success('已发布到社区')
      router.push(`/community/${post.id}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '发布失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main aria-labelledby="community-create-title" className="community-create travel-page-shell">
      <section className="community-create__hero travel-page-hero travel-ticket-edge travel-route-line">
        <p className="community-create__label">NEW POSTCARD</p>
        <h1 id="community-create-title">发布旅行分享</h1>
        <p>写下路线、照片和现场感受，让这份行程成为下一位旅友的参考。</p>
      </section>

      <section className="community-create__panel travel-surface-card">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="title">
              标题
            </label>
            <input
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              id="title"
              maxLength={80}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="例如：成都三天两晚松弛路线"
              type="text"
              value={title}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="content">
              正文
            </label>
            <textarea
              className="flex min-h-20 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              id="content"
              maxLength={2000}
              onChange={(event) => setContent(event.target.value)}
              placeholder="分享你的路线、体验、避坑提醒或适合的人群"
              rows={7}
              value={content}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="city">
              城市
            </label>
            <input
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              id="city"
              maxLength={50}
              onChange={(event) => setCity(event.target.value)}
              placeholder="例如：成都"
              type="text"
              value={city}
            />
          </div>

          <div className="community-create__upload-block">
            <div className="community-create__section-title">
              <ImageIcon aria-hidden="true" />
              <span>图片</span>
            </div>
            <input
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => handleUpload(event.target.files)}
              ref={fileInputRef}
              type="file"
            />
            <Button
              disabled={uploading || images.length >= 9}
              onClick={() => fileInputRef.current?.click()}
              type="button"
              variant="outline"
            >
              {uploading ? '上传中...' : '上传图片'}
            </Button>
            <p className="community-create__hint">
              最多 9 张，支持 JPG、PNG、WebP，单张不超过 5MB。
            </p>
            {images.length > 0 ? (
              <div className="community-create__image-preview">
                <CommunityImageGrid images={images} />
                <div className="community-create__image-actions">
                  {images.map((image) => (
                    <button
                      key={image.storageKey || image.url}
                      onClick={() => removeImage(image)}
                      type="button"
                    >
                      <X aria-hidden="true" />
                      移除图片
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {snapshot ? (
            <div className="community-create__itinerary">
              <CommunityItineraryPreview
                onRemove={() => setSnapshot(null)}
                removable
                snapshot={snapshot}
              />
            </div>
          ) : null}

          {!canSubmit ? (
            <p className="community-create__requirement">正文、图片和行程快照至少需要提供一项。</p>
          ) : null}

          <div className="community-create__actions">
            <Button onClick={() => router.push('/community')} type="button" variant="outline">
              取消
            </Button>
            <Button disabled={!canSubmit || uploading || submitting} type="submit">
              <Send aria-hidden="true" className="mr-2 h-4 w-4" />
              {submitting ? '发布中...' : '发布到社区'}
            </Button>
          </div>
        </form>
      </section>
    </main>
  )
}

function isImageFile(file: File) {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
}
