/** @typedef {import('@/types/api').WeatherResponse} WeatherResponse */

import { request } from './client'

/**
 * @param {string} city
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<WeatherResponse>}
 */
export function getWeatherApi(city, options = {}) {
  return request(`/api/weather?city=${encodeURIComponent(city)}`, {
    signal: options.signal,
  })
}
