/**
 * 项目类型定义文件
 * 定义整个应用中使用的核心数据结构
 */

/** 景点数据 - 描述单个景点的详细信息 */
export interface SpotData {
  spot: string // 景点名称
  description: string // 景点描述
  duration: string // 游览时长，如 "2-3小时"
  ticket: string // 门票信息，如 "¥60" 或 "免费"
  transportation: string // 交通方式，如 "地铁1号线"
}

/** 每日行程 - 包含一天三个时段的景点安排 */
export interface DayItinerary {
  day: number // 第几天，从 1 开始
  date: string // 日期，如 "2024-01-15"
  morning: SpotData // 上午行程
  afternoon: SpotData // 下午行程
  evening: SpotData // 晚上行程
}

/** 预算明细 - 将总预算分解为各项支出 */
export interface BudgetBreakdown {
  accommodation: number // 住宿费用
  food: number // 餐饮费用
  transportation: number // 交通费用
  tickets: number // 门票费用
  other: number // 其他费用
}

/** AI 接口返回的完整行程结果 */
export interface ItineraryResult {
  city: string // 目的地城市
  days: number // 行程天数
  totalBudget: number // 总预算
  dailyItinerary: DayItinerary[] // 每日行程数组
  budgetBreakdown: BudgetBreakdown // 预算明细
  tips: string[] // 旅行提示/建议
}

/** Agent 执行步骤 - 用于展示 AI 的多步骤推理过程 */
export interface AgentStep {
  step: number // 步骤编号
  name: string // 步骤名称
  status: 'start' | 'complete' // 状态：开始或完成
  data?: Record<string, unknown> // 步骤输出数据
}

/** 聊天消息 - 用于 AI 对话功能 */
export interface ChatMessage {
  role: 'user' | 'assistant' // 消息发送者：用户或 AI 助手
  content: string // 消息内容
}

/** 历史记录 - 保存用户之前生成的行程 */
export interface HistoryRecord {
  city: string // 目的地城市
  days: number // 行程天数
  budget: number | string // 预算金额
  date: string // 生成日期
  itinerary: DayItinerary[] // 每日行程
  budgetBreakdown: BudgetBreakdown | null // 预算明细（可能为空）
  tips: string[] // 旅行提示
}
