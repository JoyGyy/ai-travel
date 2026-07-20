import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  getAttractionById,
  getAttractionMeta,
  listAttractions,
  searchAttractions,
} from './providers/localAttractionProvider.js'

test('按城市、收费类型和标签筛选景点', () => {
  const items = listAttractions({ city: '北京', ticketType: 'free', tag: '博物馆' })

  assert.equal(items.length, 1)
  assert.equal(items[0].id, 'beijing-national-museum')
  assert.equal(items[0].ticketType, 'free')
  assert.ok(items[0].tags.includes('博物馆'))
})

test('空关键词不会影响其他筛选条件', () => {
  const items = searchAttractions({
    keyword: '',
    city: '成都',
    ticketType: 'paid',
    tag: '动物',
  })

  assert.equal(items.length, 1)
  assert.equal(items[0].id, 'chengdu-panda-base')
})

test('组合筛选条件会共同生效', () => {
  const items = listAttractions({
    city: '西安',
    ticketType: 'free',
    tag: '博物馆',
  })

  assert.equal(items.length, 1)
  assert.equal(items[0].id, 'xian-shaanxi-history-museum')
})

test('按关键词搜索景点名称、别名和简介', () => {
  const items = searchAttractions({ keyword: '熊猫' })

  assert.equal(items.length, 1)
  assert.equal(items[0].id, 'chengdu-panda-base')
})

test('根据 id 获取景点详情', () => {
  const item = getAttractionById('hangzhou-west-lake')

  assert.equal(item.name, '西湖')
  assert.equal(item.city, '杭州')
  assert.equal(item.ticketType, 'free')
})

test('未命中的 id 返回 null', () => {
  const item = getAttractionById('not-exist-attraction')

  assert.equal(item, null)
})

test('返回城市和标签元数据，且标签按 localeCompare 排序', () => {
  const meta = getAttractionMeta()

  assert.deepEqual(meta.cities, ['北京', '上海', '杭州', '成都', '西安'])
  assert.ok(meta.tags.includes('历史'))
  assert.ok(meta.tags.includes('亲子'))
  assert.deepEqual(meta.tags, [...meta.tags].sort((a, b) => a.localeCompare(b, 'zh-CN')))
})
