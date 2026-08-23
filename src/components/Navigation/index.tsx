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
  { icon: <Home size={18} />, key: '/', title: '首页' },
  { icon: <Cloud size={18} />, key: '/weather', title: '天气' },
  { icon: <MapPin size={18} />, key: '/attractions', title: '景点' },
  { icon: <Users size={18} />, key: '/community', title: '社区' },
  { icon: <Bot size={18} />, key: '/chat', title: 'AI咨询' },
]

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
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-stone-200/80 bg-[#FAF7F0]/92 backdrop-blur-md shadow-[0_2px_12px_rgba(28,25,23,0.04)]">
      <div className="max-w-[1240px] h-16 mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <Link
          className="inline-flex shrink-0 items-center gap-2.5 rounded-xl no-underline text-stone-900 group"
          href="/"
        >
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-md shadow-emerald-800/20 transition-transform group-hover:scale-105"
          >
            <Compass size={19} />
          </span>
          <div className="flex items-center gap-1.5">
            <span className="font-serif text-lg font-bold tracking-tight text-stone-900">
              远方
            </span>
            <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded-full bg-amber-100/90 text-amber-900 border border-amber-300/60 shadow-2xs">
              Travel Log
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Tabs */}
        <div className="hidden sm:flex flex-1 items-center justify-center gap-1.5">
          {tabs.map((tab) => {
            const isActive
              = pathname === tab.key || (tab.key !== '/' && pathname?.startsWith(tab.key))
            return (
              <Link
                className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all motion-reduce:transition-none ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-800/15'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
                href={tab.key}
                key={tab.key}
              >
                <span className={isActive ? 'text-white' : 'text-emerald-700'}>{tab.icon}</span>
                <span>{tab.title}</span>
              </Link>
            )
          })}
        </div>

        {/* Right Actions / User */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {user
            ? (
                <Link
                  className={`min-h-9 inline-flex items-center justify-center gap-1.5 px-3.5 rounded-full bg-white text-stone-800 border border-stone-200 text-xs font-bold transition-all hover:-translate-y-px hover:border-emerald-600/40 hover:bg-emerald-50/50 shadow-2xs no-underline ${
                    pathname === '/profile'
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-800'
                      : ''
                  }`}
                  href="/profile"
                >
                  <User size={15} className="text-emerald-700" />
                  <span className="hidden sm:inline">{user.username}</span>
                </Link>
              )
            : (
                <Link
                  className="min-h-9 inline-flex items-center justify-center gap-1.5 px-4 rounded-full bg-emerald-700 text-white text-xs font-bold transition-all hover:bg-emerald-800 hover:shadow-md shadow-2xs no-underline"
                  href="/login"
                >
                  <LogIn size={15} />
                  <span>登录</span>
                </Link>
              )}
          <Button
            className="sm:hidden text-stone-800 hover:bg-stone-200/70"
            onClick={() => setMobileMenuOpen(v => !v)}
            size="icon"
            variant="ghost"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen
        ? (
            <div className="sm:hidden border-t border-stone-200/80 bg-[#FAF7F0] px-4 py-3 space-y-1">
              {tabs.map((tab) => {
                const isActive
                  = pathname === tab.key || (tab.key !== '/' && pathname?.startsWith(tab.key))
                return (
                  <Link
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold no-underline transition-colors ${
                      isActive
                        ? 'bg-emerald-700 text-white'
                        : 'text-stone-700 hover:bg-stone-200/60'
                    }`}
                    href={tab.key}
                    key={tab.key}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className={isActive ? 'text-white' : 'text-emerald-700'}>{tab.icon}</span>
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
