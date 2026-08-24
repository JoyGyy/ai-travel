import { toPng } from 'html-to-image'

export interface ExportImageOptions {
  fileName?: string
  pixelRatio?: number
  quality?: number
}

/**
 * 将指定 DOM 节点导出为高清 PNG 图片并触发浏览器本地下载
 */
export async function exportElementToPng(
  element: HTMLElement,
  options: ExportImageOptions = {},
): Promise<string> {
  const {
    fileName = `远方-旅行手账路书-${new Date().toISOString().slice(0, 10)}.png`,
    pixelRatio = 2,
  } = options

  try {
    const dataUrl = await toPng(element, {
      backgroundColor: '#FAF7F0',
      cacheBust: true,
      filter: (node) => {
        // 过滤不需要导出的按钮与控制栏
        if (node instanceof HTMLElement && node.classList.contains('no-export')) {
          return false
        }
        return true
      },
      pixelRatio,
    })

    // 触发下载
    const link = document.createElement('a')
    link.download = fileName
    link.href = dataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    return dataUrl
  }
  catch (err) {
    console.error('导出卡片图片失败:', err)
    throw new Error('生成图片失败，请稍后重试')
  }
}
