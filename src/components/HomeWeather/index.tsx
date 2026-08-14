/**
 * 首页天气小组件
 *
 * 在首页紧凑展示当前城市的实时天气和未来三天预报，
 * 加载中显示旋转指示器。根据天气描述自动匹配天气图标。
 */
import type { WeatherResponse } from '@/types/api'

import './style.css'

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
      <div aria-live="polite" className="home-weather home-weather--loading" role="status">
        <div aria-hidden="true" className="home-weather__spinner" />
        <span className="home-weather__loading-text">正在查询天气…</span>
      </div>
    )
  }

  return (
    <section aria-label={`${weather.city} 天气概览`} className="home-weather">
      {/* ---- 当前天气 ---- */}
      <div className="home-weather__current">
        <div className="home-weather__main">
          <WeatherIcon className="home-weather__icon" desc={weather.weatherDesc} />
          <div>
            <div className="home-weather__temp-row">
              <span className="home-weather__temp">{weather.temperature}</span>
              <span className="home-weather__unit">°C</span>
            </div>
            <p className="home-weather__desc">
              {weather.weatherDesc} · 体感
              {weather.feelsLike}
              °C
            </p>
          </div>
        </div>
        <div className="home-weather__info">
          <p className="home-weather__city">{weather.city}</p>
          <p className="home-weather__humidity">
            湿度
            {weather.humidity}%
          </p>
        </div>
      </div>
      {/* ---- 未来三天预报 ---- */}
      {weather.forecast && weather.forecast.length > 0 && (
        <div aria-label="未来三天天气预报" className="home-weather__forecast">
          {weather.forecast.map((day, i) => (
            <div className="home-weather__forecast-item" key={day.date}>
              <span className="home-weather__forecast-label">
                {i === 0 ? '今天' : i === 1 ? '明天' : '后天'}
              </span>
              <WeatherIcon className="home-weather__forecast-icon" desc={day.weatherDesc} />
              <span className="home-weather__forecast-temp">
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
