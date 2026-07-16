import type { AuthResponse } from '@/types/api'
import { request } from './client'

export async function loginApi(username: string, password: string): Promise<AuthResponse> {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: { username, password },
  })
  return data as AuthResponse
}

export async function registerApi(username: string, password: string): Promise<AuthResponse> {
  const data = await request('/api/auth/register', {
    method: 'POST',
    body: { username, password },
  })
  return data as AuthResponse
}

export async function getMeApi(): Promise<{ success: true; user: import('@/types/api').AuthUser }> {
  const data = await request('/api/auth/me', {
    auth: true,
  })
  return data as { success: true; user: import('@/types/api').AuthUser }
}
