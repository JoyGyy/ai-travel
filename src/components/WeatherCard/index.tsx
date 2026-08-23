/**
 * 天气信息卡片组件
 *
 * 展示目的地实时天气（温度、体感温度、湿度）和未来三天预报，
 * 根据天气描述自动匹配对应的天气图标。
 */
import type { WeatherResponse } from '@/types/api'

import { WeatherIcon } from '@/components/WeatherIcon'

interface WeatherCardProps {
  weather: null | WeatherResponse
}

export function WeatherCard({ weather }: WeatherCardProps) {
  // 无天气数据时不渲染
  if (!weather)
    return null

  return (
    <section
      className="max-w-[900px] mx-auto overflow-hidden rounded-3xl bg-[#FDFBF7] shadow-sm border border-stone-200/90"
    >
      {/* ---- 当前天气信息 ---- */}
      <div
        className="relative flex items-center justify-between gap-5 p-5 sm:p-6 overflow-hidden max-[560px]:items-start max-[560px]:flex-col bg-gradient-to-r from-emerald-50/50 via-[#FAF7F0] to-amber-50/40"
      >
        <div className="relative z-[1]">
          <div className="flex items-center gap-3 mb-1">
            <WeatherIcon className="[--weather-icon-size:36px]" desc={weather.weatherDesc} />
            <span className="text-3xl leading-none font-black font-serif text-stone-900 tabular-nums">
              {weather.temperature}
              °C
            </span>
          </div>
          <p className="text-xs font-medium text-stone-600">
            {weather.weatherDesc}
            {' '}
            · 体感温度
            {weather.feelsLike}
            °C
          </p>
        </div>
        <div className="relative z-[1] text-right max-[560px]:w-full max-[560px]:text-left">
          <p className="mb-1.5 text-xs font-bold text-stone-800">
            {weather.city}
            {' '}
            · 实时气象手账
          </p>
          <p className="w-fit ml-auto py-0.5 px-2.5 rounded-full bg-white/90 border border-stone-200 text-stone-600 text-[11px] font-bold tabular-nums max-[560px]:ml-0 shadow-2xs">
            相对湿度
            {' '}
            {weather.humidity}
            %
          </p>
        </div>
      </div>
      {/* ---- 未来三天预报 ---- */}
      {weather.forecast && weather.forecast.length > 0 && (
        <div
          className="flex gap-3 p-4 border-t border-stone-200/80 bg-white/40 max-[560px]:gap-2 max-[560px]:p-3"
        >
          {weather.forecast.map((day, i) => (
            <div
              className="flex-1 min-w-0 py-3 px-2 rounded-2xl text-center bg-white border border-stone-200/70 shadow-2xs"
              key={day.date}
            >
              <p className="mb-1 text-[11px] font-bold text-stone-500">
                {i === 0 ? '今天' : i === 1 ? '明天' : '后天'}
              </p>
              <WeatherIcon
                className="mx-auto mb-1.5 [--weather-icon-size:24px]"
                desc={day.weatherDesc}
              />
              <p className="text-xs font-bold text-stone-800 tabular-nums">
                {day.minTemp}
                ~
                {day.maxTemp}
                °C
              </p>
              <p className="mt-0.5 [overflow-wrap:anywhere] text-[10px] text-stone-500">
                {day.weatherDesc}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
