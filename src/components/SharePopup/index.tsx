/**
 * 分享弹窗组件
 * 提供保存图片和复制分享链接两个操作
 */
import { useCallback, useRef, useState } from 'react'
import { Popup, Toast } from 'antd-mobile'
import { toPng } from 'html-to-image'
import { ShareCard } from '@/components/ShareCard'
import type { DayItinerary } from '@/types'

interface SharePopupProps {
  visible: boolean
  onClose: () => void
  city: string
  days: number
  budget: number | string
  itinerary: DayItinerary[]
}

/** 预览缩放比例：750 * 0.42 ≈ 315 */
const PREVIEW_SCALE = 0.42

export function SharePopup({ visible, onClose, city, days, budget, itinerary }: SharePopupProps) {
  const captureRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)
  const [copying, setCopying] = useState(false)
  /** 剪贴板不可用时，降级展示的链接文本 */
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null)

  /** 保存卡片为图片并下载 */
  const handleSaveImage = useCallback(async () => {
    const wrapper = captureRef.current
    if (!wrapper || saving) return
    setSaving(true)

    // 找到 ShareCard 的根元素，临时调整定位以便 toPng 正确捕获
    const cardEl = wrapper.firstElementChild as HTMLElement | null
    const originalCss = cardEl?.style.cssText

    try {
      // 将卡片从 off-screen 移到捕获容器的可视区域
      if (cardEl) {
        cardEl.style.position = 'relative'
        cardEl.style.left = '0'
        cardEl.style.top = '0'
      }

      const dataUrl = await toPng(wrapper, {
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
      // 恢复卡片原始定位样式
      if (cardEl && originalCss !== undefined) {
        cardEl.style.cssText = originalCss
      }
      setSaving(false)
    }
  }, [city, saving])

  /** 调用分享接口并复制链接到剪贴板 */
  const handleCopyLink = useCallback(async () => {
    if (copying) return
    setCopying(true)
    setFallbackUrl(null)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        Toast.show('请先登录')
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

      const { shareUrl } = (await res.json()) as { shareId: string; shareUrl: string }
      const fullUrl = `${window.location.origin}${shareUrl}`

      // 尝试写入剪贴板
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullUrl)
        Toast.show('链接已复制')
      } else {
        // 剪贴板 API 不可用时，降级显示链接文本供用户手动复制
        setFallbackUrl(fullUrl)
        Toast.show('请手动复制下方链接')
      }
    } catch (err) {
      Toast.show('分享失败，请重试')
    } finally {
      setCopying(false)
    }
  }, [city, days, budget, itinerary, copying])

  return (
    <Popup
      visible={visible}
      onMaskClick={onClose}
      bodyStyle={{
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        maxHeight: '85vh',
        overflow: 'auto',
      }}
    >
      {/* 隐藏的全尺寸卡片，专用于 toPng 捕获 */}
      <div
        ref={captureRef}
        style={{
          position: 'absolute',
          left: -9999,
          top: 0,
          width: 750,
          height: 1334,
        }}
      >
        <ShareCard city={city} days={days} budget={budget} itinerary={itinerary} />
      </div>

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

      {/* 卡片缩放预览 */}
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
            {/* translateX 创建新的包含块，抵消 ShareCard 的 left: -9999 */}
            <div style={{ transform: 'translateX(9999px)' }}>
              <ShareCard city={city} days={days} budget={budget} itinerary={itinerary} />
            </div>
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
          {saving ? '保存中…' : '保存图片'}
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
          {copying ? '复制中…' : '复制链接'}
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
