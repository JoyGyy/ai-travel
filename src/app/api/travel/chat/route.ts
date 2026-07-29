import { consumeAiQuota, getAuthFromHeaders } from '@/lib/services/auth'
import { errorResponse } from '@/lib/utils/http'
import { createTravelChatStream } from '@/lib/ai/stream'

export async function POST(req: Request) {
  try {
    const user = getAuthFromHeaders(req.headers)
    if (!user) {
      return new Response(JSON.stringify({ success: false, message: '未登录' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const messages = Array.isArray(body.messages) ? body.messages : []
    if (!messages.length) {
      return new Response(JSON.stringify({ success: false, message: '消息不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    await consumeAiQuota(user.id)
    return createTravelChatStream(messages)
  }
  catch (err) {
    return errorResponse(err)
  }
}
