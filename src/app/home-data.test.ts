import { describe, expect, it } from 'vitest'

import attractions from '@/knowledge/attractions-product.json'
import { featuredTrips, hotDestinations } from './home-data'

const localCoverImages = new Set(attractions.map(attraction => attraction.coverImage))

describe('home-data 图片', () => {
  const allImages = [
    ...hotDestinations.map(item => item.img),
    ...featuredTrips.map(item => item.image),
  ]

  it('热门目的地图片全部为本地路径', () => {
    expect(hotDestinations).toHaveLength(6)
    for (const item of hotDestinations) {
      expect(item.img).toMatch(/^\/images\/attractions\//)
    }
  })

  it('精选推荐图片全部为本地路径', () => {
    for (const item of featuredTrips) {
      expect(item.image).toMatch(/^\/images\/attractions\//)
    }
  })

  it('首页图片均来自 60 景点目录中的本地封面', () => {
    for (const image of allImages) {
      expect(localCoverImages.has(image)).toBe(true)
    }
  })
})
