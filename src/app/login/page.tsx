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

import './style.css'

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
    <main aria-labelledby="login-title" className="login-page">
      {/* 左侧品牌区 */}
      <section aria-label="品牌介绍" className="login-page__hero-side">
        <div aria-hidden="true" className="login-page__hero-bg">
          <Image
            alt=""
            fill
            src={imageUrl('/images/home/hero-boat.jpg')}
            style={{ objectFit: 'cover' }}
          />
        </div>
        <div aria-hidden="true" className="login-page__hero-overlay" />

        <div className="login-page__brand">
          <span className="login-page__brand-icon">
            <Compass />
          </span>
          <span className="login-page__brand-name">Travel AI</span>
        </div>

        <div className="login-page__hero-content">
          <p className="login-page__hero-eyebrow">AI Travel Planner</p>
          <h1 className="login-page__hero-title">登录后保存你的智能旅行地图</h1>
          <p className="login-page__hero-desc">
            把目的地、天气灵感和预算计划沉淀下来，随时继续规划下一次出发。
          </p>
          <div aria-label="核心功能" className="login-page__features">
            <span className="login-page__feature">
              <span aria-hidden="true" className="login-page__feature-dot" />
              实时天气
            </span>
            <span className="login-page__feature">
              <span aria-hidden="true" className="login-page__feature-dot" />
              预算规划
            </span>
            <span className="login-page__feature">
              <span aria-hidden="true" className="login-page__feature-dot" />
              AI 咨询
            </span>
          </div>
        </div>

        <ComplianceFooter variant="overlay" />
      </section>

      {/* 右侧表单区 */}
      <section
        aria-label={tab === 'login' ? '登录表单' : '注册表单'}
        className="login-page__form-side"
      >
        <div className="login-page__form-wrapper">
          <button
            aria-label="返回上一页"
            className="login-page__back"
            onClick={() => router.back()}
            type="button"
          >
            <ArrowLeft aria-hidden="true" />
            返回
          </button>

          <div className="login-page__form-head">
            <h2 className="login-page__form-title" id="login-title">
              {currentCopy.title}
            </h2>
            <p className="login-page__form-subtitle">{currentCopy.subtitle}</p>
          </div>

          <div aria-label="选择登录或注册" className="login-page__tabs" role="group">
            {(['login', 'register'] as const).map((t) => (
              <button
                aria-pressed={tab === t}
                className={`login-page__tab ${tab === t ? 'login-page__tab--active' : ''}`}
                key={t}
                onClick={() => switchTab(t)}
                type="button"
              >
                {t === 'login' ? '登录' : '注册'}
              </button>
            ))}
          </div>

          {formError && (
            <div className="login-page__error" role="alert">
              {formError}
            </div>
          )}

          <form aria-busy={loading} className="login-page__form" noValidate onSubmit={handleSubmit}>
            <div className="login-page__field">
              <label htmlFor="login-username">用户名</label>
              <input
                aria-invalid={Boolean(formError && !username.trim())}
                autoComplete="username"
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

            <div className="login-page__field">
              <label htmlFor="login-password">密码</label>
              <input
                aria-invalid={Boolean(
                  formError && (!password || (tab === 'register' && password.length < 6)),
                )}
                autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
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

            <button className="login-page__submit" disabled={loading} type="submit">
              {loading && <span aria-hidden="true" className="login-page__submit-spinner" />}
              {loading ? currentCopy.loading : currentCopy.submit}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
