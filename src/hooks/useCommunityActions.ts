/**
 * 社区页面共享 hook
 * 提取登录守卫、点赞、转发等通用逻辑
 */
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

import { likeCommunityPost, unlikeCommunityPost, repostCommunityPost } from '@/api/community'
import { useAuthStore } from '@/stores/auth'

import { useAppToast } from './useAppToast'

interface UseCommunityActionsOptions {
  /** 点赞成功后的回调，用于更新本地状态 */
  onLikeSuccess?: (postId: string, likedByMe: boolean, likeCount: number) => void
  /** 转发成功后的回调 */
  onRepostSuccess?: (repostId: string) => void
}

/**
 * 社区页面共享 hook
 * 提供登录守卫、点赞切换、转发提交等通用逻辑
 */
export function useCommunityActions(options: UseCommunityActionsOptions = {}) {
  const router = useRouter()
  const toast = useAppToast()
  const user = useAuthStore(state => state.user)
  const hasHydrated = useAuthStore(state => state._hasHydrated)

  /**
   * 检查登录状态，未登录时提示并跳转
   * @param action 操作描述（如"点赞"、"转发"）
   * @returns 是否已登录
   */
  const requireLogin = useCallback((action: string): boolean => {
    if (!hasHydrated) {
      toast.info('正在恢复登录状态...')
      return false
    }
    if (!user) {
      toast.info(`请先登录后${action}`)
      router.push('/login')
      return false
    }
    return true
  }, [hasHydrated, user, router, toast])

  /**
   * 切换点赞状态
   * @param postId 帖子 ID
   * @param currentlyLiked 当前是否已点赞
   * @returns Promise，成功时调用 onLikeSuccess 回调
   */
  const toggleLike = useCallback(async (postId: string, currentlyLiked: boolean): Promise<boolean> => {
    if (!requireLogin('点赞'))
      return false

    try {
      const result = currentlyLiked
        ? await unlikeCommunityPost(postId)
        : await likeCommunityPost(postId)
      options.onLikeSuccess?.(postId, result.likedByMe, result.likeCount)
      toast.success(result.likedByMe ? '已点赞' : '已取消点赞')
      return true
    }
    catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '点赞操作失败')
      return false
    }
  }, [requireLogin, toast, options.onLikeSuccess])

  /**
   * 提交转发
   * @param postId 帖子 ID
   * @param content 转发附言
   * @returns Promise，成功时调用 onRepostSuccess 回调
   */
  const submitRepost = useCallback(async (postId: string, content: string): Promise<boolean> => {
    if (!requireLogin('转发'))
      return false

    try {
      const repost = await repostCommunityPost(postId, content.trim())
      toast.success('已转发到社区')
      options.onRepostSuccess?.(repost.id)
      return true
    }
    catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '转发失败')
      return false
    }
  }, [requireLogin, toast, options.onRepostSuccess])

  return {
    /** 当前登录用户 */
    user,
    /** 是否已恢复登录状态 */
    hasHydrated,
    /** 检查登录状态 */
    requireLogin,
    /** 切换点赞状态 */
    toggleLike,
    /** 提交转发 */
    submitRepost,
  }
}
