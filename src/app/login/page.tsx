'use client'

/**
 * 登录 / 注册页面
 * 左右分栏布局：左侧品牌展示区，右侧登录/注册表单。
 * 通过 Zustand auth store 管理认证状态，支持登录和注册两种模式切换。
 */
import { ArrowLeft, Compass } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { ComplianceFooter } from '@/components/ComplianceFooter'
import { useAppToast } from '@/hooks/useAppToast'
import { imageUrl } from '@/lib/images'
import { useAuthStore } from '@/stores/auth'

/* ========== 表单文案配置 ========== */

const formCopy = {
  login: {
    loading: '登录中…',
    passwordPlaceholder: '请输入密码',
    submit: '登录账户',
    subtitle: '登录后继续你的旅行灵感，获取专属路线与预算计划。',
    title: '欢迎回来',
  },
  register: {
    loading: '创建中…',
    passwordPlaceholder: '至少 6 位密码',
    submit: '创建账号',
    subtitle: '注册新账号，保存你的目的地、天气灵感和 AI 行程方案。',
    title: '创建账号',
  },
}

export default function Login() {
  /* ---------- 状态与 Store ---------- */

  const router = useRouter()
  const toast = useAppToast()
  const { login, register } = useAuthStore()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const currentCopy = formCopy[tab]

  /* ---------- 登录/注册模式切换 ---------- */

  function switchTab(t: 'login' | 'register') {
    setTab(t)
    setUsername('')
    setPassword('')
    setFormError('')
  }

  /* ---------- 表单校验 ---------- */

  function validateForm() {
    if (!username.trim()) return '请输入用户名'
    if (!password) return '请输入密码'
    if (tab === 'register' && password.length < 6) return '密码长度至少 6 位'
    return ''
  }

  /* ---------- 提交登录/注册请求 ---------- */

  async function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault()
    if (loading) return

    const validationError = validateForm()
    if (validationError) {
      setFormError(validationError)
      return
    }

    setFormError('')
    setLoading(true)
    try {
      if (tab === 'login') {
        await login(username.trim(), password)
      } else {
        await register(username.trim(), password)
      }
      toast.success(tab === 'login' ? '登录成功' : '注册成功')
      router.push('/')
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : '操作失败，请检查信息后重试')
    } finally {
      setLoading(false)
    }
  }

  /* ========== 渲染 ========== */

  return (
    <main
      aria-labelledby="login-title"
      className="flex min-h-screen flex-col bg-white md:flex-row"
    >
      {/* 左侧品牌区 */}
      <section
        aria-label="品牌介绍"
        className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-travel-ink to-travel-ink-light p-8 text-white md:w-[48%] md:p-12"
      >
        {/* 背景图片 */}
        <div className="absolute inset-0 z-0">
          <Image
            alt=""
            fill
            src={imageUrl('/images/home/hero-boat.jpg')}
            className="object-cover opacity-16"
          />
        </div>
        {/* 渐变遮罩 */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-br from-travel-ink/92 to-travel-ink-light/80" />

        {/* 品牌标识 */}
        <div className="relative z-[2] flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-travel-orange text-lg text-white">
            <Compass />
          </span>
          <span className="text-lg font-semibold tracking-wide text-white">Travel AI</span>
        </div>

        {/* 主标语 */}
        <div className="relative z-[2] flex flex-1 flex-col justify-center gap-5 py-8 md:max-w-[440px]">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-travel-orange">
            AI Travel Planner
          </p>
          <h1 className="text-3xl font-bold leading-tight text-white md:text-[34px]">
            登录后保存你的智能旅行地图
          </h1>
          <p className="text-base leading-relaxed text-stone-400">
            把目的地、天气灵感和预算计划沉淀下来，随时继续规划下一次出发。
          </p>
          <div aria-label="核心功能" className="flex gap-6 pt-2">
            <span className="flex items-center gap-2 text-sm text-stone-300">
              <span aria-hidden="true" className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-travel-orange" />
              实时天气
            </span>
            <span className="flex items-center gap-2 text-sm text-stone-300">
              <span aria-hidden="true" className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-travel-orange" />
              预算规划
            </span>
            <span className="flex items-center gap-2 text-sm text-stone-300">
              <span aria-hidden="true" className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-travel-orange" />
              AI 咨询
            </span>
          </div>
        </div>

        <ComplianceFooter variant="overlay" />
      </section>

      {/* 右侧表单区 */}
      <section
        aria-label={tab === 'login' ? '登录表单' : '注册表单'}
        className="flex flex-1 items-center justify-center bg-travel-surface p-8 md:p-12"
      >
        <div className="w-full max-w-[400px]">
          <button
            aria-label="返回上一页"
            className="mb-8 inline-flex items-center gap-1.5 border-none bg-transparent p-0 text-sm text-travel-muted transition-colors hover:text-travel-ink"
            onClick={() => router.back()}
            type="button"
          >
            <ArrowLeft aria-hidden="true" />
            返回
          </button>

          <div className="mb-8">
            <h2 className="mb-2 text-2xl font-bold text-travel-ink" id="login-title">
              {currentCopy.title}
            </h2>
            <p className="text-sm leading-relaxed text-travel-muted">{currentCopy.subtitle}</p>
          </div>

          <div aria-label="选择登录或注册" className="mb-7 flex border-b border-travel-border-light" role="group">
            {(['login', 'register'] as const).map((t) => (
              <button
                aria-pressed={tab === t}
                className={`flex-1 border-b-2 px-0 py-2.5 text-sm font-medium transition-colors ${
                  tab === t
                    ? 'border-travel-orange text-travel-ink'
                    : 'border-transparent text-travel-muted hover:text-stone-600'
                }`}
                key={t}
                onClick={() => switchTab(t)}
                type="button"
              >
                {t === 'login' ? '登录' : '注册'}
              </button>
            ))}
          </div>

          {formError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm leading-relaxed text-red-700" role="alert">
              {formError}
            </div>
          )}

          <form aria-busy={loading} noValidate onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-medium text-stone-700" htmlFor="login-username">
                用户名
              </label>
              <input
                aria-invalid={Boolean(formError && !username.trim())}
                autoComplete="username"
                className="h-11 w-full rounded-md border border-travel-border bg-white px-3.5 text-sm text-travel-ink outline-none transition-[border-color,box-shadow] placeholder:text-stone-400 focus:border-travel-orange focus:ring-2 focus:ring-travel-orange/10 aria-[invalid=true]:border-red-500"
                id="login-username"
                name="username"
                onChange={(e) => {
                  setUsername(e.target.value)
                  setFormError('')
                }}
                placeholder="请输入用户名"
                spellCheck={false}
                type="text"
                value={username}
              />
            </div>

            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-medium text-stone-700" htmlFor="login-password">
                密码
              </label>
              <input
                aria-invalid={Boolean(
                  formError && (!password || (tab === 'register' && password.length < 6)),
                )}
                autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
                className="h-11 w-full rounded-md border border-travel-border bg-white px-3.5 text-sm text-travel-ink outline-none transition-[border-color,box-shadow] placeholder:text-stone-400 focus:border-travel-orange focus:ring-2 focus:ring-travel-orange/10 aria-[invalid=true]:border-red-500"
                id="login-password"
                name="password"
                onChange={(e) => {
                  setPassword(e.target.value)
                  setFormError('')
                }}
                placeholder={currentCopy.passwordPlaceholder}
                type="password"
                value={password}
              />
            </div>

            <button
              className="flex h-11 w-full items-center justify-center gap-2 rounded-md border-none bg-travel-orange text-sm font-semibold text-white transition-colors hover:bg-travel-orange-dark disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
              type="submit"
            >
              {loading && (
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin-slow rounded-full border-2 border-white/30 border-t-white"
                />
              )}
              {loading ? currentCopy.loading : currentCopy.submit}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
