/**
 * Agent 编排器
 * 实现多步骤行程规划流程，每步通过 SSE 推送给前端
 */

const { retrieve } = require('./rag')
const { sendSSE } = require('../utils/sse')

/**
 * 解析用户意图
 * 从请求参数中提取城市、天数、预算、偏好关键词
 * @param {object} params - 请求参数
 * @returns {object} 解析后的意图
 */
function parseIntent(params) {
  const { city, budget, days } = params

  // 根据预算推断偏好标签
  const tags = []
  if (budget <= 2000) {
    tags.push('免费', '文化')
  }
  else if (budget <= 5000) {
    tags.push('必去', '文化', '美食')
  }
  else {
    tags.push('必去', '娱乐', '自然')
  }

  return {
    city: city || '北京',
    days: Math.max(1, Math.min(Number(days) || 3, 10)),
    budget: Math.max(1000, Number(budget) || 5000),
    tags,
  }
}

/**
 * 生成每日行程
 * 基于景点数据规划每日上午、下午、晚上的行程
 * @param {object[]} attractions - 匹配的景点列表
 * @param {number} days - 行程天数
 * @param {string} city - 城市名
 * @returns {object[]} 每日行程数组
 */
function generateItinerary(attractions, days, city) {
  const itinerary = []
  const usedSpots = new Set()

  // 获取景点，优先使用高分景点
  const spots = attractions.slice(0, days * 3)

  // 补充景点不足的情况
  while (spots.length < days * 3 && attractions.length > 0) {
    spots.push(attractions[spots.length % attractions.length])
  }

  for (let day = 1; day <= days; day++) {
    const date = getDateStr(day)

    // 分配三个时段的景点
    const morningSpot = getSpot(spots, usedSpots, (day - 1) * 3)
    const afternoonSpot = getSpot(spots, usedSpots, (day - 1) * 3 + 1)
    const eveningSpot = getSpot(spots, usedSpots, (day - 1) * 3 + 2)

    itinerary.push({
      day,
      date,
      morning: formatSpot(morningSpot, city),
      afternoon: formatSpot(afternoonSpot, city),
      evening: formatSpot(eveningSpot, city),
    })
  }

  return itinerary
}

/**
 * 获取景点，避免重复
 * @param {object[]} spots - 景点列表
 * @param {Set} used - 已使用的景点名集合
 * @param {number} index - 默认索引
 * @returns {object} 景点对象
 */
function getSpot(spots, used, index) {
  // 先尝试用指定索引
  if (index < spots.length && !used.has(spots[index].name)) {
    used.add(spots[index].name)
    return spots[index]
  }
  // 找一个未使用的景点
  for (const spot of spots) {
    if (!used.has(spot.name)) {
      used.add(spot.name)
      return spot
    }
  }
  // 兜底：返回第一个景点
  return spots[0]
}

/**
 * 格式化景点数据，匹配前端 SpotData 接口
 * @param {object} spot - 原始景点数据
 * @param {string} city - 城市名
 * @returns {object} 格式化后的景点数据
 */
function formatSpot(spot, city) {
  return {
    spot: spot.name,
    description: spot.description,
    duration: spot.duration,
    ticket: spot.ticket === 0 ? '免费' : `¥${spot.ticket}`,
    transportation: getTransportation(city, spot.name),
  }
}

/**
 * 获取交通建议（模拟）
 * @param {string} city - 城市名
 * @param {string} spotName - 景点名
 * @returns {string} 交通方式
 */
function getTransportation(city, spotName) {
  const transportMap = {
    '北京': '地铁可达',
    '上海': '地铁可达',
    '杭州': '公交/骑行可达',
    '成都': '地铁/公交可达',
    '西安': '公交可达',
    '重庆': '轨道交通可达',
    '广州': '地铁可达',
    '深圳': '地铁可达',
    '南京': '地铁可达',
    '苏州': '公交可达',
    '厦门': '公交/骑行可达',
    '大理': '租车/骑行可达',
    '丽江': '步行/打车可达',
    '青岛': '公交可达',
    '张家界': '景区班车可达',
  }
  return transportMap[city] || '公共交通可达'
}

/**
 * 计算预算明细
 * @param {number} totalBudget - 总预算
 * @param {number} days - 行程天数
 * @param {object[]} attractions - 景点列表（用于计算门票）
 * @returns {object} 预算明细
 */
function calculateBudget(totalBudget, days, attractions) {
  // 根据天数和总预算合理分配
  const ticketCost = attractions.slice(0, days * 3).reduce((sum, a) => sum + (a.ticket || 0), 0)
  const accommodation = Math.round(totalBudget * 0.35)
  const food = Math.round(totalBudget * 0.25)
  const transportation = Math.round(totalBudget * 0.15)
  const tickets = Math.min(ticketCost, Math.round(totalBudget * 0.15))
  const other = totalBudget - accommodation - food - transportation - tickets

  return {
    accommodation,
    food,
    transportation,
    tickets,
    other: Math.max(0, other),
  }
}

/**
 * 生成旅行提示
 * @param {string} city - 城市名
 * @param {object} cityData - 城市数据
 * @param {number} days - 行程天数
 * @returns {string[]} 提示列表
 */
