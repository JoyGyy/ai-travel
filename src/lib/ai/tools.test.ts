import { travelTools } from './tools'

describe('travelTools', () => {
  it('暴露旅行工具集合', () => {
    expect(Object.keys(travelTools).sort()).toEqual([
      'compareCities',
      'getCityList',
      'getTravelTips',
      'searchProductAttractions',
      'searchTravelInfo',
    ])
  })
})
