/**
 * 天气信息卡片
 * 展示目的地实时天气和未来几天预报
 */
import type { WeatherInfo } from '@/types'

interface WeatherCardProps {
  weather: WeatherInfo
}

/** 天气描述对应的 emoji */
const weatherEmoji: Record<string, string> = {
  '晴': '☀️',
  '多云': '⛅',
  '阴': '☁️',
  '阴天': '☁️',
  '小雨': '🌦️',
  '中雨': '🌧️',
  '大雨': '⛈️',
  '暴雨': '⛈️',
  '雷阵雨': '⛈️',
  '小雪': '❄️',
  '中雪': '❄️',
  '大雪': '❄️',
  '暴风雪': '❄️',
  '雾': '🌫️',
}

function getWeatherEmoji(desc: string): string {
  for (const [key, emoji] of Object.entries(weatherEmoji)) {
    if (desc.includes(key)) return emoji
  }
  return '🌤️'
}

export function WeatherCard({ weather }: WeatherCardProps) {
  return (
    <div
      className="mx-4 rounded-2xl overflow-hidden md:mx-auto md:max-w-4xl"
      style={{ background: 'var(--c-white)', boxShadow: 'var(--shadow-sm)', border: '1px solid rgba(240, 232, 221, 0.4)' }}
    >
      {/* 当前天气 */}
      <div
        className="px-5 py-4"
        style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.06) 0%, rgba(129, 140, 248, 0.04) 100%)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{getWeatherEmoji(weather.weatherDesc)}</span>
              <span className="text-[20px] font-bold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-ink)' }}>
                {weather.temperature}°C
              </span>
            </div>
            <p className="text-[13px]" style={{ color: 'var(--c-ink-light)' }}>
              {weather.weatherDesc} &middot; 体感 {weather.feelsLike}°C
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] mb-1" style={{ color: 'var(--c-ink-light)' }}>
              {weather.city} · 实时天气
            </p>
            <p className="text-[11px]" style={{ color: 'var(--c-ink-light)' }}>
              湿度 {weather.humidity}%
            </p>
          </div>
        </div>
      </div>

      {/* 未来预报 */}
      {weather.forecast && weather.forecast.length > 0 && (
        <div className="px-5 py-3 border-t" style={{ borderColor: 'rgba(240, 232, 221, 0.5)' }}>
          <div className="flex gap-3">
            {weather.forecast.map((day, i) => (
              <div key={i} className="flex-1 text-center">
                <p className="text-[11px] mb-1" style={{ color: 'var(--c-ink-light)' }}>
                  {i === 0 ? '今天' : i === 1 ? '明天' : '后天'}
                </p>
                <p className="text-lg mb-0.5">{getWeatherEmoji(day.weatherDesc)}</p>
                <p className="text-[12px] font-medium" style={{ color: 'var(--c-ink)' }}>
                  {day.minTemp}~{day.maxTemp}°C
                </p>
                <p className="text-[10px]" style={{ color: 'var(--c-ink-light)' }}>
                  {day.weatherDesc}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
