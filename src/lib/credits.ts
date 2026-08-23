import attractionCredits from '@/knowledge/attraction-image-credits.json'
import attractions from '@/knowledge/attractions-product.json'

export interface ImageCredit {
  attractionId: string
  author: string
  license: string
  licenseUrl?: string
  sourcePage: string
}

export interface CityCreditGroup {
  city: string
  items: { name: string, credit: ImageCredit }[]
}

/** 按城市分组景点图片版权记录，城市按中文排序。 */
export function buildCreditsByCity(): CityCreditGroup[] {
  const creditById = new Map(attractionCredits.map(credit => [credit.attractionId, credit]))
  const grouped = new Map<string, { name: string, credit: ImageCredit }[]>()

  for (const attraction of (attractions as { id: string, name: string, city: string }[])) {
    const credit = creditById.get(attraction.id)
    if (!credit)
      continue
    const list = grouped.get(attraction.city) ?? []
    list.push({ name: attraction.name, credit })
    grouped.set(attraction.city, list)
  }

  return [...grouped.entries()]
    .map(([city, items]) => ({ city, items }))
    .sort((a, b) => a.city.localeCompare(b.city, 'zh'))
}
