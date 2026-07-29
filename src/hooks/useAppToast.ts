'use client'

import { useToast } from '@/hooks/use-toast'

export function useAppToast() {
  const { toast } = useToast()

  return {
    success(message: string) {
      toast({ title: '操作成功', description: message })
    },
    error(message: string) {
      toast({ title: '操作失败', description: message, variant: 'destructive' })
    },
    info(message: string) {
      toast({ title: '提示', description: message })
    },
  }
}
