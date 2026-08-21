'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'

interface TravelRecommendParams {
  city: string
  budget: number
  days: number
}

export function useTravelRecommend(params: TravelRecommendParams) {
  return useChat({
    id: 'travel-recommend',
    transport: new DefaultChatTransport({
      api: '/api/travel/recommend',
      body: params,
    }),
  })
}
