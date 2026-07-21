import assert from 'node:assert/strict'
import { test } from 'node:test'

async function importChatModule() {
  process.env.JWT_SECRET = 'test-secret-for-chat-travel-scope-123456'

  const chatUrl = new URL('./chat.js', import.meta.url)
  chatUrl.searchParams.set('case', `${process.hrtime.bigint()}`)
  return await import(chatUrl.href)
}

function createWritableResponse() {
  const chunks = []
  return {
    chunks,
    destroyed: false,
    writable: true,
    write(chunk) {
      chunks.push(chunk)
    },
  }
}

function parseSSEPayloads(chunks) {
  return chunks
    .join('')
    .split('\n\n')
    .filter(Boolean)
    .map(line => JSON.parse(line.replace(/^data: /, '')))
}

test('isTravelRelatedMessage 识别非旅游问题和旅游边缘问题', async () => {
  const { isTravelRelatedMessageForTest } = await importChatModule()

  assert.equal(await isTravelRelatedMessageForTest('帮我写一段 React 代码'), false)
  assert.equal(await isTravelRelatedMessageForTest('旅行保险怎么买？'), true)
  assert.equal(await isTravelRelatedMessageForTest('第一次出国签证需要注意什么？'), true)
  assert.equal(await isTravelRelatedMessageForTest('北京三日游怎么安排？'), true)
  assert.equal(await isTravelRelatedMessageForTest('西湖门票多少钱？'), true)
})

test('handleNonTravelMessage 用 SSE 返回简短旅游引导', async () => {
  const { getNonTravelResponseForTest, handleNonTravelMessageForTest } = await importChatModule()
  const res = createWritableResponse()

  const handled = await handleNonTravelMessageForTest('帮我写一段 React 代码', res, { delayMs: 0 })
  const payloads = parseSSEPayloads(res.chunks)
  const chunkContent = payloads.filter(item => item.type === 'chunk').map(item => item.content).join('')
  const complete = payloads.find(item => item.type === 'complete')

  assert.equal(handled, true)
  assert.equal(payloads.some(item => item.type === 'step'), false)
  assert.match(chunkContent, /旅行规划咨询/)
  assert.match(chunkContent, /北京三日游怎么安排/)
  assert.doesNotMatch(chunkContent, /React 代码示例|组件代码|function App/)
  assert.equal(complete.data.content, getNonTravelResponseForTest())
  assert.deepEqual(complete.data.sources, [])
})

test('handleNonTravelMessage 对旅游问题不拦截', async () => {
  const { handleNonTravelMessageForTest } = await importChatModule()
  const res = createWritableResponse()

  const handled = await handleNonTravelMessageForTest('成都旅游预算怎么规划？', res, { delayMs: 0 })

  assert.equal(handled, false)
  assert.deepEqual(res.chunks, [])
})
