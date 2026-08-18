/**
 * 共享天气图标组件
 * 根据天气描述文本自动匹配对应的图标
 */

interface WeatherIconProps {
  className?: string
  desc: string
}

/** 根据天气描述文本匹配对应的图标类型 */
// eslint-disable-next-line react-refresh/only-export-components
export function getWeatherIconType(desc = ''): string {
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

export function WeatherIcon({ className = '', desc }: WeatherIconProps) {
  const type = getWeatherIconType(desc)
  return (
    <span
      aria-hidden="true"
      className={`travel-weather-icon travel-weather-icon--${type} ${className}`}
    />
  )
}
