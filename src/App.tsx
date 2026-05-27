/**
 * 应用根组件
 * 使用 React Router 的 RouterProvider 提供路由功能
 */
import { RouterProvider } from 'react-router-dom'
import router from '@/router' // 导入路由配置

export default function App() {
  // RouterProvider 接收 router 配置，为整个应用提供路由上下文
  return <RouterProvider router={router} />
}
