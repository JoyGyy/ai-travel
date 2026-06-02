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

export function TabBar() {
  const location = useLocation()
  const navigate = useNavigate()

  const activeKey = location.pathname === '/' ? '/' : `/${location.pathname.split('/')[1]}`

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(255, 252, 248, 0.72)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderTop: '1px solid rgba(240, 232, 221, 0.5)',
      }}
    >
      <div className="flex items-center" style={{ height: '56px' }}>
        {tabs.map(tab => {
          const isActive = activeKey === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => navigate(tab.key)}
              className="flex flex-col items-center justify-center gap-0.5 border-none bg-transparent cursor-pointer relative"
              style={{ flex: 1, height: '100%' }}
            >
              <span
                className="transition-all duration-300 ease-out"
                style={{
                  fontSize: isActive ? '22px' : '20px',
                  color: isActive ? 'var(--c-terracotta)' : 'var(--c-ink-light)',
                  transform: isActive ? 'translateY(-1px)' : 'translateY(0)',
                  opacity: isActive ? 1 : 0.65,
                }}
              >
                {tab.icon}
              </span>
              <span
                className="transition-all duration-300 ease-out"
                style={{
                  fontSize: '10px',
                  letterSpacing: '0.5px',
                  color: isActive ? 'var(--c-terracotta)' : 'var(--c-ink-light)',
                  fontWeight: isActive ? 600 : 400,
                  opacity: isActive ? 1 : 0.65,
                }}
              >
                {tab.title}
              </span>
              {isActive && (
                <span
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full"
                  style={{
                    width: '18px',
                    height: '2.5px',
                    background: 'linear-gradient(90deg, var(--c-terracotta), var(--c-terracotta-light))',
                    opacity: 0.9,
                  }}
                />
              )}
            </button>
          )
        })}
      </div>
      {/* iPhone 安全区域 */}
      <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
    </div>
  )
}
