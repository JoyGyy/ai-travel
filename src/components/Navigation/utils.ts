/**
 * 导航工具函数
 */

/** 根据路径判断是否显示导航栏 */
export function shouldShowNav(pathname: string): boolean {
  if (pathname === '/login')
    return false

  return (
    pathname === '/'
    || pathname === '/weather'
    || pathname === '/chat'
    || pathname === '/profile'
    || pathname === '/detail'
    || pathname === '/attractions'
    || pathname.startsWith('/attractions/')
    || pathname === '/community'
    || pathname.startsWith('/community/')
  )
}
