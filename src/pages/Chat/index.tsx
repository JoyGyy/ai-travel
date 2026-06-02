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
  const { sendRequest, abort } = useSSE()

  const lastMessage = messages[messages.length - 1]

  // BUG FIX: 组件卸载时中止进行中的请求，防止内存泄漏和状态残留
  useEffect(() => {
    return () => abort()
  }, [abort])

  // 进入页面时清空旧消息，每次都是全新对话
  useEffect(() => {
    clearMessages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messages.length, lastMessage?.content, lastMessage?.steps?.length])

  async function clearChat() {
    const result = await Dialog.confirm({ content: '确定要清空所有对话记录吗？' })
    if (result) clearMessages()
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
          if (result?.sources?.length) setRagSources(result.sources)
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
      {/* 头部 */}
      <div
        className="relative overflow-hidden px-6 pt-6 pb-7 md:pt-8 md:pb-9"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
      >
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full" style={{ background: 'rgba(99, 102, 241, 0.08)', filter: 'blur(30px)' }} />
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="mb-2 text-[10px] font-semibold tracking-[4px]" style={{ color: 'var(--c-gold-light)', opacity: 0.75 }}>AI ASSISTANT</p>
            <h1 className="mb-1 text-[26px] font-bold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-cream)', textShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              旅行顾问
            </h1>
            <p className="text-[12px] font-light" style={{ color: 'rgba(253, 246, 236, 0.5)' }}>有什么旅行问题，尽管问我</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="w-9 h-9 rounded-xl flex items-center justify-center border-none cursor-pointer shrink-0 transition-all active:scale-90"
              style={{ background: 'rgba(255, 252, 248, 0.1)' }}
            >
              <DeleteOutline style={{ color: 'rgba(253, 246, 236, 0.6)', fontSize: '17px' }} />
            </button>
          )}
        </div>
      </div>

      {/* 消息列表 */}
      <div ref={messagesRef} className="flex-1 overflow-y-auto px-4 pt-5 -mt-3 relative z-10 md:max-w-3xl md:mx-auto md:px-6">
        {messages.map((msg, i) => {
          // BUG FIX: 加载中不渲染空气泡，由下方加载指示器处理
          const isEmptyAssistant = msg.role === 'assistant' && !msg.content && isLoading && i === messages.length - 1
          return (
            <div key={i}>
              {msg.role === 'assistant' && msg.steps && msg.steps.length > 0 && (
                <ChatAgentSteps steps={msg.steps} isLoading={false} />
              )}
              {!isEmptyAssistant && <ChatBubble role={msg.role} content={msg.content} />}
            </div>
          )
        })}

        {ragSources.length > 0 && !isLoading && <RAGSource sources={ragSources} />}

        {/* 加载状态 */}
        {isLoading && (
          <>
            {lastMessage?.steps && lastMessage.steps.length > 0 && (
              <ChatAgentSteps steps={lastMessage.steps} currentStep={currentAgentStep} isLoading />
            )}
            <div className="flex items-start gap-2.5 mb-3 pl-0.5">
              <div
                className="shrink-0 flex items-center justify-center w-[30px] h-[30px] rounded-[10px]"
                style={{ background: 'linear-gradient(135deg, var(--c-sand) 0%, var(--c-cream) 100%)', boxShadow: '0 1px 3px rgba(99, 102, 241, 0.1)' }}
              >
                <ChatAddOutline style={{ fontSize: '14px', color: 'var(--c-terracotta)' }} />
              </div>
              <div
                className="flex gap-1.5 px-4 py-3 rounded-[4px_18px_18px_18px]"
                style={{ background: 'var(--c-white)', boxShadow: '0 1px 4px rgba(15, 23, 42, 0.04), 0 0 0 1px rgba(240, 232, 221, 0.5)' }}
              >
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
            <div
              className="rounded-2xl px-6 py-10 text-center mb-6"
              style={{ background: 'var(--c-white)', boxShadow: 'var(--shadow-md)', border: '1px solid rgba(240, 232, 221, 0.4)' }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: 'linear-gradient(135deg, var(--c-sand) 0%, var(--c-cream) 100%)', animation: 'pulseGlow 2.5s infinite' }}
              >
                <CompassOutline style={{ fontSize: '30px', color: 'var(--c-terracotta)' }} />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-ink)' }}>你好，旅行者</h2>
              <p className="text-[13px] mb-1.5" style={{ color: 'var(--c-ink-light)' }}>告诉我你的目的地，我来帮你规划</p>
              <p className="text-[11px]" style={{ color: 'var(--c-ink-light)', opacity: 0.5 }}>基于 RAG + Agent 技术，提供精准旅行建议</p>
            </div>
            <p className="text-[12px] font-semibold mb-3 pl-0.5 tracking-wide" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-ink-light)' }}>试试这样问</p>
            <div className="flex flex-col gap-2 md:flex-row md:gap-2.5">
              {quickQuestions.map((q, i) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3.5 border-none cursor-pointer text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
                  style={{
                    background: 'var(--c-white)',
                    boxShadow: 'var(--shadow-sm), 0 0 0 1px rgba(240, 232, 221, 0.4)',
                    animation: `fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both ${i * 0.08}s`,
                  }}
                >
                  <span
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, var(--c-terracotta) 0%, var(--c-terracotta-light) 100%)' }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-[13px] leading-snug" style={{ color: 'var(--c-ink)' }}>{q}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 输入栏 */}
      <div
        className="px-4 py-3 pb-5 md:px-8"
        style={{
          background: 'rgba(255, 252, 248, 0.8)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderTop: '1px solid rgba(240, 232, 221, 0.5)',
        }}
      >
        <div className="flex items-center gap-2.5 md:max-w-3xl md:mx-auto">
          <input
            type="text"
            placeholder="输入你的问题..."
            value={inputMsg}
            onChange={e => setInputMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            disabled={isLoading}
            className="flex-1 h-11 px-5 rounded-xl text-sm border outline-none transition-all"
            style={{
              background: 'var(--c-paper)',
              color: 'var(--c-ink)',
              borderColor: 'rgba(240, 232, 221, 0.6)',
              boxShadow: 'var(--shadow-inset)',
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !inputMsg.trim()}
            className="w-11 h-11 rounded-xl flex items-center justify-center border-none cursor-pointer shrink-0 transition-all active:scale-90"
            style={{
              background: isLoading || !inputMsg.trim()
                ? 'var(--c-paper-dark)'
                : 'linear-gradient(135deg, var(--c-terracotta) 0%, var(--c-terracotta-light) 100%)',
              color: isLoading || !inputMsg.trim() ? 'var(--c-ink-light)' : '#fff',
              cursor: isLoading || !inputMsg.trim() ? 'not-allowed' : 'pointer',
              boxShadow: isLoading || !inputMsg.trim() ? 'none' : '0 2px 8px rgba(99, 102, 241, 0.2)',
            }}
          >
            <CompassOutline style={{ fontSize: '18px' }} />
          </button>
        </div>
      </div>
    </div>
  )
}
