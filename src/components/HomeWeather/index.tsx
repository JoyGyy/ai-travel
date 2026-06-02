/**
 * 首页天气小组件
 * 紧凑展示当前城市天气和未来预报
 */
import type { WeatherInfo } from '@/types'

const weatherEmoji: Record<string, string> = {
  '晴': '☀️', '多云': '⛅', '阴': '☁️', '阴天': '☁️',
  '小雨': '🌦️', '中雨': '🌧️', '大雨': '⛈️', '暴雨': '⛈️',
  '雷阵雨': '⛈️', '小雪': '❄️', '中雪': '❄️', '大雪': '❄️',
  '暴风雪': '❄️', '雾': '🌫️',
}

function getWeatherEmoji(desc: string): string {
  for (const [key, emoji] of Object.entries(weatherEmoji)) {
    if (desc.includes(key)) return emoji
  }
  return '🌤️'
}

interface HomeWeatherProps {
  weather: WeatherInfo
  loading?: boolean
}

export function HomeWeather({ weather, loading }: HomeWeatherProps) {
  if (loading) {
    return (
      <div
        className="rounded-2xl px-5 py-4 flex items-center gap-3"
        style={{ background: 'var(--c-white)', boxShadow: 'var(--shadow-sm)', border: '1px solid rgba(240, 232, 221, 0.4)' }}
      >
        <div
          className="w-8 h-8 rounded-full border-2 border-dotted animate-spin"
          style={{ borderColor: 'var(--c-paper-dark)', borderTopColor: 'var(--c-terracotta)' }}
        />
        <span className="text-[13px]" style={{ color: 'var(--c-ink-light)' }}>正在查询天气...</span>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--c-white)', boxShadow: 'var(--shadow-sm)', border: '1px solid rgba(240, 232, 221, 0.4)' }}
    >
      {/* 当前天气 */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getWeatherEmoji(weather.weatherDesc)}</span>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[28px] font-bold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-ink)' }}>
                {weather.temperature}
              </span>
              <span className="text-[13px]" style={{ color: 'var(--c-ink-light)' }}>°C</span>
            </div>
            <p className="text-[12px]" style={{ color: 'var(--c-ink-light)' }}>
              {weather.weatherDesc} · 体感 {weather.feelsLike}°C
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[13px] font-semibold" style={{ color: 'var(--c-ink)' }}>{weather.city}</p>
          <p className="text-[11px]" style={{ color: 'var(--c-ink-light)' }}>湿度 {weather.humidity}%</p>
        </div>
      </div>

      {/* 未来预报 */}
      {weather.forecast && weather.forecast.length > 0 && (
        <div className="flex border-t px-3 py-3" style={{ borderColor: 'rgba(240, 232, 221, 0.5)' }}>
          {weather.forecast.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <span className="text-[11px]" style={{ color: 'var(--c-ink-light)' }}>
                {i === 0 ? '今天' : i === 1 ? '明天' : '后天'}
              </span>
              <span className="text-lg">{getWeatherEmoji(day.weatherDesc)}</span>
              <span className="text-[12px] font-medium" style={{ color: 'var(--c-ink)' }}>
                {day.minTemp}~{day.maxTemp}°
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
