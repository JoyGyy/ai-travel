'use client'

import { useCallback, useState } from 'react'

export interface RecommendParams {
  city: string
  budget: number
  days: number
}

export function useTravelRecommend() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestRecommend = useCallback(async (params: RecommendParams) => {
    setLoading(true)
    setError(null)
    setContent('')

    try {
      const res = await fetch('/api/travel/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })

      if (!res.ok) throw new Error(`请求失败：${res.status}`)
      if (!res.body) throw new Error('响应体为空')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setContent(prev => prev + chunk)
      }
    }
    catch (err) {
      setError(err instanceof Error ? err.message : '推荐生成失败')
    }
    finally {
      setLoading(false)
    }
  }, [])

  return { content, loading, error, requestRecommend }
}
