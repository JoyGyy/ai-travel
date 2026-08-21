/**
 * 认证相关 API
 *
 * 封装登录、注册、获取当前用户、获取个人资料和修改密码接口。
 */
import type { AuthResponse, AuthUser, ProfileData } from '@/types/api'

import { get, post, put } from './client'

/** 修改密码（需认证，修改成功后需重新登录） */
export async function changePasswordApi(
  currentPassword: string,
  newPassword: string,
): Promise<{ message: string, success: true }> {
  return put('/api/auth/password', { currentPassword, newPassword }, { auth: true })
}

/** 获取当前登录用户信息（需认证） */
export async function getMeApi(): Promise<{ success: true, user: AuthUser }> {
  return get('/api/auth/me', { auth: true })
}

/** 获取个人资料（含 AI 额度等信息，需认证） */
export async function getProfileApi(): Promise<{ profile: ProfileData, success: true }> {
  return get('/api/auth/profile', { auth: true })
}

/** 用户登录 */
export async function loginApi(username: string, password: string): Promise<AuthResponse> {
  return post('/api/auth/login', { password, username })
}

/** 用户注册 */
export async function registerApi(username: string, password: string): Promise<AuthResponse> {
  return post('/api/auth/register', { password, username })
}
