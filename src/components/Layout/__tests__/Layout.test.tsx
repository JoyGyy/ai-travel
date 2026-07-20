import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import Layout from '../index'

vi.mock('@/stores/auth', () => ({
  useAuthStore: (selector: (state: { user: { username: string } }) => unknown) => selector({ user: { username: 'test' } }),
}))

describe('Layout navigation', () => {
  it('顶部导航包含景点入口', async () => {
    const router = createMemoryRouter([
      { path: '/', element: <Layout />, children: [{ path: 'chat', element: <div>聊天</div> }] },
    ], { initialEntries: ['/chat'] })

    render(<RouterProvider router={router} />)

    expect(screen.getByRole('link', { name: /景点/ })).toHaveAttribute('href', '/attractions')
  })
})
