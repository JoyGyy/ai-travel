import { tool } from 'ai'
import { z } from 'zod'

import { searchAttractions } from '@/lib/services/attractions/attractionService'
import { getAllCities, retrieve } from '@/lib/services/rag'

export const travelTools = {
  searchTravelInfo: tool({
    description: '当用户询问具体城市、景点、美食、交通、旅行季节等信息时调用，查询旅行知识库。',
    inputSchema: z.object({
      city: z.string().describe('城市名称，如杭州、北京、成都'),
      query: z.string().optional().describe('用户的具体查询内容'),
    }),
    execute: async ({ city, query }) => retrieve(city, [], query || city),
  }),
  getCityList: tool({
    description: '当用户询问可以查询哪些城市、有哪些目的地、推荐去哪里时调用。',
    inputSchema: z.object({}),
    execute: async () => getAllCities(),
  }),
  compareCities: tool({
    description: '当用户询问两个城市哪个好、如何选择、对比两个目的地时调用。',
    inputSchema: z.object({
      cityA: z.string().describe('第一个城市名称'),
      cityB: z.string().describe('第二个城市名称'),
    }),
    execute: async ({ cityA, cityB }) => {
      const [a, b] = await Promise.all([
        retrieve(cityA, [], `${cityA} 景点 美食 交通 季节`),
        retrieve(cityB, [], `${cityB} 景点 美食 交通 季节`),
      ])
      return { cityA: a, cityB: b }
    },
  }),
  getTravelTips: tool({
    description: '当用户询问注意事项、带什么、旅行贴士、什么时候去时调用。',
    inputSchema: z.object({
      city: z.string().describe('城市名称'),
    }),
    execute: async ({ city }) => retrieve(city, [], `${city} 注意事项 旅行贴士 最佳季节`),
  }),
  searchProductAttractions: tool({
    description: '当用户询问免费景点、收费景点、亲子景点、夜游景点或购票信息时调用，返回可进入详情页的产品景点。',
    inputSchema: z.object({
      city: z.string().optional(),
      keyword: z.string().optional(),
      ticketType: z.enum(['free', 'paid']).optional(),
      tag: z.string().optional(),
    }),
    execute: async input => searchAttractions({
      city: input.city,
      keyword: input.keyword,
      ticketType: input.ticketType,
      tag: input.tag,
      page: 1,
      pageSize: 6,
    }),
  }),
}
