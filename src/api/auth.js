import { request } from './client'

export function loginApi(username, password) {
  return request('/api/auth/login', {
    method: 'POST',
    body: { username, password },
  })
}

export function registerApi(username, password) {
  return request('/api/auth/register', {
    method: 'POST',
    body: { username, password },
  })
}

export function getMeApi() {
  return request('/api/auth/me', {
    auth: true,
  })
}
