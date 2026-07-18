/**
 * API 与 SSE 结构类型定义
 */

export interface ApiSuccess {
  success?: boolean
  message?: string
  error?: string
}

export interface AuthUser {
  id: string
  username: string
  createdAt?: string
}

export interface AuthResponse {
  success: true
  token: string
  user: AuthUser
}

export interface WeatherForecast {
  date: string
  maxTemp: number
  minTemp: number
  weatherCode: number
  weatherDesc: string
}

export interface WeatherResponse {
  city: string
  temperature: number
  feelsLike?: number
  humidity?: number
  windSpeed?: number
  weatherCode?: number
  weatherDesc: string
  forecast?: WeatherForecast[]
}

export type SSEEvent =
  | { type: 'chunk'; content: string }
  | { type: 'step'; step: number; name: string; status: 'start' | 'complete'; data?: object }
  | { type: 'notice'; message: string }
  | { type: 'complete'; data?: object }
  | { type: 'error'; message?: string }

export interface SSECallbacks {
  onChunk?: (content: string) => void
  onStep?: (event: Extract<SSEEvent, { type: 'step' }>) => void
  onNotice?: (message: string) => void
  onComplete?: (data?: object) => void
  onError?: (error: Error) => void
  onFinally?: () => void
}
