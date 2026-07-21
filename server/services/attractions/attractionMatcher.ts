/**
 * 行程景点匹配器
 * 从行程点位名称中匹配产品景点数据，生成 attractionRefs 引用列表
 */
import { searchAttractions } from './attractionService.js'

interface ItineraryDay {
  day?: number
  morning?: { spot?: string }
  afternoon?: { spot?: string }
  evening?: { spot?: string }
}

interface AttractionRef {
  id: string
  name: string
  city: string
  ticketType: string
  priceText: string
}

function collectSpotNames(itinerary: ItineraryDay[] = []): string[] {
  const names: string[] = []
  for (const day of itinerary) {
    for (const period of ['morning', 'afternoon', 'evening'] as const) {
      const name = day?.[period]?.spot
      if (typeof name === 'string' && name.trim())
        names.push(name.trim())
    }
  }
  return names
}

async function matchAttractionRefsFromItinerary(itinerary: ItineraryDay[] = []): Promise<AttractionRef[]> {
  const refs: AttractionRef[] = []
  const seen = new Set<string>()

  for (const spotName of collectSpotNames(itinerary)) {
    const result = await searchAttractions({ keyword: spotName })
    const matched = result.items.find(
      item => item.name === spotName || (item.aliases || []).includes(spotName),
    )
    if (!matched || seen.has(matched.id))
      continue

    seen.add(matched.id)
    refs.push({
      id: matched.id,
      name: matched.name,
      city: matched.city,
      ticketType: matched.ticketType,
      priceText: matched.priceText,
    })
  }

  return refs
}

export { matchAttractionRefsFromItinerary }
