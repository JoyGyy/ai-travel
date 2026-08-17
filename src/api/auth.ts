/**
 * 认证相关 API
 *
 * 封装登录、注册、获取当前用户、获取个人资料和修改密码接口。
 */
import type { AuthResponse, AuthUser, ProfileData } from '@/types/api'

import { request } from './client'

/** 修改密码（需认证，修改成功后需重新登录） */
export async function changePasswordApi(
  currentPassword: string,
  newPassword: string,
): Promise<{ message: string, success: true }> {
  return request<{ message: string, success: true }>('/api/auth/password', {
    auth: true,
    body: { currentPassword, newPassword },
    method: 'PUT',
  })
}

/** 获取当前登录用户信息（需认证） */
export async function getMeApi(): Promise<{ success: true, user: AuthUser }> {
  return request<{ success: true, user: AuthUser }>('/api/auth/me', {
    auth: true,
  })
}

/** 获取个人资料（含 AI 额度等信息，需认证） */
export async function getProfileApi(): Promise<{ profile: ProfileData, success: true }> {
  return request<{ profile: ProfileData, success: true }>('/api/auth/profile', {
    auth: true,
  })
}

/** 用户登录 */
export async function loginApi(username: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/login', {
    body: { password, username },
    method: 'POST',
  })
}

/** 用户注册 */
export async function registerApi(username: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/register', {
    body: { password, username },
    method: 'POST',
  })
}
