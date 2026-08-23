interface AttractionLike {
  city?: unknown
  name?: unknown
}

/** 从工具调用结果中抽取展示给用户的知识库来源。 */
export function extractRagSources(output: unknown): string[] {
  const sources = new Set<string>()
  collectSources(output, sources)
  return [...sources].slice(0, 6)
}

function collectSources(value: unknown, sources: Set<string>): void {
  if (Array.isArray(value)) {
    for (const item of value)
      collectSources(item, sources)
    return
  }

  if (!isRecord(value))
    return

  addAttractions(value, sources)
  for (const nested of Object.values(value)) {
    if (Array.isArray(nested)) {
      for (const item of nested)
        collectSources(item, sources)
    }
    else if (isRecord(nested)) {
      collectSources(nested, sources)
    }
  }
}

function addAttractions(value: Record<string, unknown>, sources: Set<string>): void {
  const city = typeof value.city === 'string' ? value.city : undefined
  const attractions = Array.isArray(value.attractions) ? value.attractions : []
  const items = Array.isArray(value.items) ? value.items : []

  for (const attraction of [...attractions, ...items]) {
    const item = attraction as AttractionLike
    if (typeof item.name !== 'string')
      continue
    const itemCity = typeof item.city === 'string' ? item.city : city
    sources.add(itemCity ? `${itemCity} · ${item.name}` : item.name)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
