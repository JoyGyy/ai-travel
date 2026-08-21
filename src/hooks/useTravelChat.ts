'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState } from 'react'

export type ModelProvider = 'deepseek' | 'siliconflow'

export function useTravelChat() {
  const [model, setModelState] = useState<ModelProvider>('siliconflow')

  function setModel(newModel: ModelProvider) {
    setModelState(newModel)
  }

  const chat = useChat({
    id: 'travel-chat',
    transport: new DefaultChatTransport({
      api: '/api/travel/chat',
      body: { model },
    }),
  })

  return {
    ...chat,
    model,
    setModel,
  }
}
