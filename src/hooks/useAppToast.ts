'use client'

import { useToast } from '@/hooks/use-toast'

export function useAppToast() {
  const { toast } = useToast()

  return {
    error(message: string) {
      toast({ description: message, title: '操作失败', variant: 'destructive' })
    },
    info(message: string) {
      toast({ description: message, title: '提示' })
    },
    success(message: string) {
      toast({ description: message, title: '操作成功' })
    },
  }
}
