/**
 * 本地存储工具模块
 * 使用 localStorage 持久化行程缓存数据
 */

/**
 * 加载行程缓存
 * @param {string} city
 * @param {number} budget
 * @param {number} days
 * @return {object|null}
 */
export function loadItineraryCache(city, budget, days) {
  const key = `detail_${city}_${budget}_${days}`
  const raw = localStorage.getItem(key)
  if (!raw)
    return null
  try {
    return JSON.parse(raw)
  }
  catch {
    return null
  }
}

/**
 * 保存行程到缓存
 * @param {string} city
 * @param {number} budget
 * @param {number} days
 * @param {object} data
 */
export function saveItineraryCache(city, budget, days, data) {
  const key = `detail_${city}_${budget}_${days}`
  localStorage.setItem(key, JSON.stringify(data))
}
