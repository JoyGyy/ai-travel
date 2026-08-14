/**
 * 行程景点匹配器
 * 从行程点位名称中匹配产品景点数据，生成 attractionRefs 引用列表
 */
import { searchAttractions } from './attractionService'

interface AttractionRef {
  city: string
  id: string
  name: string
  priceText: string
  ticketType: string
}

interface ItineraryDay {
  afternoon?: { spot?: string }
  day?: number
  evening?: { spot?: string }
  morning?: { spot?: string }
}

/** 从行程数据中提取所有景点名称（去重） */
function collectSpotNames(itinerary: ItineraryDay[] = []): string[] {
  const names: string[] = []
  for (const day of itinerary) {
    for (const period of ['morning', 'afternoon', 'evening'] as const) {
      const name = day?.[period]?.spot
      if (typeof name === 'string' && name.trim()) names.push(name.trim())
    }
  }
  return names
}

/** 将行程中的景点名称匹配到产品景点数据，生成引用列表（按 ID 去重） */
async function matchAttractionRefsFromItinerary(
  itinerary: ItineraryDay[] = [],
): Promise<AttractionRef[]> {
  const refs: AttractionRef[] = []
  const seen = new Set<string>()

  for (const spotName of collectSpotNames(itinerary)) {
    const result = await searchAttractions({ keyword: spotName })
    const matched = result.items.find(
      (item) => item.name === spotName || (item.aliases || []).includes(spotName),
    )
    if (!matched || seen.has(matched.id)) continue

    seen.add(matched.id)
    refs.push({
      city: matched.city,
      id: matched.id,
      name: matched.name,
      priceText: matched.priceText,
      ticketType: matched.ticketType,
    })
  }

  return refs
}

export { matchAttractionRefsFromItinerary }
