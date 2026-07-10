/**
 * 天气信息卡片
 * 展示目的地实时天气和未来几天预报
 */
import './style.css'

const weatherEmoji = {
  晴: '☀️',
  多云: '⛅',
  阴: '☁️',
  阴天: '☁️',
  小雨: '🌦️',
  中雨: '🌧️',
  大雨: '⛈️',
  暴雨: '⛈️',
  雷阵雨: '⛈️',
  小雪: '❄️',
  中雪: '❄️',
  大雪: '❄️',
  暴风雪: '❄️',
  雾: '🌫️',
}

function getWeatherEmoji(desc) {
  for (const [key, emoji] of Object.entries(weatherEmoji)) {
    if (desc.includes(key))
      return emoji
  }
  return '🌤️'
}

export function WeatherCard({ weather }) {
  if (!weather)
    return null

  return (
    <div className="weather-card">
      <div className="weather-card__current">
        <div className="weather-card__main">
          <div className="weather-card__temp-row">
            <span className="weather-card__emoji">{getWeatherEmoji(weather.weatherDesc)}</span>
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
      {weather.forecast && weather.forecast.length > 0 && (
        <div className="weather-card__forecast">
          {weather.forecast.map((day, i) => (
            <div key={i} className="weather-card__forecast-item">
              <p className="weather-card__forecast-label">{i === 0 ? '今天' : i === 1 ? '明天' : '后天'}</p>
              <p className="weather-card__forecast-emoji">{getWeatherEmoji(day.weatherDesc)}</p>
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
    </div>
  )
}
