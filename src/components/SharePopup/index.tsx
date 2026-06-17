/**
 * 分享弹窗组件
 * 提供保存图片和复制分享链接两个操作
 */
import { useCallback, useRef, useState } from 'react'
import { Popup, Toast } from 'antd-mobile'
import { toPng } from 'html-to-image'
import { ShareCard } from '@/components/ShareCard'
import type { ItineraryResult } from '@/types'

interface SharePopupProps {
  visible: boolean
  onClose: () => void
  city: string
  days: number
  budget: number | string
  itinerary: ItineraryResult
  /** 分享创建成功后的回调，返回 shareId */
  onShared?: (shareId: string) => void
}

/** 预览缩放比例：750 * 0.42 ≈ 315 */
const PREVIEW_SCALE = 0.42

export function SharePopup({ visible, onClose, city, days, budget, itinerary, onShared }: SharePopupProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)
  const [copying, setCopying] = useState(false)
  /** 剪贴板不可用时，降级展示的链接文本 */
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null)

  /** 保存卡片为图片并下载 */
  const handleSaveImage = useCallback(async () => {
    const cardEl = cardRef.current
    if (!cardEl || saving) return
    setSaving(true)

    try {
      // 直接对可见的 ShareCard 元素捕获全尺寸图片
      const dataUrl = await toPng(cardEl, {
        width: 750,
        height: 1334,
        pixelRatio: 2,
      })

      // 触发浏览器下载
      const link = document.createElement('a')
      link.download = `${city}-行程卡片.png`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      Toast.show('图片已保存')
    } catch {
      Toast.show('图片保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }, [city, saving])

  /** 调用分享接口并复制链接到剪贴板 */
  const handleCopyLink = useCallback(async () => {
    if (copying) return
    setCopying(true)
    setFallbackUrl(null)

    let fullUrl = ''
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        Toast.show('请先登录')
        setCopying(false)
        return
      }

      const res = await fetch('/api/travel/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ city, days, budget, itinerary }),
      })

      if (!res.ok) {
        throw new Error(`请求失败: ${res.status}`)
      }

      const { shareId, shareUrl } = (await res.json()) as { shareId: string; shareUrl: string }
      fullUrl = `${window.location.origin}${shareUrl}`
      onShared?.(shareId)

      // 尝试写入剪贴板
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullUrl)
        Toast.show('链接已复制')
      } else {
        // 剪贴板 API 不可用，降级显示链接
        setFallbackUrl(fullUrl)
        Toast.show('请手动复制下方链接')
      }
    } catch (err) {
      console.error('分享失败:', err)
      // 如果已拿到链接但剪贴板失败，降级显示链接
      if (fullUrl) {
        setFallbackUrl(fullUrl)
        Toast.show('复制失败，请手动复制下方链接')
      } else {
        Toast.show('分享失败，请重试')
      }
    } finally {
      setCopying(false)
    }
  }, [city, days, budget, itinerary, copying])

  return (
    <Popup
      visible={visible}
      onMaskClick={onClose}
      bodyClassName="share-popup-body"
    >
      {/* 标题 */}
      <div style={{ padding: '20px 20px 0', textAlign: 'center' }}>
        <h3
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 600,
            color: 'var(--c-ink)',
            fontFamily: 'var(--font-serif)',
          }}
        >
          分享行程
        </h3>
      </div>

      {/* 卡片缩放预览 — 同时作为 toPng 的捕获源 */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0 24px' }}>
        <div
          style={{
            width: 750 * PREVIEW_SCALE,
            height: 1334 * PREVIEW_SCALE,
            overflow: 'hidden',
            borderRadius: 12,
            boxShadow: '0 2px 16px rgba(0, 0, 0, 0.1)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              transform: `scale(${PREVIEW_SCALE})`,
              transformOrigin: '0 0',
              width: 750,
              height: 1334,
            }}
          >
            <ShareCard
              ref={cardRef}
              city={city}
              days={days}
              budget={budget}
              itinerary={itinerary.dailyItinerary}
            />
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div style={{ padding: '0 20px 24px', display: 'flex', gap: 12 }}>
        <button
          type="button"
          onClick={handleSaveImage}
          disabled={saving}
          style={{
            flex: 1,
            padding: '12px 0',
            borderRadius: 12,
            border: 'none',
            background: 'var(--c-terracotta, #c0553e)',
            color: '#fff',
            fontSize: 15,
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          {saving ? '保存中...' : '保存图片'}
        </button>
        <button
          type="button"
          onClick={handleCopyLink}
          disabled={copying}
          style={{
            flex: 1,
            padding: '12px 0',
            borderRadius: 12,
            border: '1px solid var(--c-terracotta, #c0553e)',
            background: 'var(--c-white, #fff)',
            color: 'var(--c-terracotta, #c0553e)',
            fontSize: 15,
            fontWeight: 600,
            cursor: copying ? 'not-allowed' : 'pointer',
            opacity: copying ? 0.6 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          {copying ? '复制中...' : '复制链接'}
        </button>
      </div>

      {/* 剪贴板降级：展示可选中的链接文本 */}
      {fallbackUrl && (
        <div style={{ padding: '0 20px 20px' }}>
          <div
            style={{
              padding: '10px 14px',
              background: 'var(--c-paper, #f5f0eb)',
              borderRadius: 8,
              fontSize: 13,
              color: 'var(--c-ink-light, #8b8680)',
              wordBreak: 'break-all',
              userSelect: 'all',
            }}
          >
            {fallbackUrl}
          </div>
        </div>
      )}
    </Popup>
  )
}
