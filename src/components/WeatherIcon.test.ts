import { describe, expect, it } from 'vitest'

import { getWeatherIconType } from './WeatherIcon'

describe('getWeatherIconType', () => {
  it.each([
    ['晴', 'sunny'],
    ['多云', 'cloudy'],
    ['阴', 'cloudy'],
    ['小雨', 'rain'],
    ['雷阵雨', 'storm'],
    ['暴雨', 'storm'],
    ['小雪', 'snow'],
    ['大雾', 'fog'],
    ['未知', 'default'],
  ] as const)('maps %s to %s', (description, type) => {
    expect(getWeatherIconType(description)).toBe(type)
  })
})
