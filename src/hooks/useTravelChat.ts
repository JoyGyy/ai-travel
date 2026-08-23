'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'

import { getCsrfHeaders } from '@/api/client'

export function useTravelChat() {
  return useChat({
    id: 'travel-chat',
    transport: new DefaultChatTransport({
      api: '/api/travel/chat',
      credentials: 'include',
      headers: getCsrfHeaders,
    }),
  })
}
