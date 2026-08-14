import { tool } from 'ai'
import { z } from 'zod'

import { searchAttractions } from '@/lib/services/attractions/attractionService'
import { getAllCities, retrieve } from '@/lib/services/rag'

export const travelTools = {
  compareCities: tool({
    description: '当用户询问两个城市哪个好、如何选择、对比两个目的地时调用。',
    execute: async ({ cityA, cityB }) => {
      const [a, b] = await Promise.all([
        retrieve(cityA, [], `${cityA} 景点 美食 交通 季节`),
        retrieve(cityB, [], `${cityB} 景点 美食 交通 季节`),
      ])
      return { cityA: a, cityB: b }
    },
    inputSchema: z.object({
      cityA: z.string().describe('第一个城市名称'),
      cityB: z.string().describe('第二个城市名称'),
    }),
  }),
  getCityList: tool({
    description: '当用户询问可以查询哪些城市、有哪些目的地、推荐去哪里时调用。',
    execute: async () => getAllCities(),
    inputSchema: z.object({}),
  }),
  getTravelTips: tool({
    description: '当用户询问注意事项、带什么、旅行贴士、什么时候去时调用。',
    execute: async ({ city }) => retrieve(city, [], `${city} 注意事项 旅行贴士 最佳季节`),
    inputSchema: z.object({
      city: z.string().describe('城市名称'),
    }),
  }),
  searchProductAttractions: tool({
    description:
      '当用户询问免费景点、收费景点、亲子景点、夜游景点或购票信息时调用，返回可进入详情页的产品景点。',
    execute: async (input) =>
      searchAttractions({
        city: input.city,
        keyword: input.keyword,
        page: 1,
        pageSize: 6,
        tag: input.tag,
        ticketType: input.ticketType,
      }),
    inputSchema: z.object({
      city: z.string().optional(),
      keyword: z.string().optional(),
      tag: z.string().optional(),
      ticketType: z.enum(['free', 'paid']).optional(),
    }),
  }),
  searchTravelInfo: tool({
    description: '当用户询问具体城市、景点、美食、交通、旅行季节等信息时调用，查询旅行知识库。',
    execute: async ({ city, query }) => retrieve(city, [], query || city),
    inputSchema: z.object({
      city: z.string().describe('城市名称，如杭州、北京、成都'),
      query: z.string().optional().describe('用户的具体查询内容'),
    }),
  }),
}
