/**
 * 分享服务
 * 提供行程分享的创建和查询功能
 * 使用 JSON 文件存储分享数据
 */

import fs from 'node:fs'
import path from 'node:path'
import { nanoid } from 'nanoid'

const DATA_PATH = path.join(import.meta.dirname, '../data/shared_itineraries.json')

/** 读取所有分享数据，文件不存在或解析失败时返回空数组 */
function readShares() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

/** 原子写入：先写临时文件再 rename */
function writeShares(shares) {
  const tmpPath = `${DATA_PATH}.tmp`
  fs.writeFileSync(tmpPath, JSON.stringify(shares, null, 2), 'utf-8')
  fs.renameSync(tmpPath, DATA_PATH)
}

/**
 * 创建分享链接
 * 幂等：同一 city+days+budget 组合返回已有的 shareId
 * @param {{ city: string, days: number, budget: string, itinerary: any }} data
 * @returns {string} shareId
 */
export function createShare({ city, days, budget, itinerary }) {
  const shares = readShares()

  // 幂等检查
  const existing = shares.find(
    s => s.city === city && s.days === days && s.budget === budget,
  )
  if (existing) {
    return existing.id
  }

  const id = nanoid(8)
  const share = {
    id,
    city,
    days,
    budget,
    itinerary,
    viewCount: 0,
    createdAt: new Date().toISOString(),
  }

  shares.push(share)
  writeShares(shares)

  return id
}

/**
 * 获取分享数据并递增浏览次数
 * @param {string} id
 * @returns {object | null}
 */
export function getShare(id) {
  const shares = readShares()
  const share = shares.find(s => s.id === id)

  if (!share) {
    return null
  }

  // 递增浏览次数并持久化
  share.viewCount += 1
  writeShares(shares)

  return share
}
