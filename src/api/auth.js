/** @typedef {import('@/types/api').AuthResponse} AuthResponse */

import { request } from './client'

/**
 * @param {string} username
 * @param {string} password
 * @returns {Promise<AuthResponse>}
 */
export function loginApi(username, password) {
  return request('/api/auth/login', {
    method: 'POST',
    body: { username, password },
  })
}

/**
 * @param {string} username
 * @param {string} password
 * @returns {Promise<AuthResponse>}
 */
export function registerApi(username, password) {
  return request('/api/auth/register', {
    method: 'POST',
    body: { username, password },
  })
}

/**
 * @returns {Promise<{ success: true, user: import('@/types/api').AuthUser }>}
 */
export function getMeApi() {
  return request('/api/auth/me', {
    auth: true,
  })
}
