/**
 * 首页天气小组件
 * 紧凑展示当前城市天气和未来预报
 */
import type { WeatherResponse } from '@/types/api'

import './style.css'

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

interface HomeWeatherProps {
  weather: WeatherResponse | null
  loading: boolean
}

export function HomeWeather({ weather, loading }: HomeWeatherProps) {
  if (loading || !weather) {
    return (
      <div className="home-weather home-weather--loading" role="status" aria-live="polite">
        <div className="home-weather__spinner" aria-hidden="true" />
        <span className="home-weather__loading-text">正在查询天气…</span>
      </div>
    )
  }

  return (
    <section className="home-weather" aria-label={`${weather.city} 天气概览`}>
      <div className="home-weather__current">
        <div className="home-weather__main">
          <WeatherIcon desc={weather.weatherDesc} className="home-weather__icon" />
          <div>
            <div className="home-weather__temp-row">
              <span className="home-weather__temp">{weather.temperature}</span>
              <span className="home-weather__unit">°C</span>
            </div>
            <p className="home-weather__desc">
              {weather.weatherDesc}
              {' '}
              · 体感
              {weather.feelsLike}
              °C
            </p>
          </div>
        </div>
        <div className="home-weather__info">
          <p className="home-weather__city">{weather.city}</p>
          <p className="home-weather__humidity">
            湿度
            {weather.humidity}
            %
          </p>
        </div>
      </div>
      {weather.forecast && weather.forecast.length > 0 && (
        <div className="home-weather__forecast" aria-label="未来三天天气预报">
          {weather.forecast.map((day, i) => (
            <div key={day.date} className="home-weather__forecast-item">
              <span className="home-weather__forecast-label">{i === 0 ? '今天' : i === 1 ? '明天' : '后天'}</span>
              <WeatherIcon desc={day.weatherDesc} className="home-weather__forecast-icon" />
              <span className="home-weather__forecast-temp">
                {day.minTemp}
                ~
                {day.maxTemp}
                °
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
