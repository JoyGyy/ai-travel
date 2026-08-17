/**
 * API 与 SSE 结构类型定义
 */

export interface AiQuotaInfo {
  limit: number
  remaining: number
  used: number
}

export interface ApiSuccess {
  error?: string
  message?: string
  success?: boolean
}

export interface AuthResponse {
  success: true
  token: string
  user: AuthUser
}

export interface AuthUser {
  createdAt?: string
  id: string
  username: string
}

export interface ProfileData {
  aiQuota: AiQuotaInfo
  createdAt: string
  favoriteIds: string[]
  id: string
  username: string
}

export interface ShareResponse {
  id: string
  url: string
}

export interface SSECallbacks {
  onChunk?: (content: string) => void
  onComplete?: (data?: object) => void
  onError?: (error: Error) => void
  onFinally?: () => void
  onNotice?: (message: string) => void
  onStep?: (event: Extract<SSEEvent, { type: 'step' }>) => void
}

export type SSEEvent
  = | { content: string, type: 'chunk' }
    | { data?: object, name: string, status: 'complete' | 'start', step: number, type: 'step' }
    | { data?: object, type: 'complete' }
    | { message: string, type: 'notice' }
    | { message?: string, type: 'error' }

export interface WeatherForecast {
  date: string
  maxTemp: number
  minTemp: number
  weatherCode: number
  weatherDesc: string
}

export interface WeatherResponse {
  city: string
  feelsLike?: number
  forecast?: WeatherForecast[]
  humidity?: number
  temperature: number
  weatherCode?: number
  weatherDesc: string
  windSpeed?: number
}
