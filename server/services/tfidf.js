/**
 * TF-IDF 语义检索模块
 * 基于 TF-IDF + 余弦相似度的中文文本匹配
 *
 * 面试要点：
 * - TF（词频）= 某词在文档中出现的次数 / 文档总词数
 * - IDF（逆文档频率）= log(总文档数 / 包含该词的文档数)
 * - TF-IDF = TF × IDF，衡量词对文档的重要程度
 * - 余弦相似度 = cos(A,B) = (A·B) / (|A|×|B|)，衡量两个向量的方向相似性
 */

/**
 * 中文分词器
 * 使用 unigram + bigram 切分，适合短文本匹配
 * @param {string} text - 输入文本
 * @returns {string[]} 分词结果
 */
function tokenize(text) {
  if (!text) return []
  // 去除标点和空白，转小写
  const cleaned = text.replace(/[，。！？、；：""''（）《》【】\s\-.]/g, '').toLowerCase()
  const tokens = []

  for (let i = 0; i < cleaned.length; i++) {
    // unigram（单字）
    tokens.push(cleaned[i])
    // bigram（双字组合，捕捉更多语义）
    if (i + 1 < cleaned.length) {
      tokens.push(cleaned[i] + cleaned[i + 1])
    }
  }

  return tokens.filter(t => t.length > 0)
}

/**
 * 计算词频（TF）
 * @param {string[]} tokens - 分词结果
 * @returns {Map<string, number>} 词频映射
 */
function computeTF(tokens) {
  const tf = new Map()
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1)
  }
  // 归一化：除以总词数
  const total = tokens.length || 1
  for (const [key, val] of tf) {
    tf.set(key, val / total)
  }
  return tf
}

/**
 * TF-IDF 索引类
 * 对文档集合建立索引，支持查询相似度
 */
class TFIDFIndex {
  constructor() {
    /** @type {Map<string, number>} IDF 值缓存 */
    this.idf = new Map()
    /** @type {Map<string, Map<string, number>>} 每个文档的 TF 向量 */
    this.docTFs = new Map()
    /** @type {string[]} 文档 ID 列表 */
    this.docIds = []
    /** @type {number} 文档总数 */
    this.totalDocs = 0
  }

  /**
   * 构建索引
   * @param {Array<{id: string, text: string}>} documents - 文档列表
   */
  buildIndex(documents) {
    this.totalDocs = documents.length
    this.docIds = documents.map(d => d.id)

    // 计算每个文档的 TF
    const docTokenSets = []
    for (const doc of documents) {
      const tokens = tokenize(doc.text)
      const tf = computeTF(tokens)
      this.docTFs.set(doc.id, tf)
      docTokenSets.push(new Set(tokens))
    }

    // 计算 IDF：log(N / df)，df = 包含该词的文档数
    const df = new Map()
    for (const tokenSet of docTokenSets) {
      for (const token of tokenSet) {
        df.set(token, (df.get(token) || 0) + 1)
      }
    }

    for (const [token, count] of df) {
      // 使用平滑 IDF：log(N / (df + 1)) + 1，避免除零
      this.idf.set(token, Math.log(this.totalDocs / (count + 1)) + 1)
    }
  }

  /**
   * 计算查询与文档的余弦相似度
   * @param {string} query - 查询文本
   * @param {string} docId - 文档 ID
   * @returns {number} 相似度分数（0-1）
   */
  similarity(query, docId) {
    const queryTokens = tokenize(query)
    const queryTF = computeTF(queryTokens)
    const docTF = this.docTFs.get(docId)
    if (!docTF) return 0

    // 构建 TF-IDF 向量（只计算查询和文档共有的词）
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

  /**
   * 批量计算查询与所有文档的相似度
   * @param {string} query - 查询文本
   * @returns {Array<{id: string, score: number}>} 按相似度降序排列的结果
   */
  search(query) {
    const results = this.docIds.map(id => ({
      id,
      score: this.similarity(query, id),
    }))
    return results.sort((a, b) => b.score - a.score)
  }
}

export { TFIDFIndex, tokenize, computeTF }
