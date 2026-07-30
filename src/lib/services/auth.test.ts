/**
 * 认证服务单元测试
 */
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

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

const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockExecute = vi.fn()

vi.mock('@/lib/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => mockInsert(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
    execute: (...args: unknown[]) => mockExecute(...args),
  },
}))

// ========== 辅助函数 ==========

/** 创建可链式调用的 mock query builder */
function createQueryBuilder(finalResult: unknown[]) {
  const builder: Record<string, unknown> = {}
  builder.from = vi.fn(() => builder)
  builder.where = vi.fn(() => builder)
  builder.orderBy = vi.fn(() => builder)
  builder.values = vi.fn(() => Promise.resolve(undefined))
  builder.set = vi.fn(() => builder)
  builder.onConflictDoNothing = vi.fn(() => Promise.resolve(undefined))
  // 最终返回结果
  builder.then = (resolve: (value: unknown[]) => unknown) => resolve(finalResult)
  return builder
}

// ========== 测试 ==========

describe('auth 服务', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ---------- register ----------

  describe('register()', () => {
    it('成功注册用户', async () => {
      // arrange
      mockSelect.mockReturnValue(createQueryBuilder([])) // 用户名不存在
      mockInsert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      })
      vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never)
      vi.spyOn(jwt, 'sign').mockReturnValue('mock-jwt-token' as never)

      // act
      const result = await register('testuser', 'password123')

      // assert
      expect(result.token).toBe('mock-jwt-token')
      expect(result.user.username).toBe('testuser')
      expect(result.user.id).toBe('mock-nanoid-id')
    })

    it('用户名为空时抛出错误', async () => {
      await expect(register('', 'password123')).rejects.toThrow('用户名和密码不能为空')
    })

    it('密码为空时抛出错误', async () => {
      await expect(register('testuser', '')).rejects.toThrow('用户名和密码不能为空')
    })

    it('用户名过短时抛出错误', async () => {
      await expect(register('a', 'password123')).rejects.toThrow('用户名长度为 2-20 个字符')
    })

    it('用户名过长时抛出错误', async () => {
      await expect(register('a'.repeat(21), 'password123')).rejects.toThrow('用户名长度为 2-20 个字符')
    })

    it('密码过短时抛出错误', async () => {
      await expect(register('testuser', '12345')).rejects.toThrow('密码长度至少 6 个字符')
    })

    it('用户名已存在时抛出错误', async () => {
      // arrange
      mockSelect.mockReturnValue(createQueryBuilder([{ id: 'existing-id' }]))

      // act & assert
      await expect(register('existinguser', 'password123')).rejects.toThrow('用户名已存在')
    })
  })

  // ---------- login ----------

  describe('login()', () => {
    it('成功登录', async () => {
      // arrange
      const createdAt = new Date('2024-01-01T00:00:00Z')
      mockSelect.mockReturnValue(createQueryBuilder([{
        id: 'user-1',
        username: 'testuser',
        passwordHash: 'hashed-pw',
        createdAt,
      }]))
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as never)
      vi.spyOn(jwt, 'sign').mockReturnValue('login-token' as never)

      // act
      const result = await login('testuser', 'password123')

      // assert
      expect(result.token).toBe('login-token')
      expect(result.user.id).toBe('user-1')
      expect(result.user.username).toBe('testuser')
      expect(result.user.createdAt).toBe('2024-01-01T00:00:00.000Z')
    })

    it('用户名为空时抛出错误', async () => {
      await expect(login('', 'password123')).rejects.toThrow('用户名和密码不能为空')
    })

    it('密码为空时抛出错误', async () => {
      await expect(login('testuser', '')).rejects.toThrow('用户名和密码不能为空')
    })

    it('用户不存在时抛出错误', async () => {
      // arrange
      mockSelect.mockReturnValue(createQueryBuilder([]))

      // act & assert
      await expect(login('nonexistent', 'password123')).rejects.toThrow('用户名或密码错误')
    })

    it('密码错误时抛出错误', async () => {
      // arrange
      mockSelect.mockReturnValue(createQueryBuilder([{
        id: 'user-1',
        username: 'testuser',
        passwordHash: 'hashed-pw',
        createdAt: new Date(),
      }]))
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(false as never)

      // act & assert
      await expect(login('testuser', 'wrongpassword')).rejects.toThrow('用户名或密码错误')
    })
  })

  // ---------- verifyToken ----------

  describe('verifyToken()', () => {
    it('有效 token 返回 payload', () => {
      // arrange
      const payload = { id: 'user-1', username: 'testuser' }
      vi.spyOn(jwt, 'verify').mockReturnValue(payload as never)

      // act
      const result = verifyToken('valid-token')

      // assert
      expect(result).toEqual(payload)
    })

    it('过期 token 抛出 TokenExpiredError', () => {
      // arrange
      vi.spyOn(jwt, 'verify').mockImplementation(() => {
        const err = new Error('jwt expired')
        err.name = 'TokenExpiredError'
        throw err
      })

      // act & assert
      expect(() => verifyToken('expired-token')).toThrow('jwt expired')
    })

    it('无效 token 抛出 JsonWebTokenError', () => {
      // arrange
      vi.spyOn(jwt, 'verify').mockImplementation(() => {
        const err = new Error('invalid token')
        err.name = 'JsonWebTokenError'
        throw err
      })

      // act & assert
      expect(() => verifyToken('invalid-token')).toThrow('invalid token')
    })
  })

  // ---------- getAuthFromHeaders ----------

  describe('getAuthFromHeaders()', () => {
    it('从 Authorization header 提取用户', () => {
      // arrange
      const payload = { id: 'user-1', username: 'testuser' }
      vi.spyOn(jwt, 'verify').mockReturnValue(payload as never)
      const headers = new Headers({ authorization: 'Bearer valid-token' })

      // act
      const result = getAuthFromHeaders(headers)

      // assert
      expect(result).toEqual(payload)
    })

    it('从 cookie 提取用户', () => {
      // arrange
      const payload = { id: 'user-1', username: 'testuser' }
      vi.spyOn(jwt, 'verify').mockReturnValue(payload as never)
      const headers = new Headers({ cookie: 'token=cookie-token; other=value' })

      // act
      const result = getAuthFromHeaders(headers)

      // assert
      expect(result).toEqual(payload)
      expect(jwt.verify).toHaveBeenCalledWith('cookie-token', expect.any(String))
    })

    it('无认证信息返回 null', () => {
      // arrange
      const headers = new Headers()

      // act
      const result = getAuthFromHeaders(headers)

      // assert
      expect(result).toBeNull()
    })

    it('Authorization header token 无效时返回 null', () => {
      // arrange
      vi.spyOn(jwt, 'verify').mockImplementation(() => { throw new Error('invalid') })
      const headers = new Headers({ authorization: 'Bearer bad-token' })

      // act
      const result = getAuthFromHeaders(headers)

      // assert
      expect(result).toBeNull()
    })

    it('cookie 中 token 无效时返回 null', () => {
      // arrange
      vi.spyOn(jwt, 'verify').mockImplementation(() => { throw new Error('invalid') })
      const headers = new Headers({ cookie: 'token=bad-token' })

      // act
      const result = getAuthFromHeaders(headers)

      // assert
      expect(result).toBeNull()
    })

    it('不误匹配 csrf_token 等类似 cookie 名', () => {
      // arrange
      const payload = { id: 'user-1', username: 'testuser' }
      vi.spyOn(jwt, 'verify').mockReturnValue(payload as never)
      const headers = new Headers({ cookie: 'csrf_token=abc123; token=real-token' })

      // act
      const result = getAuthFromHeaders(headers)

      // assert
      expect(jwt.verify).toHaveBeenCalledWith('real-token', expect.any(String))
      expect(result).toEqual(payload)
    })
  })

  // ---------- consumeAiQuota ----------

  describe('consumeAiQuota()', () => {
    it('正常消耗一次配额', async () => {
      // arrange
      mockExecute.mockResolvedValue({ rows: [{ used_count: 3 }] })

      // act
      const result = await consumeAiQuota('user-1', '2024-01-15')

      // assert
      expect(result.used).toBe(3)
      expect(result.limit).toBe(10)
      expect(result.remaining).toBe(7)
    })

    it('达到上限时抛出 429 错误', async () => {
      // arrange
      mockExecute.mockResolvedValue({ rows: [] }) // RETURNING 为空 = 已达上限
      // getAiQuotaStatus 的 mock
      mockSelect.mockReturnValue(createQueryBuilder([{ usedCount: 10 }]))

      // act & assert
      const err = await consumeAiQuota('user-1', '2024-01-15').catch(e => e) as Error & { status: number }
      expect(err.message).toBe('今日 AI 使用次数已达上限，请明天再试')
      expect(err.status).toBe(429)
    })

    it('userId 为空时返回默认配额', async () => {
      // act
      const result = await consumeAiQuota(undefined)

      // assert
      expect(result.used).toBe(0)
      expect(result.remaining).toBe(10)
    })
  })

  // ---------- addFavoriteAttraction / removeFavoriteAttraction ----------

  describe('addFavoriteAttraction()', () => {
    it('成功添加收藏', async () => {
      // arrange
      mockInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
        }),
      })

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
      mockDelete.mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      })

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
      mockSelect.mockReturnValue(createQueryBuilder([{ passwordHash: 'old-hashed' }]))
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as never)
      vi.spyOn(bcrypt, 'hash').mockResolvedValue('new-hashed' as never)
      mockUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      })

      // act & assert
      await expect(changePassword('user-1', 'oldpassword', 'newpassword')).resolves.toBeUndefined()
    })

    it('当前密码错误时抛出错误', async () => {
      // arrange
      mockSelect.mockReturnValue(createQueryBuilder([{ passwordHash: 'old-hashed' }]))
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(false as never)

      // act & assert
      await expect(changePassword('user-1', 'wrongpassword', 'newpassword')).rejects.toThrow('当前密码错误')
    })

    it('用户不存在时抛出错误', async () => {
      // arrange
      mockSelect.mockReturnValue(createQueryBuilder([]))

      // act & assert
      await expect(changePassword('nonexistent', 'oldpassword', 'newpassword')).rejects.toThrow('用户不存在')
    })

    it('userId 为空时抛出错误', async () => {
      await expect(changePassword('', 'old', 'new')).rejects.toThrow('用户信息无效')
    })

    it('当前密码为空时抛出错误', async () => {
      await expect(changePassword('user-1', '', 'newpassword')).rejects.toThrow('当前密码和新密码不能为空')
    })

    it('新密码为空时抛出错误', async () => {
      await expect(changePassword('user-1', 'oldpassword', '')).rejects.toThrow('当前密码和新密码不能为空')
    })

    it('新密码过短时抛出错误', async () => {
      await expect(changePassword('user-1', 'oldpassword', '12345')).rejects.toThrow('新密码长度至少 6 个字符')
    })
  })
})
