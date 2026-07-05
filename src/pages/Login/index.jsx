/**
 * 登录注册页面
 */
import { message } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import './style.css'

export default function Login() {
  const navigate = useNavigate()
  const { login, register } = useAuthStore()
  const [tab, setTab] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  function switchTab(t) {
    setTab(t)
    setUsername('')
    setPassword('')
  }

  async function handleSubmit() {
    if (!username.trim()) return message.warning('请输入用户名')
    if (!password) return message.warning('请输入密码')
    if (tab === 'register' && password.length < 6) return message.warning('密码长度至少 6 位')

    setLoading(true)
    try {
      if (tab === 'login') {
        await login(username.trim(), password)
      } else {
        await register(username.trim(), password)
      }
      message.success(tab === 'login' ? '登录成功' : '注册成功')
      navigate('/')
    } catch (err) {
      message.error(err.message || '操作失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-page__hero">
        <div className="login-page__deco" />
        <button onClick={() => navigate(-1)} className="login-page__back">
          <ArrowLeftOutlined />
        </button>
        <p className="login-page__label">ACCOUNT</p>
        <h1 className="login-page__title">{tab === 'login' ? '欢迎回来' : '创建账号'}</h1>
        <p className="login-page__subtitle">{tab === 'login' ? '登录你的旅行助手账号' : '注册新账号开始旅行规划'}</p>
      </div>

      <div className="login-page__form-wrapper">
        <div className="login-page__form">
          <div className="login-page__tabs">
            {['login', 'register'].map(t => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={`login-page__tab ${tab === t ? 'login-page__tab--active' : ''}`}
              >
                {t === 'login' ? '登录' : '注册'}
              </button>
            ))}
          </div>

          <div className="login-page__field">
            <label>用户名</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="请输入用户名"
              autoComplete="username"
            />
          </div>

          <div className="login-page__field">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={tab === 'register' ? '至少 6 位' : '请输入密码'}
              autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="login-page__submit"
          >
            {loading ? '处理中...' : tab === 'login' ? '登录' : '注册'}
          </button>
        </div>
      </div>
    </div>
  )
}
