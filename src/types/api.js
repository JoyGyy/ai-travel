/**
 * API 与 SSE 结构类型基线。
 * 这是 JSDoc 类型声明文件，不包含运行时代码。
 */

/**
 * @typedef {{ success?: boolean, message?: string, error?: string }} ApiSuccess
 */

/**
 * @typedef {{ id: string, username: string, createdAt?: string }} AuthUser
 */

/**
 * @typedef {{ success: true, token: string, user: AuthUser }} AuthResponse
 */

/**
 * @typedef {{ date: string, maxTemp: number, minTemp: number, weatherCode: number, weatherDesc: string }} WeatherForecast
 */

/**
 * @typedef {{ city: string, temperature: number, feelsLike?: number, humidity?: number, windSpeed?: number, weatherCode?: number, weatherDesc: string, forecast?: WeatherForecast[] }} WeatherResponse
 */

/**
 * @typedef {{ type: 'chunk', content: string } | { type: 'step', step: number, name: string, status: 'start' | 'complete', data?: object } | { type: 'notice', message: string } | { type: 'complete', data?: object } | { type: 'error', message?: string }} SSEEvent
 */

/**
 * @typedef {{ onChunk?: (content: string) => void, onStep?: (event: Extract<SSEEvent, { type: 'step' }>) => void, onNotice?: (message: string) => void, onComplete?: (data?: object) => void, onError?: (error: Error) => void, onFinally?: () => void }} SSECallbacks
 */

export {}
