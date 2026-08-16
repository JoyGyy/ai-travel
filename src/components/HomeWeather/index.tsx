/**
 * 首页天气小组件
 *
 * 在首页紧凑展示当前城市的实时天气和未来三天预报，
 * 加载中显示旋转指示器。根据天气描述自动匹配天气图标。
 */
import type { WeatherResponse } from '@/types/api'

interface HomeWeatherProps {
  loading: boolean
  weather: null | WeatherResponse
}

interface WeatherIconProps {
  className?: string
  desc: string
}

export function HomeWeather({ loading, weather }: HomeWeatherProps) {
  // 加载中或无数据时显示 loading 状态
  if (loading || !weather) {
    return (
      <div aria-live="polite" className="w-full min-w-0 overflow-hidden border border-[rgba(28,25,23,0.06)] rounded-[var(--travel-radius-xl)] bg-[var(--travel-surface)] shadow-[var(--shadow-paper)] min-h-[92px] py-[18px] px-5 flex items-center gap-3" role="status">
        <div aria-hidden="true" className="w-8 h-8 flex-[0_0_auto] border-2 border-[rgba(46,198,213,0.24)] border-t-[var(--color-primary)] rounded-full animate-[spin_1s_linear_infinite] motion-reduce:animate-[spin_1.8s_linear_infinite]" />
        <span className="min-w-0 text-[rgba(62,73,88,0.7)] text-[13px] font-bold">正在查询天气…</span>
      </div>
    )
  }

  return (
    <section aria-label={`${weather.city} 天气概览`} className="w-full min-w-0 overflow-hidden border border-[rgba(28,25,23,0.06)] rounded-[var(--travel-radius-xl)] max-sm:rounded-[20px] bg-[var(--travel-surface)] shadow-[var(--shadow-paper)]">
      {/* ---- 当前天气 ---- */}
      <div className="min-w-0 p-5 flex items-center justify-between gap-4 max-sm:p-4 max-sm:flex-col max-sm:items-stretch">
        <div className="min-w-0 flex items-center gap-3.5 max-sm:items-start">
          <WeatherIcon className="[--weather-icon-size:54px] max-sm:[--weather-icon-size:48px]" desc={weather.weatherDesc} />
          <div className="min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-[clamp(30px,8vw,42px)] font-black font-serif leading-none tracking-[-0.04em] tabular-nums text-[var(--travel-ocean)]" style={{ textShadow: '0 8px 24px rgba(var(--travel-primary-rgb), 0.18)' }}>
                {weather.temperature}
              </span>
              <span className="text-[var(--color-primary)] text-[15px] font-black">°C</span>
            </div>
            <p className="min-w-0 mt-1.5 overflow-hidden text-[rgba(62,73,88,0.68)] text-xs font-bold leading-[1.35] text-ellipsis whitespace-nowrap">
              {weather.weatherDesc} · 体感
              {weather.feelsLike}
              °C
            </p>
          </div>
        </div>
        <div className="min-w-[88px] flex-[0_1_auto] text-right max-sm:min-w-0 max-sm:flex max-sm:items-center max-sm:justify-between max-sm:gap-3 max-sm:text-left">
          <p className="m-0 overflow-hidden text-[var(--travel-ocean)] text-[15px] font-black leading-[1.35] text-ellipsis whitespace-nowrap">{weather.city}</p>
          <p className="mt-[5px] text-[rgba(62,73,88,0.62)] text-xs font-extrabold tabular-nums max-sm:flex-[0_0_auto] max-sm:mt-0">
            湿度
            {weather.humidity}%
          </p>
        </div>
      </div>
      {/* ---- 未来三天预报 ---- */}
      {weather.forecast && weather.forecast.length > 0 && (
        <div aria-label="未来三天天气预报" className="min-w-0 px-3.5 pb-3.5 grid grid-cols-3 gap-2.5 max-sm:px-2.5 max-sm:pb-2.5 max-sm:gap-2 max-[380px]:grid-cols-1">
          {weather.forecast.map((day, i) => (
            <div className="min-w-0 min-h-[88px] py-2.5 px-2 flex flex-col items-center justify-center gap-[5px] border border-[rgba(28,25,23,0.05)] rounded-2xl bg-[rgba(28,25,23,0.02)] shadow-[0_10px_24px_rgba(41,37,36,0.08)] max-sm:min-h-[78px] max-sm:py-[9px] max-sm:px-1.5 max-[380px]:min-h-[64px] max-[380px]:flex-row max-[380px]:justify-between max-[380px]:py-2.5 max-[380px]:px-3" key={day.date}>
              <span className="text-[rgba(41,37,36,0.62)] text-[11px] font-black tracking-[0.08em]">
                {i === 0 ? '今天' : i === 1 ? '明天' : '后天'}
              </span>
              <WeatherIcon className="[--weather-icon-size:22px]" desc={day.weatherDesc} />
              <span className="max-w-full overflow-hidden text-[var(--color-primary)] text-xs font-black leading-[1.25] text-ellipsis whitespace-nowrap tabular-nums">
                {day.minTemp}~{day.maxTemp}°
              </span>
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
