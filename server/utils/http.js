export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

export function httpError(status, message) {
  return new HttpError(status, message)
}

export function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next)
    }
    catch (err) {
      next(err)
    }
  }
}

export function notFoundHandler(_req, res) {
  res.status(404).json({ success: false, message: '接口不存在' })
}

export function errorHandler(err, _req, res, next) {
  if (res.headersSent) {
    next(err)
    return
  }

  if (err.type === 'entity.too.large') {
    res.status(413).json({ success: false, message: '请求数据过大' })
    return
  }

  if (err.message === '不允许的跨域来源') {
    res.status(403).json({ success: false, message: err.message })
    return
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, message: '令牌无效或已过期' })
    return
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ success: false, message: err.message })
    return
  }

  console.error('服务器错误:', err)
  res.status(500).json({ success: false, message: '服务器内部错误' })
}
