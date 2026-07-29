import { render, screen } from '@testing-library/react'

import { Navigation } from './index'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/weather',
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock auth store
vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn((selector) => {
    const state = { user: { username: '测试用户' } }
    return selector ? selector(state) : state
  }),
}))

describe('Navigation', () => {
  it('渲染导航栏', () => {
    render(<Navigation />)
    expect(screen.getByRole('navigation', { name: '主导航' })).toBeInTheDocument()
  })

  it('显示品牌标识', () => {
    render(<Navigation />)
    expect(screen.getByText('Travel AI')).toBeInTheDocument()
  })

  it('显示导航标签', () => {
    render(<Navigation />)
    expect(screen.getByText('首页')).toBeInTheDocument()
    expect(screen.getByText('天气')).toBeInTheDocument()
    expect(screen.getByText('景点')).toBeInTheDocument()
    expect(screen.getByText('社区')).toBeInTheDocument()
    expect(screen.getByText('AI咨询')).toBeInTheDocument()
  })

  it('显示用户信息', () => {
    render(<Navigation />)
    expect(screen.getByText('测试用户')).toBeInTheDocument()
  })

  it('使用 lucide-react 图标', () => {
    render(<Navigation />)
    // 验证图标存在（通过 aria-hidden 属性）
    const icons = document.querySelectorAll('[aria-hidden="true"]')
    expect(icons.length).toBeGreaterThan(0)
  })
})
