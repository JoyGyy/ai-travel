'use client'

/**
 * 工具调用步骤展示组件
 * 以时间线形式展示 AI Agent 调用工具的过程
 * 类似 Claude Code 的工具调用展示效果
 */
import {
  CheckCircle2,
  ChevronRight,
  Loader2,
  MapPin,
  Search,
  Wrench,
} from 'lucide-react'
import { useEffect, useState } from 'react'

/* ========== 类型定义 ========== */

interface ToolCall {
  args?: Record<string, unknown>
  id: string
  result?: unknown
  state: 'call' | 'result'
  toolName: string
}

interface ToolStepsProps {
  isLoading: boolean
  toolCalls: ToolCall[]
}

/* ========== 工具名称映射 ========== */

/** 工具名称到中文和图标的映射 */
const TOOL_CONFIG: Record<string, { desc: string, icon: typeof Search }> = {
  compareCities: { desc: '对比城市信息', icon: MapPin },
  getCityList: { desc: '获取城市列表', icon: Search },
  getTravelTips: { desc: '查询旅行贴士', icon: Wrench },
  searchProductAttractions: { desc: '搜索景点信息', icon: MapPin },
  searchTravelInfo: { desc: '查询旅行知识库', icon: Search },
}

/** 获取工具显示名称 */
function getToolDisplayName(toolName: string): string {
  return TOOL_CONFIG[toolName]?.desc || toolName
}

/* ========== 单个步骤组件 ========== */

function StepItem({
  isLast,
  toolCall,
}: {
  isLast: boolean
  toolCall: ToolCall
}) {
  const isComplete = toolCall.state === 'result'
  const config = TOOL_CONFIG[toolCall.toolName]
  const Icon = config?.icon || Wrench
  const displayName = getToolDisplayName(toolCall.toolName)

  // 提取参数摘要
  const argsSummary = toolCall.args
    ? Object.entries(toolCall.args)
        .filter(([_, v]) => v)
        .map(([_, v]) => String(v))
        .join(' · ')
    : ''

  return (
    <div className="flex items-start gap-3">
      {/* 左侧时间线 */}
      <div className="flex flex-col items-center">
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs transition-all ${
            isComplete
              ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm'
              : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white animate-pulse shadow-sm'
          }`}
        >
          {isComplete
            ? (
                <CheckCircle2 size={14} />
              )
            : (
                <Loader2 className="animate-spin" size={14} />
              )}
        </div>
        {!isLast && (
          <div
            className={`w-px h-5 my-1 ${
              isComplete ? 'bg-emerald-300' : 'bg-gray-200'
            }`}
          />
        )}
      </div>

      {/* 右侧内容 */}
      <div className="min-w-0 flex-1 pb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-travel-ocean" />
          <span className="text-xs font-semibold text-travel-ink">
            {displayName}
          </span>
          {!isComplete && (
            <span className="text-xs text-blue-500">
              执行中...
            </span>
          )}
        </div>

        {/* 参数摘要 */}
        {argsSummary && (
          <div className="mt-1 flex items-center gap-1">
            <ChevronRight className="h-3 w-3 shrink-0 text-travel-muted" />
            <span className="min-w-0 overflow-wrap-anywhere text-xs text-travel-muted">
              {argsSummary}
            </span>
          </div>
        )}

        {/* 结果摘要 */}
        {isComplete && (
          <div className="mt-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-700">
            ✓ 调用完成
          </div>
        )}
      </div>
    </div>
  )
}

/* ========== 主组件 ========== */

export function ToolSteps({ isLoading, toolCalls }: ToolStepsProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  // 加载中自动展开，完成后延迟收起
  useEffect(() => {
    if (isLoading) {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setIsExpanded(true)
    }
    else if (toolCalls.length > 0) {
      const timer = setTimeout(() => setIsExpanded(false), 1500)
      return () => clearTimeout(timer)
    }
  }, [isLoading, toolCalls.length])

  // 无工具调用时不渲染
  if (toolCalls.length === 0) {
    return null
  }

  const completedCount = toolCalls.filter(t => t.state === 'result').length

  return (
    <div className="overflow-hidden rounded-2xl border border-travel-ink/8 bg-travel-surface shadow-sm">
      {/* 折叠头 */}
      <button
        aria-expanded={isExpanded}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-travel-sand/20"
        onClick={() => setIsExpanded(!isExpanded)}
        type="button"
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
              isLoading
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white animate-pulse'
                : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
            }`}
          >
            <Wrench size={12} />
          </div>
          <span className="text-xs font-bold tracking-wide text-travel-ocean">
            AGENT 工具调用
          </span>
          <span className="text-xs text-travel-muted">
            (
            {completedCount}
            /
            {toolCalls.length}
            )
          </span>
        </div>
        <ChevronRight
          className={`h-4 w-4 text-travel-muted transition-transform ${
            isExpanded ? 'rotate-90' : ''
          }`}
        />
      </button>

      {/* 展开后的步骤列表 */}
      {isExpanded && (
        <div className="px-4 pb-3">
          {toolCalls.map((toolCall, index) => (
            <StepItem
              isLast={index === toolCalls.length - 1}
              key={toolCall.id}
              toolCall={toolCall}
            />
          ))}
        </div>
      )}
    </div>
  )
}
