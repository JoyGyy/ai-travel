/**
 * AI 对话页面
 * 提供与 AI 旅行顾问的实时对话功能，支持多工具 Agent + 对话历史
 */
import { Dialog } from 'antd-mobile'
import { ChatAddOutline, CompassOutline, DeleteOutline } from 'antd-mobile-icons'
import { useEffect, useRef, useState } from 'react'
import { ChatAgentSteps } from '@/components/ChatAgentSteps'
import { ChatBubble } from '@/components/ChatBubble'
import { RAGSource } from '@/components/RAGSource'
import { useSSE } from '@/hooks/useSSE'
import { useChatStore } from '@/stores/chat'
import type { AgentStep } from '@/types'

/** 预设的快速问题列表 */
const quickQuestions = [
  '北京有哪些必去的景点？',
  '上海美食推荐',
  '成都三日游攻略',
  '如何选择旅行保险？',
]

export default function Chat() {
  const {
    messages, isLoading, currentAgentStep,
    addMessage, updateLastMessage, updateLastMessageSteps,
    clearMessages, setLoading, setCurrentAgentStep,
  } = useChatStore()
  const [inputMsg, setInputMsg] = useState('')
  const [ragSources, setRagSources] = useState<string[]>([])
  const messagesRef = useRef<HTMLDivElement>(null)
  const { sendRequest } = useSSE()

  const lastMessage = messages[messages.length - 1]

  // 自动滚动到底部
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messages.length, lastMessage?.content, lastMessage?.steps?.length])

  async function clearChat() {
    const result = await Dialog.confirm({ content: '确定要清空所有对话记录吗？' })
    if (result)
      clearMessages()
  }

  async function sendMessage(msg?: string) {
    const text = msg || inputMsg.trim()
    if (!text) return

    addMessage({ role: 'user', content: text })
    setInputMsg('')
    addMessage({ role: 'assistant', content: '' })
    setLoading(true)
    setCurrentAgentStep(0)
    setRagSources([])

    // 构建对话历史（排除当前空占位消息）
    const historyForBackend = useChatStore.getState().messages
      .filter(m => m.content)
      .map(m => ({ role: m.role, content: m.content }))

    try {
      await sendRequest('/api/travel/chat', { message: text, messages: historyForBackend }, {
        onChunk: full => updateLastMessage(full),
        onStep: (data: unknown) => {
          const step = data as AgentStep
          setCurrentAgentStep(step.step)
          updateLastMessageSteps(step)
        },
        onComplete: (data: unknown) => {
          const result = data as { sources?: string[] }
          if (result?.sources?.length) {
            setRagSources(result.sources)
          }
        },
      })
    }
    catch {
      updateLastMessage('请求失败，请稍后重试')
    }
    finally {
      setLoading(false)
      setCurrentAgentStep(0)
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--c-paper)' }}>
      {/* 页面头部 */}
      <div
        className="relative overflow-hidden px-6 pt-6 pb-8 md:pt-8 md:pb-10"
        style={{ background: 'linear-gradient(160deg, var(--c-forest) 0%, #2d6a4f 100%)' }}
      >
        <div className="absolute -top-7 -right-7 w-25 h-25 rounded-full" style={{ background: 'rgba(212, 165, 116, 0.12)', backdropFilter: 'blur(8px)' }} />
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="mb-2 text-[10px] font-semibold tracking-[4px]" style={{ color: 'var(--c-gold-light)' }}>AI ASSISTANT</p>
            <h1 className="mb-1.5 text-[26px] font-bold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-cream)', textShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>旅行顾问</h1>
            <p className="text-[13px] font-light" style={{ color: 'rgba(253, 246, 236, 0.7)' }}>有什么旅行问题，尽管问我</p>
          </div>
          {messages.length > 0 && (
            <button onClick={clearChat} className="w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer shrink-0" style={{ background: 'rgba(255, 252, 248, 0.12)' }}>
              <DeleteOutline style={{ color: 'rgba(253, 246, 236, 0.7)', fontSize: '18px' }} />
            </button>
          )}
        </div>
      </div>

      {/* 消息列表区域 */}
      <div ref={messagesRef} className="flex-1 overflow-y-auto px-4 pt-5 -mt-3 relative z-10 md:max-w-3xl md:mx-auto md:px-6">
        {/* 渲染所有消息 */}
        {messages.map((msg, i) => (
          <div key={i}>
            {msg.role === 'assistant' && msg.steps && msg.steps.length > 0 && (
              <ChatAgentSteps steps={msg.steps} isLoading={false} />
            )}
            <ChatBubble role={msg.role} content={msg.content} />
          </div>
        ))}

        {/* RAG 引用来源 */}
        {ragSources.length > 0 && !isLoading && <RAGSource sources={ragSources} />}

        {/* AI 加载动画 */}
        {isLoading && (
          <>
            {/* 实时 Agent 步骤 */}
            {(() => {
              const steps = useChatStore.getState().messages
              const last = steps[steps.length - 1]
              return last?.steps && last.steps.length > 0
                ? <ChatAgentSteps steps={last.steps} currentStep={currentAgentStep} isLoading />
                : null
            })()}
            {/* 跳动圆点 */}
            <div className="flex items-start gap-2 mb-3 pl-1">
              <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full" style={{ background: 'var(--c-sand)' }}>
                <ChatAddOutline style={{ fontSize: '14px', color: 'var(--c-terracotta)' }} />
              </div>
              <div className="flex gap-1 px-4 py-3 rounded-2xl rounded-tl-sm" style={{ background: 'var(--c-white)', boxShadow: '0 1px 4px rgba(45, 42, 38, 0.04)' }}>
                <span className="w-[5px] h-[5px] rounded-full" style={{ background: 'var(--c-gold)', animation: 'dotBounce 1.2s infinite' }} />
                <span className="w-[5px] h-[5px] rounded-full" style={{ background: 'var(--c-gold)', animation: 'dotBounce 1.2s infinite 0.15s' }} />
                <span className="w-[5px] h-[5px] rounded-full" style={{ background: 'var(--c-gold)', animation: 'dotBounce 1.2s infinite 0.3s' }} />
              </div>
            </div>
          </>
        )}

        {/* 空状态 */}
        {messages.length === 0 && (
          <div className="pt-4">
            <div className="bg-white rounded-[20px] px-6 py-8 text-center mb-6" style={{ boxShadow: '0 2px 12px rgba(45, 42, 38, 0.05)' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, var(--c-sand) 0%, var(--c-cream) 100%)', animation: 'pulseGlow 2s infinite' }}>
                <CompassOutline style={{ fontSize: '32px', color: 'var(--c-terracotta)' }} />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-ink)' }}>你好，旅行者</h2>
              <p className="text-sm mb-2" style={{ color: 'var(--c-ink-light)' }}>告诉我你的目的地，我来帮你规划</p>
              <p className="text-xs" style={{ color: 'var(--c-ink-light)', opacity: 0.7 }}>基于 RAG + Agent 技术，提供精准旅行建议</p>
            </div>
            <p className="text-sm font-semibold mb-3 pl-1" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-ink-light)' }}>试试这样问</p>
            <div className="flex flex-col gap-2.5 md:flex-row md:gap-3">
              {quickQuestions.map((q, i) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="flex items-center gap-3 bg-white rounded-[14px] px-4 py-3.5 border-none cursor-pointer text-left active:scale-[0.98] active:bg-[var(--c-sand)] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
                  style={{ boxShadow: '0 1px 4px rgba(45, 42, 38, 0.04)', animation: `fadeUp 0.4s ease both ${i * 0.08}s` }}
                >
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary-light text-white text-xs flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-[13px] leading-snug" style={{ color: 'var(--c-ink)' }}>{q}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 底部输入栏 */}
      <div className="px-4 py-2.5 pb-[18px] border-t md:px-8" style={{ background: 'var(--c-white)', borderColor: 'var(--c-paper-dark)' }}>
        <div className="flex items-center gap-2.5 md:max-w-3xl md:mx-auto">
          <input
            type="text"
            placeholder="输入你的问题..."
            value={inputMsg}
            onChange={e => setInputMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            disabled={isLoading}
            className="flex-1 h-10 px-[18px] rounded-full text-sm border-none outline-none focus:border-primary transition-colors"
            style={{ background: 'var(--c-paper)', color: 'var(--c-ink)', boxShadow: 'inset 0 1px 3px rgba(45,42,38,0.06)' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !inputMsg.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer shrink-0 transition-all active:scale-[0.92]"
            style={{
              background: isLoading || !inputMsg.trim() ? 'var(--c-paper-dark)' : 'linear-gradient(135deg, var(--c-terracotta) 0%, var(--c-terracotta-light) 100%)',
              color: isLoading || !inputMsg.trim() ? 'var(--c-ink-light)' : '#fff',
              cursor: isLoading || !inputMsg.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            <CompassOutline />
          </button>
        </div>
      </div>
    </div>
  )
}
