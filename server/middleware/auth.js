import { verifyToken } from '../services/auth.js'
import { httpError } from '../utils/http.js'

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
