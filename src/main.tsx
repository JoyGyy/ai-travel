import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'
/**
 * 应用入口文件
 * 负责初始化 React 应用并挂载到 DOM
 */
import '@ant-design/v5-patch-for-react-19'

import './styles/global.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
