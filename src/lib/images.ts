/**
 * 图片 URL 工具
 * 支持可配置的 CDN URL，默认使用本地路径
 */

const BASE_URL: string = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_IMAGE_BASE_URL || ''

/**
 * 构建图片 URL
 * @param path - 图片路径，例如 '/images/home/trip-greece.jpg'
 * @returns 完整的图片 URL
 */
export function imageUrl(path: string): string {
  if (!BASE_URL)
    return path
  // 确保 BASE_URL 不以 / 结尾，path 以 / 开头
  const base = BASE_URL.replace(/\/$/, '')
  const imgPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${imgPath}`
}
