/**
 * TF-IDF 语义检索模块
 * 基于 TF-IDF + 余弦相似度的中文文本匹配
 */

export function tokenize(text: string): string[] {
  if (!text)
    return []
  const cleaned = text.replace(/[，。！？、；："'（）《》【】\s\-.]/g, '').toLowerCase()
  const tokens: string[] = []

  for (let i = 0; i < cleaned.length; i++) {
    tokens.push(cleaned[i])
    if (i + 1 < cleaned.length) {
      tokens.push(cleaned[i] + cleaned[i + 1])
    }
  }

  return tokens.filter(t => t.length > 0)
}

export function computeTF(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>()
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1)
  }
  const total = tokens.length || 1
  for (const [key, val] of tf) {
    tf.set(key, val / total)
  }
  return tf
}

interface Document {
  id: string
  text: string
}

class TFIDFIndex {
  idf = new Map<string, number>()
  docTFs = new Map<string, Map<string, number>>()
  docIds: string[] = []
  totalDocs = 0

  buildIndex(documents: Document[]): void {
    this.totalDocs = documents.length
    this.docIds = documents.map(d => d.id)

    const docTokenSets: Set<string>[] = []
    for (const doc of documents) {
      const tokens = tokenize(doc.text)
      const tf = computeTF(tokens)
      this.docTFs.set(doc.id, tf)
      docTokenSets.push(new Set(tokens))
    }

    const df = new Map<string, number>()
    for (const tokenSet of docTokenSets) {
      for (const token of tokenSet) {
        df.set(token, (df.get(token) || 0) + 1)
      }
    }

    for (const [token, count] of df) {
      this.idf.set(token, Math.log(this.totalDocs / (count + 1)) + 1)
    }
  }

  similarity(query: string, docId: string): number {
    const queryTokens = tokenize(query)
    const queryTF = computeTF(queryTokens)
    const docTF = this.docTFs.get(docId)
    if (!docTF)
      return 0

    let dotProduct = 0
    let queryNorm = 0
    let docNorm = 0

    const allTokens = new Set([...queryTF.keys(), ...docTF.keys()])
    for (const token of allTokens) {
      const idf = this.idf.get(token) || 1
      const qVal = (queryTF.get(token) || 0) * idf
      const dVal = (docTF.get(token) || 0) * idf

      dotProduct += qVal * dVal
      queryNorm += qVal * qVal
      docNorm += dVal * dVal
    }

    const denominator = Math.sqrt(queryNorm) * Math.sqrt(docNorm)
    return denominator === 0 ? 0 : dotProduct / denominator
  }

  search(query: string): Array<{ id: string, score: number }> {
    const results = this.docIds.map(id => ({
      id,
      score: this.similarity(query, id),
    }))
    return results.sort((a, b) => b.score - a.score)
  }
}

export { TFIDFIndex }
