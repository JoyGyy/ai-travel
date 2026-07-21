import type { AuthResponse, ProfileData } from '@/types/api'

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

export async function getMeApi(): Promise<{ success: true, user: import('@/types/api').AuthUser }> {
  const data = await request('/api/auth/me', {
    auth: true,
  })
  return data as { success: true, user: import('@/types/api').AuthUser }
}

export async function getProfileApi(): Promise<{ success: true, profile: ProfileData }> {
  const data = await request('/api/auth/profile', {
    auth: true,
  })
  return data as { success: true, profile: ProfileData }
}

export async function changePasswordApi(currentPassword: string, newPassword: string): Promise<{ success: true, message: string }> {
  const data = await request('/api/auth/password', {
    method: 'PUT',
    body: { currentPassword, newPassword },
    auth: true,
  })
  return data as { success: true, message: string }
}
