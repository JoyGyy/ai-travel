'use client'

/**
 * 全局导航组件（Client Component）
 * 包含顶部导航栏，根据当前路径决定是否显示
 */
import { Bot, Cloud, Compass, Home, LogIn, MapPin, Menu, User, Users, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'

import { shouldShowNav } from './utils'

// eslint-disable-next-line react-refresh/only-export-components
export { shouldShowNav } from './utils'

/* ========== 导航标签配置 ========== */

const tabs = [
  { icon: <Home aria-hidden="true" size={18} />, key: '/', title: '首页' },
  { icon: <Cloud aria-hidden="true" size={18} />, key: '/weather', title: '天气' },
  { icon: <MapPin aria-hidden="true" size={18} />, key: '/attractions', title: '景点' },
  { icon: <Users aria-hidden="true" size={18} />, key: '/community', title: '社区' },
  { icon: <Bot aria-hidden="true" size={18} />, key: '/chat', title: 'AI咨询' },
] as const

export function Navigation() {
  const pathname = usePathname()
  const showNav = shouldShowNav(pathname || '')

  if (!showNav)
    return null

  return <TopNav />
}

/* ========== 导出 ========== */

function TopNav() {
  const user = useAuthStore(state => state.user)
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav
      aria-label="主导航"
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/60 shadow-sm"
    >
      <div className="max-w-[1200px] h-16 mx-auto px-4 sm:px-6 flex items-center gap-2.5 sm:gap-3.5">
        <Link
          aria-label="返回首页"
          className="min-h-11 inline-flex items-center gap-2.5 mr-auto sm:mr-[18px] rounded-2xl no-underline text-travel-ink"
          href="/"
        >
          <span
            aria-hidden="true"
            className="w-10 h-10 inline-flex items-center justify-center rounded-[14px] text-white bg-primary shadow-[0_10px_24px_rgba(20,184,166,0.28)] text-base"
          >
            <Compass size={20} />
          </span>
          <span className="text-[15px] font-black tracking-[0.08em] text-travel-ink uppercase">
            Travel AI
          </span>
        </Link>
        <div className="hidden sm:flex items-center gap-2">
          {tabs.map((tab) => {
            const isActive
              = pathname === tab.key || (tab.key !== '/' && pathname?.startsWith(tab.key))
            return (
              <Link
                className={`min-h-11 flex items-center gap-[7px] px-4 border border-transparent rounded-2xl text-travel-ink/72 text-sm font-extrabold relative transition-all hover:-translate-y-px hover:bg-primary/8 hover:text-travel-ink motion-reduce:transition-none ${
                  isActive
                    ? 'bg-primary/12 text-travel-ink border-primary/24'
                    : ''
                }`}
                href={tab.key}
                key={tab.key}
              >
                <span className="text-base text-primary">{tab.icon}</span>
                <span>{tab.title}</span>
                <span
                  aria-hidden="true"
                  className={`absolute -bottom-[7px] left-1/2 w-[22px] h-[3px] rounded-full bg-primary opacity-0 -translate-x-1/2 scale-x-[0.6] transition-all motion-reduce:transition-none ${
                    isActive ? 'opacity-100 scale-x-100' : ''
                  }`}
                />
              </Link>
            )
          })}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {user
            ? (
                <Link
                  aria-label={`当前用户：${user.username}，进入个人中心`}
                  className={`min-h-11 inline-flex items-center justify-center gap-1.5 px-4 rounded-full bg-travel-surface text-travel-ink border border-travel-ink/6 text-sm font-extrabold transition-all hover:-translate-y-px hover:border-primary/28 hover:bg-primary/10 motion-reduce:transition-none no-underline ${
                    pathname === '/profile'
                      ? '-translate-y-px border-primary/28 bg-primary/10'
                      : ''
                  }`}
                  href="/profile"
                >
                  <User aria-hidden="true" size={16} />
                  <span className="hidden sm:inline">{user.username}</span>
                </Link>
              )
            : (
                <Link
                  className="min-h-11 inline-flex items-center justify-center gap-1.5 px-4 rounded-full bg-travel-surface text-travel-ink border border-primary/24 text-sm font-extrabold transition-all hover:-translate-y-px hover:border-primary/38 hover:bg-primary/10 motion-reduce:transition-none no-underline"
                  href="/login"
                >
                  <LogIn aria-hidden="true" size={16} />
                  <span className="hidden sm:inline">登录</span>
                </Link>
              )}
          <Button
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? '关闭菜单' : '打开菜单'}
            className="sm:hidden text-travel-ink hover:bg-primary/8"
            onClick={() => setMobileMenuOpen(v => !v)}
            size="icon"
            variant="ghost"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>
      {mobileMenuOpen
        ? (
            <div className="sm:hidden border-t border-travel-ink/6 bg-travel-surface px-4 py-2">
              {tabs.map((tab) => {
                const isActive
                  = pathname === tab.key || (tab.key !== '/' && pathname?.startsWith(tab.key))
                return (
                  <Link
                    className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold no-underline transition-colors hover:bg-primary/8 ${
                      isActive
                        ? 'bg-primary/12 text-travel-ink'
                        : 'text-travel-ink/72'
                    }`}
                    href={tab.key}
                    key={tab.key}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="text-primary">{tab.icon}</span>
                    <span>{tab.title}</span>
                  </Link>
                )
              })}
            </div>
          )
        : null}
    </nav>
  )
}
