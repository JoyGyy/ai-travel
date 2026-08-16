'use client'

import './style.css'

import { Send, Trash2 } from 'lucide-react'
import { type FormEvent, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useTravelChat } from '@/hooks/useTravelChat'

export default function ChatPage() {
  const [input, setInput] = useState('')
  const { error, messages, sendMessage, setMessages, status, stop } = useTravelChat()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = input.trim()
    if (!text || status !== 'ready') return
    sendMessage({ text })
    setInput('')
  }

  return (
    <section className="chat-page">
      {/* Hero 区域 */}
      <div className="chat-page__hero">
        <div className="chat-page__hero-deco" />
        <div className="chat-page__hero-header">
          <div>
            <p className="chat-page__hero-label">AI 旅行助手</p>
            <h1 className="chat-page__hero-title">AI 旅行规划师</h1>
            <p className="chat-page__hero-subtitle">
              告诉我目的地、天数、预算和偏好，我会帮你规划路线。
            </p>
          </div>
          <button
            className="chat-page__clear-btn"
            onClick={() => setMessages([])}
            title="清空对话"
            type="button"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="chat-page__messages">
        {messages.length === 0 && (
          <div className="chat-page__empty">
            <div className="chat-page__empty-card">
              <div className="chat-page__empty-icon">✈️</div>
              <h2>开始规划你的旅行</h2>
              <p>告诉我你想去哪里，我会为你制定详细的行程计划</p>
              <p className="chat-page__empty-hint">试试下方的快捷问题</p>
            </div>
            <p className="chat-page__quick-title">快捷问题</p>
            <div className="chat-page__quick-list">
              {[
                '帮我规划杭州3天2晚行程',
                '推荐上海周末游路线',
                '北京5天深度游攻略',
                '成都美食之旅怎么安排',
              ].map((question, index) => (
                <button
                  className="chat-page__quick-btn"
                  key={index}
                  onClick={() => sendMessage({ text: question })}
                  style={{ animationDelay: `${index * 0.08}s` }}
                  type="button"
                >
                  <span className="chat-page__quick-num">{index + 1}</span>
                  <span>{question}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div className="chat-page__typing" key={message.id}>
            {message.role === 'assistant' && (
              <div className="chat-page__typing-avatar">🤖</div>
            )}
            <div
              className={message.role === 'user' ? 'chat-page__error' : ''}
              style={{
                marginLeft: message.role === 'user' ? 'auto' : undefined,
                maxWidth: message.role === 'user' ? '70%' : undefined,
                background: message.role === 'user' ? 'var(--color-primary)' : undefined,
                color: message.role === 'user' ? '#fff' : undefined,
                border: message.role === 'user' ? 'none' : undefined,
              }}
            >
              {message.parts.map((part, index) => {
                if (part.type === 'text') {
                  return <p key={index}>{part.text}</p>
                }
                if (part.type.startsWith('tool-') || part.type === 'dynamic-tool') {
                  return (
                    <pre className="overflow-auto rounded-2xl bg-muted p-3 text-xs" key={index}>
                      {JSON.stringify(part, null, 2)}
                    </pre>
                  )
                }
                return null
              })}
            </div>
          </div>
        ))}

        {status === 'submitted' && (
          <div className="chat-page__typing">
            <div className="chat-page__typing-avatar">🤖</div>
            <div className="chat-page__typing-dots">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        {error && (
          <div className="chat-page__error">
            <span>{error.message}</span>
            <button onClick={() => sendMessage({ text: '请重试' })} type="button">
              重试
            </button>
          </div>
        )}
      </div>

      {/* 输入栏 */}
      <div className="chat-page__input-bar">
        <form className="chat-page__input-inner" onSubmit={handleSubmit}>
          <input
            className="chat-page__input"
            disabled={status !== 'ready'}
            onChange={(event) => setInput(event.target.value)}
            placeholder="例如：帮我规划杭州 3 天 2 晚，预算 3000 元"
            value={input}
          />
          <button
            className="chat-page__send-btn"
            disabled={!input.trim() || status !== 'ready'}
            title="发送"
            type="submit"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </section>
  )
}
