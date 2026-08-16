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
    <main aria-labelledby="community-create-title" className="travel-page-shell gap-7">
      <section className="travel-page-hero travel-ticket-edge travel-route-line">
        <p className="mb-2.5 text-accent text-[0.82rem] font-black tracking-[0.2em]">NEW POSTCARD</p>
        <h1 className="text-[clamp(2.1rem,4.5vw,4rem)] leading-[1.08] text-travel-ink" id="community-create-title">
          发布旅行分享
        </h1>
        <p className="mt-3.5 max-w-[720px] text-[1.05rem] leading-relaxed text-travel-muted">
          写下路线、照片和现场感受，让这份行程成为下一位旅友的参考。
        </p>
      </section>

      <section className="travel-surface-card rounded-3xl p-7">
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

          <div className="mt-[22px]">
            <div className="mb-3 flex items-center gap-2 font-black text-travel-ink">
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
            <p className="mt-2 text-[0.92rem] text-travel-muted">
              最多 9 张，支持 JPG、PNG、WebP，单张不超过 5MB。
            </p>
            {images.length > 0 ? (
              <div className="mt-3.5 grid gap-3">
                <CommunityImageGrid images={images} />
                <div className="flex flex-wrap gap-2">
                  {images.map((image) => (
                    <button
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-full border-0 bg-danger/8 px-3 font-bold text-danger"
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
            <div className="mt-[22px]">
              <CommunityItineraryPreview
                onRemove={() => setSnapshot(null)}
                removable
                snapshot={snapshot}
              />
            </div>
          ) : null}

          {!canSubmit ? (
            <p className="mt-[18px] font-bold text-danger">正文、图片和行程快照至少需要提供一项。</p>
          ) : null}

          <div className="mt-7 flex justify-end gap-3">
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
