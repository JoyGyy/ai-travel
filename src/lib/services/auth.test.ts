/**
 * 认证服务单元测试
 */
import bcrypt from 'bcryptjs'

import {
  addFavoriteAttraction,
  changePassword,
  consumeAiQuota,
  getAuthFromHeaders,
  login,
  register,
  removeFavoriteAttraction,
  verifyToken,
} from './auth'

// ========== Mock 依赖 ==========

vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'mock-nanoid-id'),
}))

vi.mock('@/lib/env', () => ({
  env: {
    JWT_SECRET: 'test-jwt-secret-for-unit-tests',
  },
}))

// Mock jose 库（使用 vi.hoisted 确保变量在 mock 之前初始化）
const { mockJwtVerify, mockSignJwt } = vi.hoisted(() => ({
  mockJwtVerify: vi.fn(),
  mockSignJwt: vi.fn(),
}))

vi.mock('jose', () => {
  // 创建一个可链式调用的 SignJWT mock 类（必须是真正的 class 才能被 new 调用）
  class MockSignJWT {
    setExpirationTime = vi.fn().mockReturnThis()
    setProtectedHeader = vi.fn().mockReturnThis()
    sign = mockSignJwt
  }

  return {
    jwtVerify: mockJwtVerify,
    SignJWT: MockSignJWT,
  }
})

const mockQuery = vi.fn()

vi.mock('@/lib/db', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
}))

// ========== 测试 ==========

