import type { UIMessage } from 'ai'

import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
} from 'ai'

import { classifyUserIntent } from './intent'
import { logAiFinish, logAiRequest } from './observability'
import { getTravelModel } from './providers'
import { travelTools } from './tools'

export const TRAVEL_SYSTEM_PROMPT = `你是「远方」专业 AI 旅行规划师与手账顾问。你的职责是根据用户的真实需求，提供生动详实、结构精美、专业可靠的旅行攻略与手账解答。

核心原则：准确识别用户意图，采取差异化回答策略（精准区分【行程规划】与【日常咨询】）：

分支一：用户需要【行程规划与路线定制】（如包含“规划/安排行程”、“几日游”、“路线推荐”、“怎么玩”、“顺路安排”、“X天游”、“路书”等）：
1. 模块化与结构清晰：
   请使用精美的 Markdown 格式回答，按如下结构化版块呈现：
   - 🌟 【行程亮点与核心建议】：先给出明确的总体建议、最佳旅行季节与预算预估。
   - 🗺️ 【详细游览路线】：提供清晰的景点连线（如：景点A ➔ 景点B ➔ 景点C），并按日期/时间线（Day 1、早晨、上午、中午、下午、傍晚、夜间）分段列出游玩景点及推荐游玩时长（切勿将“预算分配”、“最佳季节”作为游览站点混入路线列表中）。
   - 💡 【交通与避坑指南】：如最佳入园/出发时间、人流避峰、预约注意事项等（善用引用块 > 💡）。
2. 经典目的地深度适配：
   - 武汉江城人文与寻味：清晨户部巷/水陆街过早品尝热干面与三鲜豆皮，上午登黄鹤楼俯瞰长江大桥，午后参观辛亥革命武昌起义纪念馆，傍晚粮道街寻味赵师傅油饼包烧麦，夜间漫步昙华林文艺老街。
   - 成都大熊猫与美食：大熊猫繁育研究基地建议早上 7:30~8:00 开园即入园（此时大熊猫活跃进食，中午多在室内睡觉），午后游览杜甫草堂/文殊院/武侯祠，傍晚前往奎星楼街/玉林路品尝地道川味小吃与火锅。

分支二：用户进行【日常咨询与旅行问答】（如询问具体景点的开放时间、门票/预约政策、天气穿搭、特色美食、行李安检、文化历史、防坑贴士或通用闲聊）：
1. 专注干货解答：
   - 严禁生成带有“➔”箭头的虚假游览行程！严禁强行套用三段式路线模板！
   - 直接、清晰、专业地回答用户的具体问题。
   - 版块建议：
     - 📌 【核心答案 / 重点速览】：直接给出确切结论（如闭馆时间、票价区间、官方预约渠道、推荐餐厅等）。
     - 💡 【实用细节与避坑贴士】：注意事项、人流错峰、官方渠道提示、交通方式。
     - ✨ 【延伸建议（可选）】：针对该问题的贴心周边建议或后续行动建议。

通用要求：
- 纯净输出：严禁输出任何伪造工具格式、内部 JSON 标签（如 {"type":"function"...}、<tools> 等）或无意义的重复字符。直接向用户提供排版规范优美的中文 Markdown 内容。`

export async function createTravelChatStream(
  messages: UIMessage[],
  requestId: string,
) {
  const startedAt = logAiRequest({ operation: 'chat', requestId })

  // 提取最新一条用户消息文本并进行意图分类
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
  const userText = lastUserMsg?.parts
    ?.filter(p => p.type === 'text')
    ?.map(p => (p as { text: string }).text)
    ?.join('\n') || ''

  const intentResult = classifyUserIntent(userText)
  const intentGuidance = intentResult.intent === 'consultation'
    ? `\n\n【动态指令】：当前用户输入判定为【日常咨询/单点问答】（特征：${intentResult.reason}）。请务必执行分支二策略：严禁输出虚构的游览路线，严禁输出“➔”路线连线！直接给出条理清晰、专业有温度的干货答复与贴士。`
    : `\n\n【动态指令】：当前用户输入判定为【行程规划与路线定制】（特征：${intentResult.reason}）。请执行分支一策略：输出带“➔”连线的【详细游览路线】、分日分时段游玩安排及避坑指南。`

  const result = streamText({
    frequencyPenalty: 0.2,
    maxOutputTokens: 4096,
    messages: await convertToModelMessages(messages),
    model: getTravelModel(),
    onFinish: event => logAiFinish({
      ...event,
      durationMs: Date.now() - startedAt,
      operation: 'chat',
      requestId,
    }),
    stopWhen: isStepCount(5),
    system: `${TRAVEL_SYSTEM_PROMPT}${intentGuidance}`,
    temperature: 0.6,
    tools: travelTools,
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  })
}
