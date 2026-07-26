'use client'

import type { UploadFile } from 'antd'
import type { CommunityImage, CommunityItinerarySnapshot } from '@/types/community'
import { CloseOutlined, PictureOutlined, SendOutlined } from '@ant-design/icons'
import { Button, Form, Input, Upload } from 'antd'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { createCommunityPost, uploadCommunityImages } from '@/api/community'
import { CommunityImageGrid } from '@/components/CommunityImageGrid'
import { CommunityItineraryPreview } from '@/components/CommunityItineraryPreview'
import { useAppMessage } from '@/hooks/useAppMessage'

import './style.css'

interface FormValues {
  title?: string
  content?: string
  city?: string
}

function isImageFile(file: File) {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
}

export default function CommunityPostCreate() {
  const router = useRouter()
  const message = useAppMessage()
  const [form] = Form.useForm<FormValues>()
  const [images, setImages] = useState<CommunityImage[]>([])
  const [snapshot, setSnapshot] = useState<CommunityItinerarySnapshot | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const hasContent = Form.useWatch('content', form)
  const canSubmit = useMemo(() => Boolean(hasContent?.trim() || images.length > 0 || snapshot), [hasContent, images.length, snapshot])

  async function handleUpload(file: File) {
    if (images.length >= 9) {
      message.warning('每条分享最多上传 9 张图片')
      return Upload.LIST_IGNORE
    }
    if (!isImageFile(file)) {
      message.error('仅支持 JPG、PNG 或 WebP 图片')
      return Upload.LIST_IGNORE
    }
    if (file.size > 5 * 1024 * 1024) {
      message.error('单张图片不能超过 5MB')
      return Upload.LIST_IGNORE
    }

    setUploading(true)
    try {
      const uploaded = await uploadCommunityImages([file])
      setImages(prev => [...prev, ...uploaded].slice(0, 9))
      message.success('图片上传成功')
    }
    catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '图片上传失败')
    }
    finally {
      setUploading(false)
    }

    return Upload.LIST_IGNORE
  }

  function removeImage(image: CommunityImage) {
    setImages(prev => prev.filter(item => (item.storageKey || item.url) !== (image.storageKey || image.url)))
  }

  async function submit(values: FormValues) {
    if (!canSubmit) {
      message.warning('正文、图片和行程快照至少需要提供一项')
      return
    }

    setSubmitting(true)
    try {
      const post = await createCommunityPost({
        title: values.title?.trim(),
        content: values.content?.trim(),
        city: values.city?.trim() || snapshot?.city,
        images,
        itinerarySnapshot: snapshot,
      })
      message.success('已发布到社区')
      router.push(`/community/${post.id}`)
    }
    catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '发布失败')
    }
    finally {
      setSubmitting(false)
    }
  }

  const uploadFileList: UploadFile[] = []

  return (
    <main className="community-create travel-page-shell" aria-labelledby="community-create-title">
      <section className="community-create__hero travel-page-hero travel-ticket-edge travel-route-line">
        <p className="community-create__label">NEW POSTCARD</p>
        <h1 id="community-create-title">发布旅行分享</h1>
        <p>写下路线、照片和现场感受，让这份行程成为下一位旅友的参考。</p>
      </section>

      <section className="community-create__panel travel-surface-card">
        <Form form={form} layout="vertical" onFinish={submit} initialValues={{ city: snapshot?.city || '' }}>
          <Form.Item label="标题" name="title" rules={[{ max: 80, message: '标题不能超过 80 个字符' }]}>
            <Input maxLength={80} showCount placeholder="例如：成都三天两晚松弛路线" />
          </Form.Item>
          <Form.Item label="正文" name="content" rules={[{ max: 2000, message: '正文不能超过 2000 个字符' }]}>
            <Input.TextArea maxLength={2000} showCount rows={7} placeholder="分享你的路线、体验、避坑提醒或适合的人群" />
          </Form.Item>
          <Form.Item label="城市" name="city" rules={[{ max: 50, message: '城市不能超过 50 个字符' }]}>
            <Input maxLength={50} placeholder="例如：成都" />
          </Form.Item>

          <div className="community-create__upload-block">
            <div className="community-create__section-title">
              <PictureOutlined aria-hidden="true" />
              <span>图片</span>
            </div>
            <Upload accept="image/jpeg,image/png,image/webp" fileList={uploadFileList} beforeUpload={handleUpload} multiple disabled={uploading || images.length >= 9}>
              <Button loading={uploading}>上传图片</Button>
            </Upload>
            <p className="community-create__hint">最多 9 张，支持 JPG、PNG、WebP，单张不超过 5MB。</p>
            {images.length > 0
              ? (
                  <div className="community-create__image-preview">
                    <CommunityImageGrid images={images} />
                    <div className="community-create__image-actions">
                      {images.map(image => (
                        <button key={image.storageKey || image.url} type="button" onClick={() => removeImage(image)}>
                          <CloseOutlined aria-hidden="true" />
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
            <Button onClick={() => router.push('/community')}>取消</Button>
            <Button type="primary" htmlType="submit" icon={<SendOutlined aria-hidden="true" />} loading={submitting} disabled={!canSubmit || uploading}>
              发布到社区
            </Button>
          </div>
        </Form>
      </section>
    </main>
  )
}
