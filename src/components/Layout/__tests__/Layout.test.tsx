import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import Layout from '../index'

vi.mock('@/stores/auth', () => ({
  useAuthStore: (selector: (state: { user: { username: string } }) => unknown) => selector({ user: { username: 'test' } }),
}))

function renderAt(path: string) {
  const router = createMemoryRouter([
    {
      path: '/',
      element: <Layout />,
      children: [
        { path: 'chat', element: <div>聊天</div> },
        { path: 'profile', element: <div>个人中心</div> },
        { path: 'attractions/:id', element: <div>景点详情</div> },
        { path: 'login', element: <div>登录页</div> },
      ],
    },
  ], { initialEntries: [path] })

  render(<RouterProvider router={router} />)
}

describe('Layout navigation', () => {
  it('顶部导航包含景点入口', async () => {
    renderAt('/chat')

    expect(screen.getByRole('link', { name: /景点/ })).toHaveAttribute('href', '/attractions')
  })

  it('深层页面显示顶部导航并提供个人中心入口', () => {
    renderAt('/attractions/hangzhou-west-lake')

    expect(screen.getByRole('navigation', { name: '主导航' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /当前用户：test，进入个人中心/ })).toHaveAttribute('href', '/profile')
  })

  it('登录页不显示主导航', () => {
    renderAt('/login')

    expect(screen.queryByRole('navigation', { name: '主导航' })).not.toBeInTheDocument()
  })
})
