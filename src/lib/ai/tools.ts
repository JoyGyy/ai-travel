import { tool } from 'ai'
import { z } from 'zod'

import { searchAttractions } from '@/lib/services/attractions/attractionService'
import { getAllCities, retrieve } from '@/lib/services/rag'

export const travelTools = {
  compareCities: tool({
    description:
      '仅当用户明确对比两个不同的独立城市（如“成都和重庆哪个更好玩”、“去北京还是去上海”）时调用。严禁在针对同一城市内的不同路线、方向或景点对比时调用。',
    execute: async ({ cityA, cityB }) => {
      if (cityA.trim() === cityB.trim()) {
        return retrieve(cityA, [], `${cityA} 旅游攻略 景点 路线 交通 季节`)
      }
      const [a, b] = await Promise.all([
        retrieve(cityA, [], `${cityA} 景点 美食 交通 季节`),
        retrieve(cityB, [], `${cityB} 景点 美食 交通 季节`),
      ])
      return { cityA: a, cityB: b }
    },
    inputSchema: z.object({
      cityA: z.string().describe('第一个城市名称（必须与第二个城市不同）'),
      cityB: z.string().describe('第二个城市名称（必须与第一个城市不同）'),
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
    execute: async input =>
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
    description: '当用户询问具体城市、景点、美食、交通、旅行季节、特色游览路线（如环洱海顺时针/逆时针方向对比、环湖路线）等信息时调用，查询旅行知识库。',
    execute: async ({ city, query }) => retrieve(city, [], query || city),
    inputSchema: z.object({
      city: z.string().describe('城市名称，如大理、杭州、北京、成都'),
      query: z.string().optional().describe('用户的具体查询内容，如“环洱海顺时针还是逆时针”、“美食推荐”等'),
    }),
  }),
}
