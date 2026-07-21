/**
 * 登录 / 注册页面
 * 左右分栏布局：左侧品牌展示区，右侧登录/注册表单。
 * 通过 Zustand auth store 管理认证状态，支持登录和注册两种模式切换。
 */
import { ArrowLeftOutlined, CompassOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAppMessage } from '@/hooks/useAppMessage'
import { imageUrl } from '@/lib/images'
import { useAuthStore } from '@/stores/auth'

import './style.css'

/* ========== 表单文案配置 ========== */

const formCopy = {
  login: {
    title: '欢迎回来',
    subtitle: '登录后继续你的旅行灵感，获取专属路线与预算计划。',
    passwordPlaceholder: '请输入密码',
    submit: '登录账户',
    loading: '登录中…',
  },
  register: {
    title: '创建账号',
    subtitle: '注册新账号，保存你的目的地、天气灵感和 AI 行程方案。',
    passwordPlaceholder: '至少 6 位密码',
    submit: '创建账号',
    loading: '创建中…',
  },
}

export default function Login() {
  /* ---------- 状态与 Store ---------- */

  const navigate = useNavigate()
  const message = useAppMessage()
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
    if (!username.trim())
      return '请输入用户名'
    if (!password)
      return '请输入密码'
    if (tab === 'register' && password.length < 6)
      return '密码长度至少 6 位'
    return ''
  }

  /* ---------- 提交登录/注册请求 ---------- */

  async function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault()
    if (loading)
      return

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
      }
      else {
        await register(username.trim(), password)
      }
      message.success(tab === 'login' ? '登录成功' : '注册成功')
      navigate('/')
    }
    catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : '操作失败，请检查信息后重试')
    }
    finally {
      setLoading(false)
    }
  }

  /* ========== 渲染 ========== */

  return (
    <main className="login-page" aria-labelledby="login-title">
      {/* 左侧品牌区 */}
      <section className="login-page__hero-side" aria-label="品牌介绍">
        <div className="login-page__hero-bg" aria-hidden="true">
          <img src={imageUrl('/images/home/hero-boat.jpg')} alt="" />
        </div>
        <div className="login-page__hero-overlay" aria-hidden="true" />

        <div className="login-page__brand">
          <span className="login-page__brand-icon">
            <CompassOutlined />
          </span>
          <span className="login-page__brand-name">Travel AI</span>
        </div>

        <div className="login-page__hero-content">
          <p className="login-page__hero-eyebrow">AI Travel Planner</p>
          <h1 className="login-page__hero-title">登录后保存你的智能旅行地图</h1>
          <p className="login-page__hero-desc">
            把目的地、天气灵感和预算计划沉淀下来，随时继续规划下一次出发。
          </p>
          <div className="login-page__features" aria-label="核心功能">
            <span className="login-page__feature">
              <span className="login-page__feature-dot" aria-hidden="true" />
              实时天气
            </span>
            <span className="login-page__feature">
              <span className="login-page__feature-dot" aria-hidden="true" />
              预算规划
            </span>
            <span className="login-page__feature">
              <span className="login-page__feature-dot" aria-hidden="true" />
              AI 咨询
            </span>
          </div>
        </div>

        <p className="login-page__hero-footer">© 2026 Travel AI. All rights reserved.</p>
      </section>

      {/* 右侧表单区 */}
      <section className="login-page__form-side" aria-label={tab === 'login' ? '登录表单' : '注册表单'}>
        <div className="login-page__form-wrapper">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="login-page__back"
            aria-label="返回上一页"
          >
            <ArrowLeftOutlined aria-hidden="true" />
            返回
          </button>

          <div className="login-page__form-head">
            <h2 id="login-title" className="login-page__form-title">{currentCopy.title}</h2>
            <p className="login-page__form-subtitle">{currentCopy.subtitle}</p>
          </div>

          <div className="login-page__tabs" role="group" aria-label="选择登录或注册">
            {(['login', 'register'] as const).map(t => (
              <button
                key={t}
                type="button"
                aria-pressed={tab === t}
                onClick={() => switchTab(t)}
                className={`login-page__tab ${tab === t ? 'login-page__tab--active' : ''}`}
              >
                {t === 'login' ? '登录' : '注册'}
              </button>
            ))}
          </div>

          {formError && <div className="login-page__error" role="alert">{formError}</div>}

          <form className="login-page__form" onSubmit={handleSubmit} noValidate aria-busy={loading}>
            <div className="login-page__field">
              <label htmlFor="login-username">用户名</label>
              <input
                id="login-username"
                name="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  setFormError('')
                }}
                placeholder="请输入用户名"
                autoComplete="username"
                spellCheck={false}
                aria-invalid={Boolean(formError && !username.trim())}
              />
            </div>

            <div className="login-page__field">
              <label htmlFor="login-password">密码</label>
              <input
                id="login-password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setFormError('')
                }}
                placeholder={currentCopy.passwordPlaceholder}
                autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
                aria-invalid={Boolean(formError && (!password || (tab === 'register' && password.length < 6)))}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="login-page__submit"
            >
              {loading && <span className="login-page__submit-spinner" aria-hidden="true" />}
              {loading ? currentCopy.loading : currentCopy.submit}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
