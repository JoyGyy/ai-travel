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
import {
  getAttractionMeta,
  getAttractionById as providerGetAttractionById,
  listAttractions as providerListAttractions,
  searchAttractions as providerSearchAttractions,
} from './providers/pgAttractionProvider.js'

/**
 * 获取用户收藏的景点 ID 集合
 * @param {string | undefined} userId
 * @returns {Promise<Set<string>>}
 */
async function getFavoriteIdSet(userId) {
  if (!userId)
    return new Set()
  return new Set(await listFavoriteAttractionIds(userId))
}

/**
 * 为景点对象添加 isFavorite 标记
 * @param {object} attraction
 * @param {Set<string>} favoriteIds
 * @returns {object & { isFavorite: boolean }}
 */
function withFavorite(attraction, favoriteIds) {
  return {
    ...attraction,
    isFavorite: favoriteIds.has(attraction.id),
  }
}

/**
 * 列出景点（带收藏状态、分页元数据）
 * @param {object} filters - 筛选条件
 * @param {string} [userId] - 当前用户 ID
 * @returns {Promise<{ items: Array, total: number, cities: string[], tags: string[] }>}
 */
async function listAttractions(filters = {}, userId) {
  const favoriteIds = await getFavoriteIdSet(userId)
  const result = await providerListAttractions(filters)

  // PG provider 返回 { items, total }，本地 provider 返回数组
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

/**
 * 根据 ID 获取景点详情（带收藏状态）
 * @param {string} id - 景点 ID
 * @param {string} [userId] - 当前用户 ID
 * @returns {Promise<{ attraction: object, isFavorite: boolean } | null>}
 */
async function getAttractionById(id, userId) {
  const attraction = await providerGetAttractionById(id)
  if (!attraction)
    return null

  const favoriteIds = await getFavoriteIdSet(userId)
  return {
    attraction: withFavorite(attraction, favoriteIds),
    isFavorite: favoriteIds.has(attraction.id),
  }
}

/**
 * 列出用户收藏的景点
 * @param {string} userId - 用户 ID
 * @returns {Promise<Array>}
 */
async function listFavoriteAttractions(userId) {
  const favoriteIds = await getFavoriteIdSet(userId)
  const results = await Promise.all(
    [...favoriteIds].map(id => providerGetAttractionById(id)),
  )
  return results
    .filter(Boolean)
    .map(item => withFavorite(item, favoriteIds))
}

/**
 * 收藏景点（校验景点是否存在）
 * @param {string} userId - 用户 ID
 * @param {string} attractionId - 景点 ID
 * @returns {Promise<{ isFavorite: true }>}
 * @throws {HttpError} 404 当景点不存在
 */
async function favoriteAttraction(userId, attractionId) {
  const attraction = await providerGetAttractionById(attractionId)
  if (!attraction)
    throw httpError(404, '景点不存在')

  await addFavoriteAttraction(userId, attractionId)
  return { isFavorite: true }
}

/**
 * 取消收藏景点
 * @param {string} userId - 用户 ID
 * @param {string} attractionId - 景点 ID
 * @returns {Promise<{ isFavorite: false }>}
 */
async function unfavoriteAttraction(userId, attractionId) {
  await removeFavoriteAttraction(userId, attractionId)
  return { isFavorite: false }
}

/**
 * 搜索景点（同步，不带收藏状态）
 * @param {object} filters - 筛选条件
 * @returns {Array}
 */
async function searchAttractions(filters = {}) {
  return providerSearchAttractions(filters)
}

export {
  favoriteAttraction,
  getAttractionById,
  listAttractions,
  listFavoriteAttractions,
  searchAttractions,
  unfavoriteAttraction,
}
