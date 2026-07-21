/**
 * 景点领域服务
 * 组合景点数据 provider 和收藏数据库函数，提供统一的景点业务接口
 */
import { httpError } from '../../utils/http.js'
import {
  addFavoriteAttraction,
  listFavoriteAttractionIds,
  removeFavoriteAttraction,
} from '../auth.js'
import type { AttractionItem } from './providers/pgAttractionProvider.js'
import {
  getAttractionMeta,
  getAttractionById as providerGetAttractionById,
  listAttractions as providerListAttractions,
  searchAttractions as providerSearchAttractions,
} from './providers/pgAttractionProvider.js'

async function getFavoriteIdSet(userId: string | undefined): Promise<Set<string>> {
  if (!userId)
    return new Set()
  return new Set(await listFavoriteAttractionIds(userId))
}

function withFavorite(attraction: AttractionItem, favoriteIds: Set<string>): AttractionItem & { isFavorite: boolean } {
  return {
    ...attraction,
    isFavorite: favoriteIds.has(attraction.id),
  }
}

interface ListResult {
  items: (AttractionItem & { isFavorite: boolean })[]
  total: number
  cities: string[]
  tags: string[]
}

async function listAttractions(filters: Record<string, unknown> = {}, userId?: string): Promise<ListResult> {
  const favoriteIds = await getFavoriteIdSet(userId)
  const result = await providerListAttractions(filters as Parameters<typeof providerListAttractions>[0])

  const rawItems = Array.isArray(result) ? result : result.items
  const total = Array.isArray(result) ? rawItems.length : result.total

  const items = rawItems.map(item => withFavorite(item, favoriteIds))
  const meta = await getAttractionMeta()

  return {
    items,
    total,
    cities: meta.cities,
    tags: meta.tags,
  }
}

async function getAttractionById(id: string, userId?: string): Promise<{ attraction: AttractionItem & { isFavorite: boolean }, isFavorite: boolean } | null> {
  const attraction = await providerGetAttractionById(id)
  if (!attraction)
    return null

  const favoriteIds = await getFavoriteIdSet(userId)
  return {
    attraction: withFavorite(attraction, favoriteIds),
    isFavorite: favoriteIds.has(attraction.id),
  }
}

async function listFavoriteAttractions(userId: string): Promise<(AttractionItem & { isFavorite: boolean })[]> {
  const favoriteIds = await getFavoriteIdSet(userId)
  const results = await Promise.all(
    [...favoriteIds].map(id => providerGetAttractionById(id)),
  )
  return results
    .filter(Boolean)
    .map(item => withFavorite(item!, favoriteIds))
}

async function favoriteAttraction(userId: string, attractionId: string): Promise<{ isFavorite: true }> {
  const attraction = await providerGetAttractionById(attractionId)
  if (!attraction)
    throw httpError(404, '景点不存在')

  await addFavoriteAttraction(userId, attractionId)
  return { isFavorite: true }
}

async function unfavoriteAttraction(userId: string, attractionId: string): Promise<{ isFavorite: false }> {
  await removeFavoriteAttraction(userId, attractionId)
  return { isFavorite: false }
}

async function searchAttractions(filters: Record<string, unknown> = {}) {
  return providerSearchAttractions(filters as Parameters<typeof providerSearchAttractions>[0])
}

export {
  favoriteAttraction,
  getAttractionById,
  listAttractions,
  listFavoriteAttractions,
  searchAttractions,
  unfavoriteAttraction,
}
