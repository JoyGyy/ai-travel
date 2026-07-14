import { ArrowLeftOutlined, CompassOutlined } from '@ant-design/icons'
/**
 * 登录注册页面
 */
import { message } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import './style.css'

const formCopy = {
  login: {
    eyebrow: 'WELCOME BACK',
    title: '欢迎回来',
    subtitle: '继续你的旅行灵感，登录后生成专属路线与预算计划。',
    passwordPlaceholder: '请输入密码…',
    submit: '登录账户',
    loading: '登录中…',
  },
  register: {
    eyebrow: 'START JOURNEY',
    title: '创建账号',
    subtitle: '注册新账号，保存你的目的地、天气灵感和 AI 行程方案。',
    passwordPlaceholder: '至少 6 位密码…',
    submit: '创建账号',
    loading: '创建中…',
  },
}

export default function Login() {
  const navigate = useNavigate()
  const { login, register } = useAuthStore()
  const [tab, setTab] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const currentCopy = formCopy[tab]

  function switchTab(t) {
    setTab(t)
    setUsername('')
    setPassword('')
    setFormError('')
  }

  function validateForm() {
    if (!username.trim())
      return '请输入用户名'
    if (!password)
      return '请输入密码'
    if (tab === 'register' && password.length < 6)
      return '密码长度至少 6 位'
    return ''
  }

  async function handleSubmit(event) {
    event?.preventDefault()
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
    catch (err) {
      setFormError(err.message || '操作失败，请检查信息后重试')
    }
    finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page" aria-labelledby="login-title">
      <section className="login-page__shell">
        <div className="login-page__backdrop login-page__backdrop--sand" aria-hidden="true" />
        <div className="login-page__backdrop login-page__backdrop--boat" aria-hidden="true">
          <img src="/images/home/hero-boat.jpg" alt="" />
        </div>
        <div className="login-page__wave" aria-hidden="true" />

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="login-page__back"
          aria-label="返回上一页"
        >
          <ArrowLeftOutlined aria-hidden="true" />
        </button>

        <div className="login-page__brand" aria-hidden="true">
          <span className="login-page__brand-mark"><CompassOutlined /></span>
          <span className="login-page__brand-text">Travel AI</span>
        </div>

        <div className="login-page__content">
          <section className="login-page__hero" aria-label="旅行登录介绍">
            <div className="login-page__categories" aria-label="旅行类型">
              <span>山野徒步</span>
              <span className="login-page__category-divider" aria-hidden="true" />
              <span>城市漫游</span>
              <span className="login-page__category-divider" aria-hidden="true" />
              <span>海岛假期</span>
            </div>

            <p className="login-page__label">AI TRAVEL PLANNER</p>
            <h1 id="login-title" className="login-page__title">登录后保存你的智能旅行地图</h1>
            <p className="login-page__subtitle">把目的地、天气灵感和预算计划沉淀下来，随时继续规划下一次出发。</p>

            <div className="login-page__tips" aria-label="登录后可使用的能力">
              <span>实时天气</span>
              <span>预算规划</span>
              <span>AI 咨询</span>
            </div>
          </section>

          <section className="login-page__form-panel" aria-label={tab === 'login' ? '登录表单' : '注册表单'}>
            <form className="login-page__form" onSubmit={handleSubmit} noValidate aria-busy={loading}>
              <div className="login-page__form-head">
                <p className="login-page__form-eyebrow">{currentCopy.eyebrow}</p>
                <h2 className="login-page__form-title">{currentCopy.title}</h2>
                <p className="login-page__form-subtitle">{currentCopy.subtitle}</p>
              </div>

              <div className="login-page__tabs" role="group" aria-label="选择登录或注册">
                {['login', 'register'].map(t => (
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

              <div className="login-page__field">
                <label htmlFor="login-username">用户名</label>
                <input
                  id="login-username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setFormError('') }}
                  placeholder="请输入用户名…"
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
                  onChange={(e) => { setPassword(e.target.value); setFormError('') }}
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
          </section>
        </div>
      </section>
    </main>
  )
}
