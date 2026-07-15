import { CompassOutlined, DeleteOutlined, ExclamationCircleOutlined, RobotOutlined } from '@ant-design/icons'
/**
 * AI 对话页面
 */
import { Modal } from 'antd'
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
    messages,
    isLoading,
    currentAgentStep,
    addMessage,
    updateLastMessage,
    updateLastMessageSteps,
    clearMessages,
    setLoading,
    setCurrentAgentStep,
  } = useChatStore()
  const [inputMsg, setInputMsg] = useState('')
  const [ragSources, setRagSources] = useState([])
  const [notice, setNotice] = useState('')
  const [chatError, setChatError] = useState('')
  const [lastFailedText, setLastFailedText] = useState('')
  const messagesRef = useRef(null)
  const { sendRequest, abort } = useSSE()

  const lastMessage = messages[messages.length - 1]

  useEffect(() => {
    return () => abort()
  }, [abort])

  useEffect(() => {
    clearMessages()
  }, [clearMessages])

  useEffect(() => {
    const el = messagesRef.current
    if (!el)
      return

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    if (distanceFromBottom < 180)
      el.scrollTop = el.scrollHeight
  }, [messages.length, lastMessage?.content, lastMessage?.steps?.length])

  function clearChat() {
    Modal.confirm({
      title: '确定要清空所有对话记录吗？',
      content: '清空后当前对话无法恢复。',
      okText: '确定清空',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        clearMessages()
        setRagSources([])
        setNotice('')
        setChatError('')
      },
    })
  }

  async function sendMessage(msg) {
    const text = msg || inputMsg.trim()
    if (!text || isLoading)
      return

    setChatError('')
    setLastFailedText('')
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
        onNotice: msg => setNotice(msg),
        onComplete: (data) => {
          if (data?.sources?.length)
            setRagSources(data.sources)
        },
        onError: (err) => {
          setLastFailedText(text)
          setChatError(err.message || '请求失败，请检查网络后重试。')
        },
      })
    }
    catch {
      setLastFailedText(text)
      setChatError(prev => prev || '请求失败，请检查网络后重试。')
      updateLastMessage('抱歉，刚刚没有连接成功。你可以点击下方按钮重试。')
    }
    finally {
      setLoading(false)
      setCurrentAgentStep(0)
    }
  }

  return (
    <main className="chat-page" aria-labelledby="chat-title">
      <div className="chat-page__hero">
        <div className="chat-page__hero-deco" aria-hidden="true" />
        <div className="chat-page__hero-header">
          <div>
            <p className="chat-page__hero-label">AI ASSISTANT</p>
            <h1 id="chat-title" className="chat-page__hero-title">旅行顾问</h1>
            <p className="chat-page__hero-subtitle">有什么旅行问题，尽管问我</p>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearChat}
              className="chat-page__clear-btn"
              aria-label="清空对话记录"
            >
              <DeleteOutlined aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="chat-page__messages" ref={messagesRef} role="log" aria-live="polite" aria-relevant="additions text">
        {messages.map((msg, i) => {
          const isEmptyAssistant = msg.role === 'assistant' && !msg.content && isLoading && i === messages.length - 1
          return (
            <div key={msg._id}>
              {msg.role === 'assistant' && msg.steps && msg.steps.length > 0 && (
                <ChatAgentSteps steps={msg.steps} isLoading={false} />
              )}
              {msg.role === 'assistant' && notice && i === messages.length - 1 && !isLoading && (
                <div className="chat-page__notice" aria-live="polite">
                  <ExclamationCircleOutlined aria-hidden="true" />
                  <span>{notice}</span>
                </div>
              )}
              {!isEmptyAssistant && <ChatBubble role={msg.role} content={msg.content} />}
            </div>
          )
        })}

        {chatError && (
          <div className="chat-page__error" role="alert">
            <span>{chatError}</span>
            {lastFailedText && (
              <button type="button" onClick={() => sendMessage(lastFailedText)}>重试</button>
            )}
          </div>
        )}

        {ragSources.length > 0 && !isLoading && <RAGSource sources={ragSources} />}

        {isLoading && (
          <>
            {lastMessage?.steps && lastMessage.steps.length > 0 && (
              <ChatAgentSteps steps={lastMessage.steps} currentStep={currentAgentStep} isLoading />
            )}
            <div className="chat-page__typing" aria-live="polite" aria-label="AI 正在输入">
              <div className="chat-page__typing-avatar" aria-hidden="true">
                <RobotOutlined />
              </div>
              <div className="chat-page__typing-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </div>
          </>
        )}

        {messages.length === 0 && (
          <div className="chat-page__empty">
            <div className="chat-page__empty-card">
              <div className="chat-page__empty-icon" aria-hidden="true">
                <CompassOutlined />
              </div>
              <h2>你好，旅行者</h2>
              <p>告诉我你的目的地，我来帮你规划</p>
              <p className="chat-page__empty-hint">基于 RAG + Agent 技术，提供精准旅行建议</p>
            </div>
            <p className="chat-page__quick-title">试试这样问</p>
            <div className="chat-page__quick-list">
              {quickQuestions.map((q, i) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendMessage(q)}
                  className="chat-page__quick-btn"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <span className="chat-page__quick-num" aria-hidden="true">{i + 1}</span>
                  <span>{q}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="chat-page__input-bar">
        <div className="chat-page__input-inner">
          <label className="sr-only" htmlFor="chat-question-input">输入旅行问题</label>
          <input
            id="chat-question-input"
            type="text"
            name="travel-question"
            autoComplete="off"
            placeholder="输入你的问题..."
            value={inputMsg}
            onChange={e => setInputMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            disabled={isLoading}
            className="chat-page__input"
          />
          <button
            type="button"
            onClick={() => sendMessage()}
            disabled={isLoading || !inputMsg.trim()}
            className="chat-page__send-btn"
            aria-label="发送旅行问题"
          >
            <CompassOutlined aria-hidden="true" />
          </button>
        </div>
      </div>
    </main>
  )
}
