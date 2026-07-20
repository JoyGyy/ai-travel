import { verifyToken } from '../services/auth.js'
import { httpError } from '../utils/http.js'

/**
 * 从请求中提取已认证用户（需先经过 requireAuth 中间件）
 * @param {import('express').Request} req
 * @returns {{ id: string, username: string }}
 * @throws {HttpError} 401 当用户未认证
 */
export function requireAuthForRequest(req) {
  if (!req.user)
    throw httpError(401, '未登录')
  return req.user
}

export function requireAuth(req, _res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer '))
      throw httpError(401, '未登录')

    const token = authHeader.slice(7)
    req.user = verifyToken(token)
    next()
  }
  catch (err) {
    next(err)
  }
}
