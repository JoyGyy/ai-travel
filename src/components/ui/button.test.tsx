import { render, screen } from '@testing-library/react'

import { Button } from './button'

describe('Button', () => {
  it('渲染按钮文本', () => {
    render(<Button>开始规划</Button>)
    expect(screen.getByRole('button', { name: '开始规划' })).toBeInTheDocument()
  })
})
