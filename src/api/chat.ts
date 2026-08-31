/**
 * AI 手账会话前端 API 封装
 * 提供会话列表、详情、保存、删除与清空的后端接口交互
 */
import type { UIMessage } from 'ai'
import { del, get, post } from './client'

export interface ChatSessionApiItem {
  city?: null | string
  createdAt: string
  id: string
  messages: UIMessage[]
  title: string
  updatedAt: string
  userId: string
}

/** 获取当前登录用户的所有历史会话列表 */
export async function fetchChatSessionsApi(): Promise<{ sessions: ChatSessionApiItem[], success: true }> {
  return get('/api/travel/chat/sessions', { auth: true })
}

/** 获取指定会话详情 */
export async function getChatSessionApi(id: string): Promise<{ session: ChatSessionApiItem, success: true }> {
  return get(`/api/travel/chat/sessions/${id}`, { auth: true })
}

/** 保存或同步会话至云端数据库 */
export async function saveChatSessionApi(payload: {
  city?: null | string
  createdAt?: number | string
  id: string
  messages: UIMessage[]
  title?: string
  updatedAt?: number | string
}): Promise<{ session: ChatSessionApiItem, success: true }> {
  return post('/api/travel/chat/sessions', payload, { auth: true })
}

/** 删除指定会话 */
export async function deleteChatSessionApi(id: string): Promise<{ message: string, success: true }> {
  return del(`/api/travel/chat/sessions/${id}`, { auth: true })
}

/** 清空当前用户的所有会话 */
export async function clearAllChatSessionsApi(): Promise<{ message: string, success: true }> {
  return del('/api/travel/chat/sessions', { auth: true })
}
