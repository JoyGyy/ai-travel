'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'

export function useTravelRecommend() {
  return useChat({
    id: 'travel-recommend',
    transport: new DefaultChatTransport({
      api: '/api/travel/recommend',
    }),
  })
}
