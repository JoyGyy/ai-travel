import { request } from './client'

export function getWeatherApi(city, options = {}) {
  return request(`/api/weather?city=${encodeURIComponent(city)}`, {
    signal: options.signal,
  })
}
