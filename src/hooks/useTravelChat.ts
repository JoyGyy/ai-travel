'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState } from 'react'

export type ModelProvider = string

export function useTravelChat() {
  const [model, setModelState] = useState<ModelProvider>('siliconflow')

  function setModel(newModel: ModelProvider) {
    setModelState(newModel)
  }

  const chat = useChat({
    id: 'travel-chat',
    transport: new DefaultChatTransport({
      api: '/api/travel/chat',
      body: () => {
        // 每次发送时动态获取 model 和 customModel 配置
        const configs = JSON.parse(localStorage.getItem('travel-custom-model-configs') || '{}')
        const customModel = configs[model] || null
        return {
          customModel,
          model,
        }
      },
    }),
  })

  return {
    ...chat,
    model,
    setModel,
  }
}
