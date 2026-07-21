/**
 * 天气信息卡片组件
 *
 * 展示目的地实时天气（温度、体感温度、湿度）和未来三天预报，
 * 根据天气描述自动匹配对应的天气图标。
 */
import type { WeatherResponse } from '@/types/api'

import './style.css'

/** 根据天气描述文本匹配对应的图标类型 */
function getWeatherIconType(desc = ''): string {
  if (desc.includes('雷') || desc.includes('暴雨'))
    return 'storm'
  if (desc.includes('雨'))
    return 'rain'
  if (desc.includes('雪'))
    return 'snow'
  if (desc.includes('雾'))
    return 'fog'
  if (desc.includes('云') || desc.includes('阴'))
    return 'cloudy'
  if (desc.includes('晴'))
    return 'sunny'
  return 'default'
}

interface WeatherIconProps {
  desc: string
  className?: string
}

function WeatherIcon({ desc, className = '' }: WeatherIconProps) {
  const type = getWeatherIconType(desc)
  return <span className={`travel-weather-icon travel-weather-icon--${type} ${className}`} aria-hidden="true" />
}

interface WeatherCardProps {
  weather: WeatherResponse | null
}

export function WeatherCard({ weather }: WeatherCardProps) {
  // 无天气数据时不渲染
  if (!weather)
    return null

  return (
    <section className="weather-card" aria-label={`${weather.city} 实时天气`}>
      {/* ---- 当前天气信息 ---- */}
      <div className="weather-card__current">
        <div className="weather-card__main">
          <div className="weather-card__temp-row">
            <WeatherIcon desc={weather.weatherDesc} className="weather-card__icon" />
            <span className="weather-card__temp">
              {weather.temperature}
              °C
            </span>
          </div>
          <p className="weather-card__desc">
            {weather.weatherDesc}
            {' '}
            · 体感
            {weather.feelsLike}
            °C
          </p>
        </div>
        <div className="weather-card__info">
          <p className="weather-card__city">
            {weather.city}
            {' '}
            · 实时天气
          </p>
          <p className="weather-card__humidity">
            湿度
            {weather.humidity}
            %
          </p>
        </div>
      </div>
      {/* ---- 未来三天预报 ---- */}
      {weather.forecast && weather.forecast.length > 0 && (
        <div className="weather-card__forecast" aria-label="未来三天天气预报">
          {weather.forecast.map((day, i) => (
            <div key={day.date} className="weather-card__forecast-item">
              <p className="weather-card__forecast-label">{i === 0 ? '今天' : i === 1 ? '明天' : '后天'}</p>
              <WeatherIcon desc={day.weatherDesc} className="weather-card__forecast-icon" />
              <p className="weather-card__forecast-temp">
                {day.minTemp}
                ~
                {day.maxTemp}
                °C
              </p>
              <p className="weather-card__forecast-desc">{day.weatherDesc}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
