/**
 * 天气信息卡片组件
 *
 * 展示目的地实时天气（温度、体感温度、湿度）和未来三天预报，
 * 根据天气描述自动匹配对应的天气图标。
 */
import type { WeatherResponse } from '@/types/api'

interface WeatherCardProps {
  weather: null | WeatherResponse
}

interface WeatherIconProps {
  className?: string
  desc: string
}

export function WeatherCard({ weather }: WeatherCardProps) {
  // 无天气数据时不渲染
  if (!weather) return null

  return (
    <section aria-label={`${weather.city} 实时天气`} className="max-w-[900px] mx-auto overflow-hidden rounded-3xl bg-[var(--travel-surface)] shadow-[var(--shadow-paper)] border border-[rgba(28,25,23,0.06)]">
      {/* ---- 当前天气信息 ---- */}
      <div
        className="relative flex items-center justify-between gap-5 p-[20px_22px] overflow-hidden max-[560px]:items-start max-[560px]:flex-col"
        style={{ background: 'var(--texture-dots) 12px 12px, rgba(var(--travel-primary-rgb), 0.04)' }}
      >
        <div className="relative z-[1]">
          <div className="flex items-center gap-2.5 mb-1.5">
            <WeatherIcon className="[--weather-icon-size:32px]" desc={weather.weatherDesc} />
            <span className="text-[28px] leading-none font-extrabold font-serif text-[var(--travel-ocean)] tabular-nums">
              {weather.temperature}
              °C
            </span>
          </div>
          <p className="text-[13px] text-[var(--travel-ink)]">
            {weather.weatherDesc} · 体感
            {weather.feelsLike}
            °C
          </p>
        </div>
        <div className="relative z-[1] text-right max-[560px]:w-full max-[560px]:text-left">
          <p className="mb-1.5 text-xs font-extrabold text-[var(--travel-ocean)]">{weather.city} · 实时天气</p>
          <p className="w-fit ml-auto py-1 px-2.5 rounded-full bg-[rgba(var(--travel-white-rgb),0.48)] text-[rgba(var(--travel-ink-rgb),0.68)] text-[11px] font-bold tabular-nums max-[560px]:ml-0">
            湿度
            {weather.humidity}%
          </p>
        </div>
      </div>
      {/* ---- 未来三天预报 ---- */}
      {weather.forecast && weather.forecast.length > 0 && (
        <div aria-label="未来三天天气预报" className="flex gap-3 p-3.5 border-t border-[rgba(var(--travel-ocean-rgb),0.08)] bg-[rgba(var(--travel-white-rgb),0.28)] max-[560px]:gap-2 max-[560px]:p-2.5">
          {weather.forecast.map((day, i) => (
            <div className="flex-1 min-w-0 py-3 px-2 rounded-[18px] text-center bg-[rgba(var(--travel-white-rgb),0.5)] border border-[rgba(var(--travel-white-rgb),0.64)]" key={day.date}>
              <p className="mb-1.5 text-[11px] font-extrabold text-[rgba(var(--travel-ocean-rgb),0.64)]">
                {i === 0 ? '今天' : i === 1 ? '明天' : '后天'}
              </p>
              <WeatherIcon className="mx-auto mb-1 [--weather-icon-size:24px]" desc={day.weatherDesc} />
              <p className="text-xs font-extrabold text-[var(--travel-ocean)] tabular-nums">
                {day.minTemp}~{day.maxTemp}
                °C
              </p>
              <p className="mt-[3px] [overflow-wrap:anywhere] text-[10px] text-[var(--travel-ink)]">{day.weatherDesc}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

/** 根据天气描述文本匹配对应的图标类型 */
function getWeatherIconType(desc = ''): string {
  if (desc.includes('雷') || desc.includes('暴雨')) return 'storm'
  if (desc.includes('雨')) return 'rain'
  if (desc.includes('雪')) return 'snow'
  if (desc.includes('雾')) return 'fog'
  if (desc.includes('云') || desc.includes('阴')) return 'cloudy'
  if (desc.includes('晴')) return 'sunny'
  return 'default'
}

function WeatherIcon({ className = '', desc }: WeatherIconProps) {
  const type = getWeatherIconType(desc)
  return (
    <span
      aria-hidden="true"
      className={`travel-weather-icon travel-weather-icon--${type} ${className}`}
    />
  )
}
