import { nanoid } from 'nanoid'
/**
 * 分享服务
 * 提供行程分享的创建和查询功能
 * 使用 JSON 文件存储分享数据
 */
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const DATA_PATH = path.join(process.cwd(), 'data/shared_itineraries.json')

interface ShareRecord {
  budget: string
  city: string
  contentHash: string
  createdAt: string
  days: number
  id: string
  itinerary: unknown
  viewCount: number
}

/** 创建分享记录，相同内容的行程会复用已有 ID */
export function createShare({
  budget,
  city,
  days,
  itinerary,
}: {
  budget: string
  city: string
  days: number
  itinerary: unknown
}): string {
  const shares = readShares()
  const contentHash = hashItinerary(itinerary)

  const existing = shares.find(
    (s) =>
      s.city === city && s.days === days && s.budget === budget && s.contentHash === contentHash,
  )
  if (existing) {
    return existing.id
  }

  const id = nanoid(8)
  const share: ShareRecord = {
    budget,
    city,
    contentHash,
    createdAt: new Date().toISOString(),
    days,
    id,
    itinerary,
    viewCount: 0,
  }

  shares.push(share)
  writeShares(shares)

  return id
}

/** 获取分享记录并自增浏览次数 */
export function getShare(id: string): null | ShareRecord {
  const shares = readShares()
  const share = shares.find((s) => s.id === id)

  if (!share) {
    return null
  }

  share.viewCount += 1
  writeShares(shares)

  return share
}

/** 对行程数据取 SHA-256 哈希前 16 位，用于去重 */
function hashItinerary(itinerary: unknown): string {
  return createHash('sha256').update(JSON.stringify(itinerary)).digest('hex').slice(0, 16)
}

/** 从 JSON 文件读取所有分享记录 */
function readShares(): ShareRecord[] {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf-8')
    return JSON.parse(raw) as ShareRecord[]
  } catch {
    return []
  }
}

/** 写入分享记录（先写临时文件再原子重命名，防止数据损坏） */
function writeShares(shares: ShareRecord[]): void {
  const tmpPath = `${DATA_PATH}.tmp`
  fs.writeFileSync(tmpPath, JSON.stringify(shares, null, 2), 'utf-8')
  fs.renameSync(tmpPath, DATA_PATH)
}
