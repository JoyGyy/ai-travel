/**
 * 景点收藏 hook
 * 提取自景点列表页和详情页的重复收藏逻辑
 */
import { useCallback } from 'react'

import { favoriteAttraction, unfavoriteAttraction } from '@/api/attractions'
import { useAppToast } from '@/hooks/useAppToast'

interface UseAttractionFavoriteOptions {
  /** 收藏成功后的回调 */
  onFavoriteSuccess?: (attractionId: string, isFavorite: boolean) => void
}

/**
 * 景点收藏 hook
 * 提供收藏/取消收藏的通用逻辑
 */
export function useAttractionFavorite(options: UseAttractionFavoriteOptions = {}) {
  const toast = useAppToast()
  const { onFavoriteSuccess } = options

  /**
   * 切换收藏状态
   * @param attractionId 景点 ID
   * @param currentlyFavorited 当前是否已收藏
   * @returns Promise，成功时返回新的收藏状态
   */
  const toggleFavorite = useCallback(async (attractionId: string, currentlyFavorited: boolean): Promise<boolean> => {
    try {
      const result = currentlyFavorited
        ? await unfavoriteAttraction(attractionId)
        : await favoriteAttraction(attractionId)
      onFavoriteSuccess?.(attractionId, result.isFavorite)
      toast.success(result.isFavorite ? '已收藏' : '已取消收藏')
      return result.isFavorite
    }
    catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '收藏操作失败')
      return currentlyFavorited // 失败时保持原状态
    }
  }, [toast, onFavoriteSuccess])

  return {
    /** 切换收藏状态 */
    toggleFavorite,
  }
}
