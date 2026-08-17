'use client'

import Image from 'next/image'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface TestResult {
  city?: string
  imageUrl: string
  query: string
  source?: string
}

export default function TestImagesPage() {
  const [query, setQuery] = useState('故宫')
  const [city, setCity] = useState('北京')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<null | TestResult>(null)
  const [batchResults, setBatchResults] = useState<null | Record<string, string>>(null)
  const [error, setError] = useState<null | string>(null)
  const [cacheStats, setCacheStats] = useState<null | { hitRate: number; size: number }>(null)

  // 单个查询测试
  const handleSingleTest = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const params = new URLSearchParams({ city, query })
      const response = await fetch(`/api/images/test?${params}`)
      const data = await response.json()

      if (data.success) {
        setResult(data.data)
        setCacheStats(data.cache)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败')
    } finally {
      setLoading(false)
    }
  }

  // 批量测试
  const handleBatchTest = async () => {
    setLoading(true)
    setError(null)
    setBatchResults(null)

    try {
      const response = await fetch('/api/images/test?batch=true')
      const data = await response.json()

      if (data.success) {
        setBatchResults(data.data)
        setCacheStats(data.cache)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">图片服务测试</h1>

      {/* 单个查询测试 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>单个查询测试</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              className="flex-1"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="景点名称"
              value={query}
            />
            <Input
              className="w-32"
              onChange={(e) => setCity(e.target.value)}
              placeholder="城市（可选）"
              value={city}
            />
            <Button disabled={loading} onClick={handleSingleTest}>
              {loading ? '查询中...' : '查询'}
            </Button>
          </div>

          {result && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">
                查询: {result.query} {result.city && `(${result.city})`}
              </p>
              <div className="border rounded-lg overflow-hidden">
                <Image
                  alt={result.query}
                  className="w-full h-64 object-cover"
                  height={256}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/images/defaults/attraction.jpg'
                  }}
                  src={result.imageUrl}
                  width={1024}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 break-all">URL: {result.imageUrl}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 批量测试 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>批量测试</CardTitle>
        </CardHeader>
        <CardContent>
          <Button className="mb-4" disabled={loading} onClick={handleBatchTest}>
            {loading ? '测试中...' : '测试 7 个景点'}
          </Button>

          {batchResults && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(batchResults).map(([name, url]) => (
                <div className="border rounded-lg overflow-hidden" key={name}>
                  <Image
                    alt={name}
                    className="w-full h-48 object-cover"
                    height={192}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/images/defaults/attraction.jpg'
                    }}
                    src={url}
                    width={512}
                  />
                  <div className="p-2">
                    <p className="font-medium">{name}</p>
                    <p className="text-xs text-gray-500 truncate">{url}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 错误信息 */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* 缓存统计 */}
      {cacheStats && (
        <Card>
          <CardHeader>
            <CardTitle>缓存统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">缓存大小</p>
                <p className="text-2xl font-bold">{cacheStats.size}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">命中率</p>
                <p className="text-2xl font-bold">{(cacheStats.hitRate * 100).toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 使用说明 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm">
            <h4>API 端点</h4>
            <ul>
              <li>
                <code>GET /api/images/test?query=故宫&city=北京</code> - 单个查询
              </li>
              <li>
                <code>GET /api/images/test?batch=true</code> - 批量测试
              </li>
            </ul>

            <h4>图片源优先级</h4>
            <ol>
              <li>
                <strong>Unsplash</strong> - 需要配置 <code>UNSPLASH_ACCESS_KEY</code>
              </li>
              <li>
                <strong>Pexels</strong> - 需要配置 <code>PEXELS_API_KEY</code>
              </li>
              <li>
                <strong>维基百科</strong> - 无需配置，作为备选
              </li>
            </ol>

            <h4>环境变量配置</h4>
            <p>
              在 <code>.env.local</code> 中添加：
            </p>
            <pre className="bg-gray-100 p-2 rounded">
              UNSPLASH_ACCESS_KEY=your_key_here PEXELS_API_KEY=your_key_here
            </pre>

            <h4>免费额度</h4>
            <ul>
              <li>Unsplash: 50 次/小时</li>
              <li>Pexels: 200 次/小时</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
