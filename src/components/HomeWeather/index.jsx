/**
 * 首页天气小组件
 * 紧凑展示当前城市天气和未来预报
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

export function HomeWeather({ weather, loading }) {
  if (loading || !weather) {
    return (
      <div className="home-weather home-weather--loading">
        <div className="home-weather__spinner" />
        <span className="home-weather__loading-text">正在查询天气...</span>
      </div>
    )
  }

  return (
    <div className="home-weather">
      <div className="home-weather__current">
        <div className="home-weather__main">
          <span className="home-weather__emoji">{getWeatherEmoji(weather.weatherDesc)}</span>
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
        <div className="home-weather__forecast">
          {weather.forecast.map((day, i) => (
            <div key={i} className="home-weather__forecast-item">
              <span className="home-weather__forecast-label">{i === 0 ? '今天' : i === 1 ? '明天' : '后天'}</span>
              <span className="home-weather__forecast-emoji">{getWeatherEmoji(day.weatherDesc)}</span>
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
    </div>
  )
}
