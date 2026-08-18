import type { ClassValue } from 'clsx'

import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** 安全提取错误消息，避免 (err as Error).message 的类型不安全断言 */
export function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}
