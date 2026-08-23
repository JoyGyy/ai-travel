import { generateCsrfToken, verifyCsrfToken } from './csrf'

describe('csrf token', () => {
  it('接受刚生成的 token', () => {
    expect(verifyCsrfToken(generateCsrfToken())).toBe(true)
  })

  it('拒绝未来时间戳 token', () => {
    const now = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(now + 60_000)
    const futureToken = generateCsrfToken()
    vi.restoreAllMocks()

    expect(verifyCsrfToken(futureToken)).toBe(false)
  })
})
