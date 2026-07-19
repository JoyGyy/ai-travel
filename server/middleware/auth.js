import { verifyToken } from '../services/auth.js'
import { httpError } from '../utils/http.js'

export function requireAuthForRequest(req) {
  if (req.user) {
    return req.user
  }

  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer '))
    throw httpError(401, '未登录')

  const token = authHeader.slice(7)
  req.user = verifyToken(token)
  return req.user
}

export function requireAuth(req, _res, next) {
  try {
    requireAuthForRequest(req)
    next()
  }
  catch (err) {
    next(err)
  }
}
