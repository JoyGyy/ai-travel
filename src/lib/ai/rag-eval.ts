export interface RagEvalCase {
  city: string
  expected: string[]
  query: string
}

export interface RagEvalResult {
  hitAt1: number
  hitAt3: number
  meanReciprocalRank: number
  total: number
}

export function evaluateRetrieval(
  cases: RagEvalCase[],
  retrieveResults: Array<string[]>,
): RagEvalResult {
  if (cases.length !== retrieveResults.length)
    throw new Error('评测用例和检索结果数量不一致')

  let hitAt1 = 0
  let hitAt3 = 0
  let reciprocalRank = 0

  cases.forEach((item, index) => {
    const expected = new Set(item.expected)
    const ranked = retrieveResults[index]
    const first = ranked.findIndex(name => expected.has(name))
    if (first === 0)
      hitAt1 += 1
    if (first >= 0 && first < 3)
      hitAt3 += 1
    if (first >= 0)
      reciprocalRank += 1 / (first + 1)
  })

  const total = cases.length
  return {
    hitAt1: total ? hitAt1 / total : 0,
    hitAt3: total ? hitAt3 / total : 0,
    meanReciprocalRank: total ? reciprocalRank / total : 0,
    total,
  }
}
