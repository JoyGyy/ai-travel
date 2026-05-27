/**
 * 底部导航栏组件
 * 提供主要页面的快速切换功能
 */
import { useLocation, useNavigate } from 'react-router-dom'
import { AppOutline, UnorderedListOutline, ChatAddOutline, UserOutline } from 'antd-mobile-icons'

/** 导航标签配置 */
const tabs = [
  { key: '/', title: '首页', icon: <AppOutline /> },
  { key: '/history', title: '历史', icon: <UnorderedListOutline /> },
  { key: '/chat', title: 'AI咨询', icon: <ChatAddOutline /> },
  { key: '/profile', title: '我的', icon: <UserOutline /> },
]

/**
 * 底部导航栏组件
 * 固定在页面底部，显示四个导航标签
 */
export function TabBar() {
  const location = useLocation() // 获取当前路由位置
  const navigate = useNavigate() // 获取导航函数

  // 计算当前激活的标签键
  // 对于根路径返回 '/'，其他路径取第一级路径
  const activeKey = location.pathname === '/' ? '/' : `/${location.pathname.split('/')[1]}`

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around"
      style={{
        height: '50px',
        background: 'var(--c-white)',
        borderTop: '1px solid var(--c-paper-dark)',
        boxShadow: '0 -2px 12px rgba(45, 42, 38, 0.04)',
      }}
    >
      {/* 遍历标签配置，渲染导航按钮 */}
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => navigate(tab.key)} // 点击导航到对应路由
          className="flex flex-col items-center justify-center gap-0.5 border-none bg-transparent cursor-pointer"
          style={{ flex: 1, height: '100%' }}
        >
          {/* 图标 - 激活状态使用主题色 */}
          <span
            className="text-xl"
            style={{ color: activeKey === tab.key ? 'var(--c-terracotta)' : 'var(--c-ink-light)' }}
          >
            {tab.icon}
          </span>
          {/* 标题文字 */}
          <span
            className="text-xs"
            style={{ color: activeKey === tab.key ? 'var(--c-terracotta)' : 'var(--c-ink-light)' }}
          >
            {tab.title}
          </span>
        </button>
      ))}
    </div>
  )
}
