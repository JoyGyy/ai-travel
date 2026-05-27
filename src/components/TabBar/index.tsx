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
  const location = useLocation()
  const navigate = useNavigate()

  const activeKey = location.pathname === '/' ? '/' : `/${location.pathname.split('/')[1]}`

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center"
      style={{
        height: '56px',
        background: 'rgba(255, 252, 248, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--c-paper-dark)',
      }}
    >
      {tabs.map(tab => {
        const isActive = activeKey === tab.key
        return (
          <button
            key={tab.key}
            onClick={() => navigate(tab.key)}
            className="flex flex-col items-center justify-center gap-1 border-none bg-transparent cursor-pointer relative"
            style={{ flex: 1, height: '100%' }}
          >
            <span
              className="text-[20px] transition-all duration-200"
              style={{
                color: isActive ? 'var(--c-terracotta)' : 'var(--c-ink-light)',
                transform: isActive ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              {tab.icon}
            </span>
            <span
              className="text-[10px] transition-all duration-200"
              style={{
                color: isActive ? 'var(--c-terracotta)' : 'var(--c-ink-light)',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {tab.title}
            </span>
            {/* 激活指示条 */}
            {isActive && (
              <span
                className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full"
                style={{
                  width: '16px',
                  height: '3px',
                  background: 'var(--c-terracotta)',
                }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
