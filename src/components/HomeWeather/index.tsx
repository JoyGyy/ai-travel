/**
 * 首页天气小组件
 *
 * 在首页紧凑展示当前城市的实时天气和未来三天预报，
 * 加载中显示旋转指示器。根据天气描述自动匹配天气图标。
 */
import type { WeatherResponse } from '@/types/api'

import { Droplets, LoaderCircle, MapPin, Thermometer } from 'lucide-react'

import { WeatherIcon } from '@/components/WeatherIcon'

interface HomeWeatherProps {
  loading: boolean
  weather: null | WeatherResponse
}

export function HomeWeather({ loading, weather }: HomeWeatherProps) {
  // 加载中或无数据时显示 loading 状态
  if (loading || !weather) {
    return (
      <div className="flex min-h-28 w-full min-w-0 items-center gap-3 overflow-hidden rounded-lg border border-travel-ink/8 bg-travel-surface px-5 py-4 shadow-sm">
        <LoaderCircle className="h-6 w-6 flex-none animate-spin text-primary motion-reduce:animate-none" />
        <span className="min-w-0 text-sm font-medium text-travel-muted">
          正在查询天气…
        </span>
      </div>
    )
  }

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-lg border border-travel-ink/8 bg-travel-surface shadow-sm">
      {/* ---- 当前天气 ---- */}
      <div className="grid min-w-0 gap-6 border-b border-travel-ink/8 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex h-14 w-14 flex-none items-center justify-center rounded-lg bg-primary/8 text-primary sm:h-16 sm:w-16">
            <WeatherIcon className="h-8 w-8 sm:h-9 sm:w-9" desc={weather.weatherDesc} />
          </span>
          <div className="min-w-0">
            <div className="flex items-start gap-1">
              <span className="font-serif text-[clamp(38px,10vw,56px)] font-bold leading-none tabular-nums text-travel-ink">
                {weather.temperature}
              </span>
              <span className="mt-1 text-sm font-semibold text-primary">°C</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-travel-ink">{weather.weatherDesc}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:min-w-[300px]">
          <WeatherMetric icon={MapPin} label="城市" value={weather.city} />
          <WeatherMetric icon={Thermometer} label="体感" value={`${weather.feelsLike}°`} />
          <WeatherMetric icon={Droplets} label="湿度" value={`${weather.humidity}%`} />
        </div>
      </div>
      {/* ---- 未来三天预报 ---- */}
      {weather.forecast && weather.forecast.length > 0 && (
        <div className="grid min-w-0 grid-cols-3 divide-x divide-travel-ink/8 p-3 max-[380px]:grid-cols-1 max-[380px]:divide-x-0 max-[380px]:divide-y sm:p-4">
          {weather.forecast.map((day, i) => (
            <div
              className="flex min-w-0 flex-col items-center justify-center gap-1.5 px-2 py-3 max-[380px]:min-h-14 max-[380px]:flex-row max-[380px]:justify-between max-[380px]:px-3"
              key={day.date}
            >
              <span className="text-xs font-medium text-travel-muted">
                {i === 0 ? '今天' : i === 1 ? '明天' : '后天'}
              </span>
              <WeatherIcon className="h-5 w-5 text-primary" desc={day.weatherDesc} />
              <span className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold leading-tight tabular-nums text-travel-ink">
                {day.minTemp}
                ~
                {day.maxTemp}
                °
              </span>
              <span className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs text-travel-muted">
                {day.weatherDesc}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function WeatherMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin
  label: string
  value: string
}) {
  return (
    <div className="min-w-0 rounded-lg bg-travel-surface-muted px-2 py-3 text-center">
      <Icon aria-hidden="true" className="mx-auto mb-1.5 h-4 w-4 text-primary" />
      <p className="text-2.5 font-medium text-travel-muted">{label}</p>
      <p className="mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-semibold tabular-nums text-travel-ink">
        {value}
      </p>
    </div>
  )
}
