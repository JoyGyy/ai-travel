/**
 * 社区路由 — 图片上传
 * POST /api/community/uploads/images
 * 使用 FormData 上传，替代 multer
 * 需要登录
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { nanoid } from 'nanoid'
import { NextResponse } from 'next/server'

import { httpError, withProtected } from '@/lib/utils/http'

const MAX_IMAGES_PER_POST = 9
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const UPLOAD_ROOT = path.resolve(process.cwd(), 'public/uploads/community')
const PUBLIC_UPLOAD_PREFIX = '/uploads/community'

const allowedMimeTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
])

async function currentUploadFolder() {
  const now = new Date()
  const year = String(now.getFullYear())
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const folder = path.join(UPLOAD_ROOT, year, month)
  await mkdir(folder, { recursive: true })
  return { folder, month, year }
}

async function hasValidImageSignature(file: File, ext: string): Promise<boolean> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  if (ext === 'jpg')
    return bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF
  if (ext === 'png')
    return bytes.length >= 8 && bytes.slice(0, 8).every((value, index) => value === [137, 80, 78, 71, 13, 10, 26, 10][index])
  return bytes.length >= 12
    && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
    && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
}

export const POST = withProtected(
  async (req) => {
    const formData = await req.formData()
    const files = formData.getAll('files').filter((f): f is File => f instanceof File)

    if (files.length === 0)
      throw httpError(400, '请选择要上传的图片')

    if (files.length > MAX_IMAGES_PER_POST)
      throw httpError(400, `每次最多上传 ${MAX_IMAGES_PER_POST} 张图片`)

    const validatedFiles = await Promise.all(files.map(async (file) => {
      const ext = allowedMimeTypes.get(file.type)
      if (!ext)
        throw httpError(400, '仅支持 JPG、PNG 或 WebP 图片')
      if (file.size === 0 || file.size > MAX_IMAGE_SIZE)
        throw httpError(413, '图片大小需在 1B 到 5MB 之间')
      if (!await hasValidImageSignature(file, ext))
        throw httpError(400, '图片内容与文件类型不匹配')
      return { ext, file }
    }))

    const { folder, month, year } = await currentUploadFolder()
    const images: Array<{ altText: string, storageKey: string, url: string }> = []

    // 并行写入所有文件，用 map 返回结果保证顺序与用户选择一致
    const results = await Promise.all(
      validatedFiles.map(async ({ ext, file }) => {
        const filename = `${nanoid(16)}.${ext}`
        // 年月目录在运行时生成，避免 Turbopack 将整个项目加入服务端追踪产物。
        const filePath = path.join(/* turbopackIgnore: true */ folder, filename)
        const buffer = Buffer.from(await file.arrayBuffer())
        await writeFile(filePath, buffer)

        const relativePath = `${year}/${month}/${filename}`
        return {
          altText: file.name ? `${file.name} 图片` : '旅行分享图片',
          storageKey: `community/${relativePath}`,
          url: `${PUBLIC_UPLOAD_PREFIX}/${relativePath}`,
        }
      }),
    )
    images.push(...results)

    return NextResponse.json({ data: { images }, message: '上传成功', success: true })
  },
  { rateLimit: { max: 30, name: 'community:upload', windowMs: 60 * 60_000 } },
)