function generateTips(city, cityData, days) {
  const tips = []

  // 基本提示
  tips.push(`最佳旅行季节：${cityData.bestSeason}`)
  tips.push(`交通建议：${cityData.transport}`)

  // 美食推荐
  if (cityData.food && cityData.food.length > 0) {
    tips.push(`推荐美食：${cityData.food.slice(0, 5).join('、')}`)
  }

  // 行程相关提示
  if (days >= 3) {
    tips.push('行程较长，建议准备舒适的运动鞋')
  }

  // 景点提示
  const tipsList = cityData.attractions
    .filter(a => a.tips)
    .slice(0, 3)
    .map(a => `${a.name}：${a.tips}`)
  tips.push(...tipsList)

  tips.push('建议提前在网上预约热门景点门票')
  tips.push('出行前查看当地天气预报，合理安排行程')

  return tips
}

/**
 * 获取日期字符串
 * @param {number} dayOffset - 距今天的天数偏移
 * @returns {string} 日期字符串，如 "2024-01-15"
 */
function getDateStr(dayOffset) {
  const date = new Date()
  date.setDate(date.getDate() + dayOffset - 1)
  return date.toISOString().split('T')[0]
}

/**
 * Agent 主流程：执行多步骤行程规划
 * @param {import('express').Response} res - Express 响应对象
 * @param {object} params - 请求参数 { city, budget, days }
 */
async function executeAgent(res, params) {
  // 步骤 1：解析意图
  sendSSE(res, { type: 'step', step: 1, name: '解析意图', status: 'start' })
  sendSSE(res, { type: 'chunk', content: '🔍 正在解析你的旅行需求...\n\n' })
  await delay(300)
  const intent = parseIntent(params)
  sendSSE(res, { type: 'step', step: 1, name: '解析意图', status: 'complete', data: { city: intent.city, days: intent.days, budget: intent.budget, tags: intent.tags } })
  sendSSE(res, { type: 'chunk', content: `✅ 目的地：${intent.city}，${intent.days}天行程，预算 ¥${intent.budget}\n\n` })

  // 步骤 2：检索景点（RAG）
  sendSSE(res, { type: 'step', step: 2, name: '知识库检索', status: 'start' })
  sendSSE(res, { type: 'chunk', content: '📚 正在检索景点信息...\n\n' })
  await delay(300)
  const ragResult = retrieve(intent.city, intent.tags, intent.city)
  if (!ragResult) {
    sendSSE(res, { type: 'complete', data: { dailyItinerary: [], budgetBreakdown: null, tips: ['暂不支持该城市的行程规划'] } })
    return
  }
  sendSSE(res, { type: 'step', step: 2, name: '知识库检索', status: 'complete', data: { count: ragResult.attractions.length, sources: ragResult.attractions.slice(0, 5).map(a => a.name) } })
  sendSSE(res, { type: 'chunk', content: `✅ 找到 ${ragResult.attractions.length} 个相关景点\n\n` })

  // 步骤 3：规划行程
  sendSSE(res, { type: 'step', step: 3, name: '行程规划', status: 'start' })
  sendSSE(res, { type: 'chunk', content: '🗺️ 正在规划每日行程...\n\n' })
  await delay(300)
  const dailyItinerary = generateItinerary(ragResult.attractions, intent.days, intent.city)
  sendSSE(res, { type: 'step', step: 3, name: '行程规划', status: 'complete', data: { days: intent.days, spotCount: intent.days * 3 } })
  sendSSE(res, { type: 'chunk', content: `✅ 已生成 ${intent.days} 天行程安排\n\n` })

  // 步骤 4：计算预算
  sendSSE(res, { type: 'step', step: 4, name: '预算计算', status: 'start' })
  sendSSE(res, { type: 'chunk', content: '💰 正在计算预算明细...\n\n' })
  await delay(200)
  const budgetBreakdown = calculateBudget(intent.budget, intent.days, ragResult.attractions)
  sendSSE(res, { type: 'step', step: 4, name: '预算计算', status: 'complete', data: budgetBreakdown })
  sendSSE(res, { type: 'chunk', content: `✅ 预算分配完成\n\n` })

  // 步骤 5：生成建议
  sendSSE(res, { type: 'step', step: 5, name: '生成建议', status: 'start' })
  sendSSE(res, { type: 'chunk', content: '💡 正在生成旅行建议...\n\n' })
  await delay(200)
  const tips = generateTips(intent.city, ragResult, intent.days)
  sendSSE(res, { type: 'step', step: 5, name: '生成建议', status: 'complete', data: { count: tips.length } })
  sendSSE(res, { type: 'chunk', content: `✅ 已生成 ${tips.length} 条旅行提示\n\n` })

  // 推送最终结果
  sendSSE(res, {
    type: 'complete',
    data: {
      city: intent.city,
      days: intent.days,
      totalBudget: intent.budget,
      dailyItinerary,
      budgetBreakdown,
      tips,
    },
  })
}

/**
 * 延迟函数，模拟处理时间
 * @param {number} ms - 延迟毫秒数
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = { executeAgent }
