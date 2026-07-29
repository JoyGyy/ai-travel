'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'

export function useTravelChat() {
  return useChat({
    id: 'travel-chat',
    transport: new DefaultChatTransport({
      api: '/api/travel/chat',
    }),
  })
}
