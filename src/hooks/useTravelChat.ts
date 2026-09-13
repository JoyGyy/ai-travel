'use client'

import { useMemo } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'

import { getCsrfHeaders } from '@/api/client'

export function useTravelChat() {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/travel/chat',
        credentials: 'include',
        headers: getCsrfHeaders,
      }),
    [],
  )

  return useChat({
    id: 'travel-chat',
    transport,
  })
}
