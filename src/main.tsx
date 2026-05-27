/**
 * 应用入口文件
 * 负责初始化 React 应用并挂载到 DOM
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/global.css' // 全局样式，包含 CSS 变量和基础样式

// 获取根 DOM 元素并创建 React 根节点，使用 StrictMode 启用严格模式检查
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
