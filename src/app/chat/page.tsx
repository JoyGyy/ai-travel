'use client'

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
    <section className="mx-auto flex min-h-[calc(100vh-72px)] max-w-5xl flex-col px-4 py-8">
      <div className="mb-6 rounded-3xl bg-[var(--travel-hero-gradient)] p-6 shadow-[var(--travel-shadow-card)]">
        <h1 className="text-3xl font-extrabold text-foreground">AI 旅行规划师</h1>
        <p className="mt-2 text-muted-foreground">
          告诉我目的地、天数、预算和偏好，我会帮你规划路线。
        </p>
      </div>

      <div className="flex-1 space-y-4">
        {messages.map((message) => (
          <div className={message.role === 'user' ? 'text-right' : 'text-left'} key={message.id}>
            {message.parts.map((part, index) => {
              if (part.type === 'text') {
                return (
                  <p
                    className="inline-block rounded-3xl bg-card px-4 py-3 shadow-[var(--shadow-paper)]"
                    key={index}
                  >
                    {part.text}
                  </p>
                )
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
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error.message}</p>}

      <form
        className="mt-6 flex gap-3 rounded-3xl border bg-card p-3 shadow-[var(--travel-shadow-floating)]"
        onSubmit={handleSubmit}
      >
        <Textarea
          onChange={(event) => setInput(event.target.value)}
          placeholder="例如：帮我规划杭州 3 天 2 晚，预算 3000 元"
          value={input}
        />
        <Button disabled={!input.trim() || status !== 'ready'} type="submit">
          <Send className="mr-2 h-4 w-4" />
          发送
        </Button>
        {status !== 'ready' && (
          <Button onClick={stop} type="button" variant="outline">
            停止
          </Button>
        )}
        <Button onClick={() => setMessages([])} type="button" variant="ghost">
          <Trash2 className="h-4 w-4" />
        </Button>
      </form>
    </section>
  )
}
