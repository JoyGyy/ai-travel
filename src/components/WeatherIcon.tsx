/**
 * 共享天气图标组件
 * 根据天气描述文本自动匹配对应的图标
 */
import type { LucideIcon } from 'lucide-react'

import { CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun } from 'lucide-react'

interface WeatherIconProps {
  className?: string
  desc: string
}

export type WeatherIconType = 'cloudy' | 'default' | 'fog' | 'rain' | 'snow' | 'storm' | 'sunny'

const WEATHER_ICONS: Record<WeatherIconType, LucideIcon> = {
  cloudy: CloudSun,
  default: CloudSun,
  fog: CloudFog,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
  sunny: Sun,
}

/** 根据天气描述文本匹配对应的图标类型 */
// eslint-disable-next-line react-refresh/only-export-components
export function getWeatherIconType(desc = ''): WeatherIconType {
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
  const Icon = WEATHER_ICONS[type]
  return <Icon aria-hidden="true" className={className} strokeWidth={1.8} />
}
