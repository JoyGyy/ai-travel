'use client'

import { useMemo } from 'react'

import { toast } from '@/hooks/use-toast'

export function useAppToast() {
  return useMemo(
    () => ({
      error(message: string) {
        toast({ description: message, title: '操作失败', variant: 'destructive' })
      },
      info(message: string) {
        toast({ description: message, title: '提示' })
      },
      success(message: string) {
        toast({ description: message, title: '操作成功' })
      },
    }),
    [],
  )
}