describe('auth 服务', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ---------- register ----------

  describe('register()', () => {
    it('成功注册用户', async () => {
      // arrange
      mockQuery.mockResolvedValueOnce({ rows: [] }) // 用户名不存在
      mockQuery.mockResolvedValueOnce({ rows: [] }) // INSERT
      vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never)
      mockSignJwt.mockResolvedValue('mock-jwt-token')

      // act
      const result = await register('testuser', 'Password123')

      // assert
      expect(result.token).toBe('mock-jwt-token')
      expect(result.user.username).toBe('testuser')
      expect(result.user.id).toBe('mock-nanoid-id')
    })

    it('用户名为空时抛出错误', async () => {
      await expect(register('', 'Password123')).rejects.toThrow('用户名和密码不能为空')
    })

    it('密码为空时抛出错误', async () => {
      await expect(register('testuser', '')).rejects.toThrow('用户名和密码不能为空')
    })

    it('用户名过短时抛出错误', async () => {
      await expect(register('a', 'Password123')).rejects.toThrow('用户名长度为 2-20 个字符')
    })

    it('用户名过长时抛出错误', async () => {
      await expect(register('a'.repeat(21), 'Password123')).rejects.toThrow(
        '用户名长度为 2-20 个字符',
      )
    })

    it('密码过短时抛出错误', async () => {
      await expect(register('testuser', 'Ab1')).rejects.toThrow('密码长度至少 8 个字符')
    })

    it('用户名已存在时抛出错误', async () => {
      // arrange
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'existing-id' }] })

      // act & assert
      await expect(register('existinguser', 'Password123')).rejects.toThrow('用户名已存在')
    })
  })

  // ---------- login ----------

  describe('login()', () => {
    it('成功登录', async () => {
      // arrange
      const createdAt = new Date('2024-01-01T00:00:00Z')
      mockQuery.mockResolvedValueOnce({
        rows: [
          { created_at: createdAt, id: 'user-1', password_hash: 'hashed-pw', username: 'testuser' },
        ],
      })
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as never)
      mockSignJwt.mockResolvedValue('login-token')

      // act
      const result = await login('testuser', 'Password123')

      // assert
      expect(result.token).toBe('login-token')
      expect(result.user.id).toBe('user-1')
      expect(result.user.username).toBe('testuser')
      expect(result.user.createdAt).toBe('2024-01-01T00:00:00.000Z')
    })

    it('用户名为空时抛出错误', async () => {
      await expect(login('', 'Password123')).rejects.toThrow('用户名和密码不能为空')
    })

    it('密码为空时抛出错误', async () => {
      await expect(login('testuser', '')).rejects.toThrow('用户名和密码不能为空')
    })

    it('用户不存在时抛出错误', async () => {
      // arrange
      mockQuery.mockResolvedValueOnce({ rows: [] })

      // act & assert
      await expect(login('nonexistent', 'Password123')).rejects.toThrow('用户名或密码错误')
    })

    it('密码错误时抛出错误', async () => {
      // arrange
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            created_at: new Date(),
            id: 'user-1',
            password_hash: 'hashed-pw',
            username: 'testuser',
          },
        ],
      })
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(false as never)

      // act & assert
      await expect(login('testuser', 'WrongPassword1')).rejects.toThrow('用户名或密码错误')
    })
  })

  // ---------- verifyToken ----------

  describe('verifyToken()', () => {
    it('有效 token 返回 payload', async () => {
      // arrange
      const payload = { id: 'user-1', username: 'testuser' }
      mockJwtVerify.mockResolvedValue({ payload })

      // act
      const result = await verifyToken('valid-token')

      // assert
      expect(result).toEqual(payload)
    })

    it('过期 token 抛出 TokenExpiredError', async () => {
      // arrange
      const err = new Error('jwt expired')
      err.name = 'TokenExpiredError'
      mockJwtVerify.mockRejectedValue(err)

      // act & assert
      await expect(verifyToken('expired-token')).rejects.toThrow('jwt expired')
    })

    it('无效 token 抛出 JsonWebTokenError', async () => {
      // arrange
      const err = new Error('invalid token')
      err.name = 'JWSSignatureVerificationFailed'
      mockJwtVerify.mockRejectedValue(err)

      // act & assert
      await expect(verifyToken('invalid-token')).rejects.toThrow('invalid token')
    })
  })

  // ---------- getAuthFromHeaders ----------

  describe('getAuthFromHeaders()', () => {
    it('从 Authorization header 提取用户', async () => {
      // arrange
      const payload = { id: 'user-1', username: 'testuser' }
      mockJwtVerify.mockResolvedValue({ payload })
      const headers = new Headers({ authorization: 'Bearer valid-token' })

      // act
      const result = await getAuthFromHeaders(headers)

      // assert
      expect(result).toEqual(payload)
    })

    it('从 cookie 提取用户', async () => {
      // arrange
      const payload = { id: 'user-1', username: 'testuser' }
      mockJwtVerify.mockResolvedValue({ payload })
      const headers = new Headers({ cookie: 'token=cookie-token; other=value' })

      // act
      const result = await getAuthFromHeaders(headers)

      // assert
      expect(result).toEqual(payload)
      expect(mockJwtVerify).toHaveBeenCalledWith('cookie-token', expect.anything())
    })

    it('无认证信息返回 null', async () => {
      // arrange
      const headers = new Headers()

      // act
      const result = await getAuthFromHeaders(headers)

      // assert
      expect(result).toBeNull()
    })

    it('authorization header token 无效时返回 null', async () => {
      // arrange
      mockJwtVerify.mockRejectedValue(new Error('invalid'))
      const headers = new Headers({ authorization: 'Bearer bad-token' })

      // act
      const result = await getAuthFromHeaders(headers)

      // assert
      expect(result).toBeNull()
    })

    it('cookie 中 token 无效时返回 null', async () => {
      // arrange
      mockJwtVerify.mockRejectedValue(new Error('invalid'))
      const headers = new Headers({ cookie: 'token=bad-token' })

      // act
      const result = await getAuthFromHeaders(headers)

      // assert
      expect(result).toBeNull()
    })

    it('不误匹配 csrf_token 等类似 cookie 名', async () => {
      // arrange
      const payload = { id: 'user-1', username: 'testuser' }
      mockJwtVerify.mockResolvedValue({ payload })
      const headers = new Headers({ cookie: 'csrf_token=abc123; token=real-token' })

      // act
      const result = await getAuthFromHeaders(headers)

      // assert
      expect(mockJwtVerify).toHaveBeenCalledWith('real-token', expect.anything())
      expect(result).toEqual(payload)
    })
  })

  // ---------- consumeAiQuota ----------

  describe('consumeAiQuota()', () => {
    it('正常消耗一次配额', async () => {
      // arrange
      mockQuery.mockResolvedValueOnce({ rows: [{ role: 'user' }] }) // isAdmin
      mockQuery.mockResolvedValueOnce({ rows: [{ used_count: 3 }] }) // INSERT

      // act
      const result = await consumeAiQuota('user-1', '2024-01-15')

      // assert
      expect(result.used).toBe(3)
      expect(result.limit).toBe(10)
      expect(result.remaining).toBe(7)
    })

    it('达到上限时抛出 429 错误', async () => {
      // arrange
      mockQuery.mockResolvedValueOnce({ rows: [{ role: 'user' }] }) // isAdmin（consumeAiQuota）
      mockQuery.mockResolvedValueOnce({ rows: [] }) // INSERT RETURNING 为空 = 已达上限
      mockQuery.mockResolvedValueOnce({ rows: [{ role: 'user' }] }) // isAdmin（getAiQuotaStatus）
      mockQuery.mockResolvedValueOnce({ rows: [{ used_count: 10 }] }) // SELECT used_count

      // act & assert
      const err = (await consumeAiQuota('user-1', '2024-01-15').catch(e => e)) as Error & {
        status: number
      }
      expect(err.message).toBe('今日 AI 使用次数已达上限，请明天再试')
      expect(err.status).toBe(429)
    })

    it('userId 为空时抛出错误', async () => {
      // act & assert
      await expect(consumeAiQuota('')).rejects.toThrow('用户信息无效')
    })
  })

  // ---------- addFavoriteAttraction / removeFavoriteAttraction ----------

  describe('addFavoriteAttraction()', () => {
    it('成功添加收藏', async () => {
      // arrange
      mockQuery.mockResolvedValueOnce({ rows: [] })

      // act & assert
      await expect(addFavoriteAttraction('user-1', 'attraction-1')).resolves.toBeUndefined()
    })

    it('userId 为空时抛出错误', async () => {
      await expect(addFavoriteAttraction('', 'attraction-1')).rejects.toThrow('用户信息无效')
    })

    it('attractionId 为空时抛出错误', async () => {
      await expect(addFavoriteAttraction('user-1', '')).rejects.toThrow('景点信息无效')
    })
  })

  describe('removeFavoriteAttraction()', () => {
    it('成功取消收藏', async () => {
      // arrange
      mockQuery.mockResolvedValueOnce({ rows: [] })

      // act & assert
      await expect(removeFavoriteAttraction('user-1', 'attraction-1')).resolves.toBeUndefined()
    })

    it('userId 为空时抛出错误', async () => {
      await expect(removeFavoriteAttraction('', 'attraction-1')).rejects.toThrow('用户信息无效')
    })

    it('attractionId 为空时抛出错误', async () => {
      await expect(removeFavoriteAttraction('user-1', '')).rejects.toThrow('景点信息无效')
    })
  })

  // ---------- changePassword ----------

  describe('changePassword()', () => {
    it('成功修改密码', async () => {
      // arrange
      mockQuery.mockResolvedValueOnce({ rows: [{ password_hash: 'old-hashed' }] })
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as never)
      vi.spyOn(bcrypt, 'hash').mockResolvedValue('new-hashed' as never)
      mockQuery.mockResolvedValueOnce({ rows: [] }) // UPDATE

      // act & assert
      await expect(
        changePassword('user-1', 'OldPassword1', 'NewPassword1'),
      ).resolves.toBeUndefined()
    })

    it('当前密码错误时抛出错误', async () => {
      // arrange
      mockQuery.mockResolvedValueOnce({ rows: [{ password_hash: 'old-hashed' }] })
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(false as never)

      // act & assert
      await expect(changePassword('user-1', 'WrongPassword1', 'NewPassword1')).rejects.toThrow(
        '当前密码错误',
      )
    })

    it('用户不存在时抛出错误', async () => {
      // arrange
      mockQuery.mockResolvedValueOnce({ rows: [] })

      // act & assert
      await expect(changePassword('nonexistent', 'OldPassword1', 'NewPassword1')).rejects.toThrow(
        '用户不存在',
      )
    })

    it('userId 为空时抛出错误', async () => {
      await expect(changePassword('', 'old', 'new')).rejects.toThrow('用户信息无效')
    })

    it('当前密码为空时抛出错误', async () => {
      await expect(changePassword('user-1', '', 'NewPassword1')).rejects.toThrow(
        '当前密码和新密码不能为空',
      )
    })

    it('新密码为空时抛出错误', async () => {
      await expect(changePassword('user-1', 'OldPassword1', '')).rejects.toThrow(
        '当前密码和新密码不能为空',
      )
    })

    it('新密码过短时抛出错误', async () => {
      await expect(changePassword('user-1', 'OldPassword1', 'Ab1')).rejects.toThrow(
        '密码长度至少 8 个字符',
      )
    })
  })
})
