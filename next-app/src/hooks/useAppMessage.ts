/**
 * 全局消息 Hook
 *
 * 获取 Ant Design App 上下文中的 message API，
 * 解决静态调用 message.* 无法读取 ConfigProvider 主题上下文的问题。
 */
import type { MessageInstance } from 'antd/es/message/interface'

import { App as AntdApp } from 'antd'

export function useAppMessage(): MessageInstance {
  const { message } = AntdApp.useApp()
  return message
}
