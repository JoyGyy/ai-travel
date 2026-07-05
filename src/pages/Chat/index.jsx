/**
 * AI 对话页面
 */
import { Modal, message } from 'antd'
import { RobotOutlined, CompassOutlined, DeleteOutlined } from '@ant-design/icons'
import { useEffect, useRef, useState } from 'react'
import { ChatAgentSteps } from '@/components/ChatAgentSteps'
import { ChatBubble } from '@/components/ChatBubble'
import { RAGSource } from '@/components/RAGSource'
import { useSSE } from '@/hooks/useSSE'
import { useChatStore } from '@/stores/chat'
import './style.css'

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
  const [ragSources, setRagSources] = useState([])
  const [notice, setNotice] = useState('')
  const messagesRef = useRef(null)
  const { sendRequest, abort } = useSSE()

  const lastMessage = messages[messages.length - 1]

  useEffect(() => { return () => abort() }, [abort])
  useEffect(() => { clearMessages() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messages.length, lastMessage?.content, lastMessage?.steps?.length])

  async function clearChat() {
    const confirmed = await Modal.confirm({ title: '确定要清空所有对话记录吗？', okText: '确定', cancelText: '取消' })
    if (confirmed) clearMessages()
  }

  async function sendMessage(msg) {
    const text = msg || inputMsg.trim()
    if (!text) return

    addMessage({ role: 'user', content: text })
    setInputMsg('')
    addMessage({ role: 'assistant', content: '' })
    setLoading(true)
    setCurrentAgentStep(0)
    setRagSources([])
    setNotice('')

    const historyForBackend = useChatStore.getState().messages.filter(m => m.content).map(m => ({ role: m.role, content: m.content }))

    try {
      await sendRequest('/api/travel/chat', { message: text, messages: historyForBackend }, {
        onChunk: full => updateLastMessage(full),
        onStep: (data) => {
          setCurrentAgentStep(data.step)
          updateLastMessageSteps(data)
        },
        onNotice: (msg) => setNotice(msg),
        onComplete: (data) => {
          if (data?.sources?.length) setRagSources(data.sources)
        },
      })
    } catch {
      updateLastMessage('请求失败，请稍后重试')
    } finally {
      setLoading(false)
      setCurrentAgentStep(0)
    }
  }

  return (
    <div className="chat-page">
      <div className="chat-page__hero">
        <div className="chat-page__hero-deco" />
        <div className="chat-page__hero-header">
          <div>
            <p className="chat-page__hero-label">AI ASSISTANT</p>
            <h1 className="chat-page__hero-title">旅行顾问</h1>
            <p className="chat-page__hero-subtitle">有什么旅行问题，尽管问我</p>
          </div>
          {messages.length > 0 && (
            <button onClick={clearChat} className="chat-page__clear-btn">
              <DeleteOutlined />
            </button>
          )}
        </div>
      </div>

      <div className="chat-page__messages" ref={messagesRef}>
        {messages.map((msg, i) => {
          const isEmptyAssistant = msg.role === 'assistant' && !msg.content && isLoading && i === messages.length - 1
          return (
            <div key={msg._id}>
              {msg.role === 'assistant' && msg.steps && msg.steps.length > 0 && (
                <ChatAgentSteps steps={msg.steps} isLoading={false} />
              )}
              {msg.role === 'assistant' && notice && i === messages.length - 1 && !isLoading && (
                <div className="chat-page__notice">
                  <span>⚠️</span>
                  <span>{notice}</span>
                </div>
              )}
              {!isEmptyAssistant && <ChatBubble role={msg.role} content={msg.content} />}
            </div>
          )
        })}

        {ragSources.length > 0 && !isLoading && <RAGSource sources={ragSources} />}

        {isLoading && (
          <>
            {lastMessage?.steps && lastMessage.steps.length > 0 && (
              <ChatAgentSteps steps={lastMessage.steps} currentStep={currentAgentStep} isLoading />
            )}
            <div className="chat-page__typing">
              <div className="chat-page__typing-avatar">
                <RobotOutlined />
              </div>
              <div className="chat-page__typing-dots">
                <span /><span /><span />
              </div>
            </div>
          </>
        )}

        {messages.length === 0 && (
          <div className="chat-page__empty">
            <div className="chat-page__empty-card">
              <div className="chat-page__empty-icon">
                <CompassOutlined />
              </div>
              <h2>你好，旅行者</h2>
              <p>告诉我你的目的地，我来帮你规划</p>
              <p className="chat-page__empty-hint">基于 RAG + Agent 技术，提供精准旅行建议</p>
            </div>
            <p className="chat-page__quick-title">试试这样问</p>
            <div className="chat-page__quick-list">
              {quickQuestions.map((q, i) => (
                <button key={q} onClick={() => sendMessage(q)} className="chat-page__quick-btn" style={{ animationDelay: `${i * 0.08}s` }}>
                  <span className="chat-page__quick-num">{i + 1}</span>
                  <span>{q}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="chat-page__input-bar">
        <div className="chat-page__input-inner">
          <input
            type="text"
            placeholder="输入你的问题..."
            value={inputMsg}
            onChange={e => setInputMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            disabled={isLoading}
            className="chat-page__input"
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !inputMsg.trim()}
            className="chat-page__send-btn"
          >
            <CompassOutlined />
          </button>
        </div>
      </div>
    </div>
  )
}
