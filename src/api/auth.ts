import type { AuthResponse, AuthUser, ProfileData } from '@/types/api'

import { request } from './client'

export async function loginApi(username: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: { username, password },
  })
}

export async function registerApi(username: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: { username, password },
  })
}

export async function getMeApi(): Promise<{ success: true, user: AuthUser }> {
  return request<{ success: true, user: AuthUser }>('/api/auth/me', {
    auth: true,
  })
}

export async function getProfileApi(): Promise<{ success: true, profile: ProfileData }> {
  return request<{ success: true, profile: ProfileData }>('/api/auth/profile', {
    auth: true,
  })
}

export async function changePasswordApi(currentPassword: string, newPassword: string): Promise<{ success: true, message: string }> {
  return request<{ success: true, message: string }>('/api/auth/password', {
    method: 'PUT',
    body: { currentPassword, newPassword },
    auth: true,
  })
}
