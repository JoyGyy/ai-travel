import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

import Login from './page'

const routerBack = vi.fn()
const routerPush = vi.fn()
const login = vi.fn()
const register = vi.fn()

vi.mock('next/navigation', () => ({
  // eslint-disable-next-line react-hooks-extra/no-unnecessary-use-prefix
  useRouter: () => ({
    back: routerBack,
    push: routerPush,
  }),
}))

vi.mock('next/image', () => ({
  default: ({ alt, src }: { alt: string, src: string }) => <img alt={alt} src={src} />,
}))

vi.mock('@/components/ComplianceFooter', () => ({
  ComplianceFooter: () => <div>备案信息</div>,
}))

vi.mock('@/hooks/useAppToast', () => ({
  // eslint-disable-next-line react-hooks-extra/no-unnecessary-use-prefix
  useAppToast: () => ({
    success: vi.fn(),
  }),
}))

vi.mock('@/stores/auth', () => ({
  // eslint-disable-next-line react-hooks-extra/no-unnecessary-use-prefix
  useAuthStore: () => ({
    login,
    register,
  }),
}))

describe('login page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('从空用户名输入框切换到密码输入框后，不会被强制拉回用户名', async () => {
    render(<Login />)

    const usernameInput = screen.getByLabelText(/用户名/)
    const passwordInput = screen.getByLabelText(/密码/)

    act(() => {
      usernameInput.focus()
      passwordInput.focus()
    })

    await screen.findByText('请输入用户名')
    await waitFor(() => {
      expect(passwordInput).toHaveFocus()
    })
  })

  it('提交空表单时聚焦用户名输入框', () => {
    render(<Login />)

    const usernameInput = screen.getByLabelText(/用户名/)

    fireEvent.click(screen.getByRole('button', { name: '登录账户' }))

    expect(usernameInput).toHaveFocus()
  })
})
