'use client'

/**
 * 全局导航组件（Client Component）
 * 包含顶部导航栏，根据当前路径决定是否显示
 */
import { Bot, Cloud, Compass, Home, MapPin, User, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useAuthStore } from '@/stores/auth'

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

  if (!showNav) return null

  return <TopNav />
}

/* ========== 顶部导航栏 ========== */

/** 根据路径判断是否显示导航栏 */
export function shouldShowNav(pathname: string) {
  if (pathname === '/' || pathname === '/login') return false

  return (
    pathname === '/weather' ||
    pathname === '/chat' ||
    pathname === '/profile' ||
    pathname === '/detail' ||
    pathname === '/attractions' ||
    pathname.startsWith('/attractions/') ||
    pathname === '/community' ||
    pathname.startsWith('/community/')
  )
}

/* ========== 导出 ========== */

function TopNav() {
  const user = useAuthStore((state) => state.user)
  const pathname = usePathname()

  return (
    <nav
      aria-label="主导航"
      className="sticky top-0 z-50 bg-[var(--travel-surface)] border-b border-[rgba(28,25,23,0.06)] shadow-[0_12px_34px_rgba(var(--travel-ocean-rgb),0.08)]"
    >
      <div className="max-w-[1200px] min-h-[72px] mx-auto px-4 sm:px-6 py-3 sm:py-0 flex items-center gap-2.5 sm:gap-3.5 flex-wrap sm:flex-nowrap">
        <Link
          aria-label="返回首页"
          className="min-h-[44px] inline-flex items-center gap-2.5 mr-auto sm:mr-[18px] rounded-2xl no-underline text-[var(--travel-ocean)]"
          href="/"
        >
          <span
            aria-hidden="true"
            className="w-10 h-10 inline-flex items-center justify-center rounded-[14px] text-white bg-[var(--color-primary)] shadow-[0_10px_24px_rgba(var(--travel-primary-rgb),0.28)] text-base"
          >
            <Compass size={20} />
          </span>
          <span className="text-[15px] font-black tracking-[0.08em] text-[var(--travel-ocean)] uppercase">
            Travel AI
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-2 w-full sm:w-auto order-3 sm:order-none overflow-x-auto px-0.5 pb-1.5 sm:p-0 [scroll-snap-type:x_proximity]">
          {tabs.map((tab) => {
            const isActive =
              pathname === tab.key || (tab.key !== '/' && pathname?.startsWith(tab.key))
            return (
              <Link
                className={`min-h-[44px] flex items-center gap-[7px] px-4 border border-transparent rounded-2xl text-[rgba(var(--travel-ocean-rgb),0.72)] text-sm font-extrabold relative transition-all hover:-translate-y-px hover:bg-[rgba(var(--travel-primary-rgb),0.08)] hover:text-[var(--travel-ocean)] motion-reduce:transition-none flex-1 sm:flex-none basis-auto justify-center sm:justify-start [scroll-snap-align:start] ${
                  isActive
                    ? 'bg-[rgba(var(--travel-primary-rgb),0.12)] text-[var(--travel-ocean)] border-[rgba(var(--travel-primary-rgb),0.24)]'
                    : ''
                }`}
                href={tab.key}
                key={tab.key}
              >
                <span className="text-base text-[var(--color-primary)]">{tab.icon}</span>
                <span>{tab.title}</span>
                <span
                  aria-hidden="true"
                  className={`absolute -bottom-[7px] left-1/2 w-[22px] h-[3px] rounded-full bg-[var(--color-primary)] opacity-0 -translate-x-1/2 scale-x-[0.6] transition-all motion-reduce:transition-none ${
                    isActive ? 'opacity-100 scale-x-100' : ''
                  }`}
                />
              </Link>
            )
          })}
        </div>
        <div className="ml-auto">
          {user ? (
            <Link
              aria-label={`当前用户：${user.username}，进入个人中心`}
              className={`min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 rounded-full bg-[var(--travel-surface)] text-[var(--travel-ocean)] border border-[rgba(28,25,23,0.06)] text-sm font-extrabold transition-all hover:-translate-y-px hover:border-[rgba(var(--travel-primary-rgb),0.28)] hover:bg-[rgba(var(--travel-primary-rgb),0.1)] motion-reduce:transition-none no-underline ${
                pathname === '/profile'
                  ? '-translate-y-px border-[rgba(var(--travel-primary-rgb),0.28)] bg-[rgba(var(--travel-primary-rgb),0.1)]'
                  : ''
              }`}
              href="/profile"
            >
              <User aria-hidden="true" size={16} />
              <span>{user.username}</span>
            </Link>
          ) : (
            <Link
              className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 rounded-full bg-[var(--travel-surface)] text-[var(--travel-ocean)] border border-[rgba(var(--travel-primary-rgb),0.24)] text-sm font-extrabold transition-all hover:-translate-y-px hover:border-[rgba(var(--travel-primary-rgb),0.38)] hover:bg-[rgba(var(--travel-primary-rgb),0.1)] motion-reduce:transition-none no-underline"
              href="/login"
            >
              <User aria-hidden="true" size={16} />
              登录
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
