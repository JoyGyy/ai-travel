/**
 * AI 对话页面
 * 提供与 AI 旅行顾问的实时对话功能
 */
import { Dialog } from 'antd-mobile'
import { ChatAddOutline, CompassOutline, DeleteOutline } from 'antd-mobile-icons'
import { useEffect, useRef, useState } from 'react'
import { ChatBubble } from '@/components/ChatBubble'
import { RAGSource } from '@/components/RAGSource'
import { useSSE } from '@/hooks/useSSE'
import { useChatStore } from '@/stores/chat'

/** 预设的快速问题列表 */
const quickQuestions = [
  '北京有哪些必去的景点？',
  '上海美食推荐',
  '成都三日游攻略',
  '如何选择旅行保险？',
]

export default function Chat() {
  // 从全局状态获取聊天相关数据和方法
  const { messages, isLoading, addMessage, updateLastMessage, clearMessages, setLoading } = useChatStore()
  const [inputMsg, setInputMsg] = useState('') // 输入框内容
  const [ragSources, setRagSources] = useState<string[]>([]) // RAG 引用来源
  const messagesRef = useRef<HTMLDivElement>(null) // 消息容器引用，用于自动滚动
  const { sendRequest } = useSSE() // SSE 请求函数

  // 获取最后一条消息，用于依赖数组
  const lastMessage = messages[messages.length - 1]

  /**
   * 自动滚动到底部
   * 当消息列表更新时，自动滚动到最新消息
   */
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messages.length, lastMessage?.content]) // 依赖消息数量和最后一条消息内容

  /**
   * 清空对话记录
   * 弹出确认对话框，用户确认后清空所有消息
   */
  async function clearChat() {
    const result = await Dialog.confirm({ content: '确定要清空所有对话记录吗？' })
    if (result)
      clearMessages()
  }

  /**
   * 发送消息
   * @param msg - 可选的消息内容，如果不传则使用输入框内容
   */
  async function sendMessage(msg?: string) {
    const text = msg || inputMsg.trim()
    if (!text)
      return // 空消息不发送

    // 添加用户消息到列表
    addMessage({ role: 'user', content: text })
    setInputMsg('') // 清空输入框
    // 添加空的 AI 消息占位，后续通过流式更新内容
    addMessage({ role: 'assistant', content: '' })
    setLoading(true) // 设置加载状态

    setRagSources([]) // 清空之前的引用来源
    try {
      // 发送 SSE 请求，通过 onChunk 回调实时更新 AI 回复
      await sendRequest('/api/travel/chat', { message: text }, {
        onChunk: full => updateLastMessage(full), // 流式更新消息内容
        onComplete: (data: unknown) => {
          const result = data as { sources?: string[] }
          if (result?.sources?.length) {
            setRagSources(result.sources)
          }
        },
      })
    }
    catch {
      updateLastMessage('请求失败，请稍后重试') // 请求失败时显示错误提示
    }
    finally {
      setLoading(false) // 无论成功失败都取消加载状态
    }
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--c-paper)' }}>
      {/* 页面头部 */}
      <div
        className="relative overflow-hidden px-6 pt-6 pb-8"
        style={{ background: 'linear-gradient(160deg, var(--c-forest) 0%, #2d6a4f 100%)' }}
      >
        {/* 装饰性圆形 */}
        <div className="absolute -top-7 -right-7 w-25 h-25 rounded-full" style={{ background: 'rgba(212, 165, 116, 0.12)' }} />
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="mb-2 text-[10px] font-semibold tracking-[3px]" style={{ color: 'var(--c-gold-light)' }}>AI ASSISTANT</p>
            <h1 className="mb-1.5 text-[26px] font-bold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-cream)' }}>旅行顾问</h1>
            <p className="text-[13px] font-light" style={{ color: 'rgba(253, 246, 236, 0.7)' }}>有什么旅行问题，尽管问我</p>
          </div>
          {/* 清空按钮 - 仅在有消息时显示 */}
          {messages.length > 0 && (
            <button onClick={clearChat} className="w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer shrink-0" style={{ background: 'rgba(255, 252, 248, 0.12)' }}>
              <DeleteOutline style={{ color: 'rgba(253, 246, 236, 0.7)', fontSize: '18px' }} />
            </button>
          )}
        </div>
      </div>

      {/* 消息列表区域 */}
      <div ref={messagesRef} className="flex-1 overflow-y-auto px-4 pt-5 -mt-3 relative z-10">
        {/* 渲染所有消息 */}
        {messages.map((msg, i) => (
          <ChatBubble key={i} role={msg.role} content={msg.content} />
        ))}

        {/* RAG 引用来源 */}
        {ragSources.length > 0 && !isLoading && <RAGSource sources={ragSources} />}

        {/* AI 加载动画 - 三个跳动的圆点 */}
        {isLoading && (
          <div className="flex items-start gap-2 mb-3 pl-1">
            <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full" style={{ background: 'var(--c-sand)' }}>
              <ChatAddOutline style={{ fontSize: '14px', color: 'var(--c-terracotta)' }} />
            </div>
            <div className="flex gap-1 px-4 py-3 rounded-2xl rounded-tl-sm" style={{ background: 'var(--c-white)', boxShadow: '0 1px 4px rgba(45, 42, 38, 0.04)' }}>
              <span className="w-[5px] h-[5px] rounded-full" style={{ background: 'var(--c-gold)', animation: 'bounce 1.2s infinite' }} />
              <span className="w-[5px] h-[5px] rounded-full" style={{ background: 'var(--c-gold)', animation: 'bounce 1.2s infinite 0.2s' }} />
              <span className="w-[5px] h-[5px] rounded-full" style={{ background: 'var(--c-gold)', animation: 'bounce 1.2s infinite 0.4s' }} />
            </div>
          </div>
        )}

        {/* 空状态 - 显示欢迎语和快速问题 */}
        {messages.length === 0 && (
          <div className="pt-4">
            {/* 欢迎卡片 */}
            <div className="bg-white rounded-[20px] px-6 py-8 text-center mb-6" style={{ boxShadow: '0 2px 12px rgba(45, 42, 38, 0.05)' }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--c-sand)' }}>
                <CompassOutline style={{ fontSize: '32px', color: 'var(--c-terracotta)' }} />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-ink)' }}>你好，旅行者</h2>
              <p className="text-sm" style={{ color: 'var(--c-ink-light)' }}>告诉我你的目的地，我来帮你规划</p>
            </div>
            {/* 快速问题列表 */}
            <p className="text-sm font-semibold mb-3 pl-1" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-ink-light)' }}>试试这样问</p>
            <div className="flex flex-col gap-2.5">
              {quickQuestions.map((q, i) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="flex items-center gap-3 bg-white rounded-[14px] px-4 py-3.5 border-none cursor-pointer text-left active:scale-[0.98] active:bg-[var(--c-sand)] transition-all"
                  style={{ boxShadow: '0 1px 4px rgba(45, 42, 38, 0.04)', animation: `fadeUp 0.4s ease both ${i * 0.08}s` }}
                >
                  {/* 问题序号 */}
                  <span className="text-[13px] font-bold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-terracotta)', opacity: 0.6 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {/* 问题内容 */}
                  <span className="text-[13px] leading-snug" style={{ color: 'var(--c-ink)' }}>{q}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 底部输入栏 */}
      <div className="px-4 py-2.5 pb-[18px] border-t" style={{ background: 'var(--c-white)', borderColor: 'var(--c-paper-dark)' }}>
        <div className="flex items-center gap-2.5">
          {/* 消息输入框 */}
          <input
            type="text"
            placeholder="输入你的问题..."
            value={inputMsg}
            onChange={e => setInputMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()} // 按回车发送
            disabled={isLoading} // 加载时禁用输入
            className="flex-1 h-10 px-[18px] rounded-full text-sm border-none outline-none"
            style={{ background: 'var(--c-paper)', color: 'var(--c-ink)' }}
          />
          {/* 发送按钮 */}
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !inputMsg.trim()} // 加载中或输入为空时禁用
            className="w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer shrink-0 transition-all active:scale-[0.92]"
            style={{
              // 根据状态切换按钮样式
              background: isLoading || !inputMsg.trim() ? 'var(--c-paper-dark)' : 'var(--c-terracotta)',
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
