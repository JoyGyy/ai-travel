/**
 * 登录注册页面
 * 支持登录/注册切换，表单验证，错误提示
 */
import { LeftOutline } from 'antd-mobile-icons'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'

type TabType = 'login' | 'register'

export default function Login() {
  const navigate = useNavigate()
  const { login, register } = useAuthStore()
  const [tab, setTab] = useState<TabType>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  function switchTab(t: TabType) {
    setTab(t)
    setUsername('')
    setPassword('')
  }

  async function handleSubmit() {
    if (!username.trim())
      return alert('请输入用户名')
    if (!password)
      return alert('请输入密码')
    if (tab === 'register' && password.length < 6)
      return alert('密码长度至少 6 位')

    setLoading(true)
    try {
      if (tab === 'login') {
        await login(username.trim(), password)
      }
      else {
        await register(username.trim(), password)
      }
      alert(tab === 'login' ? '登录成功' : '注册成功')
      navigate('/profile')
    }
    catch (err) {
      alert((err as Error).message || '操作失败，请重试')
    }
    finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'var(--c-paper)' }}>
      {/* 头部 */}
      <div
        className="relative px-6 pt-5 pb-10 md:pt-8 md:pb-14"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
      >
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full" style={{ background: 'rgba(99, 102, 241, 0.06)', filter: 'blur(30px)' }} />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-3.5 left-4 w-9 h-9 rounded-xl flex items-center justify-center border-none cursor-pointer transition-all active:scale-90"
          style={{ background: 'rgba(255, 252, 248, 0.12)' }}
        >
          <LeftOutline style={{ color: 'var(--c-cream)', fontSize: '17px' }} />
        </button>
        <p className="mt-2 mb-2 text-[10px] font-semibold tracking-[5px]" style={{ color: 'var(--c-gold-light)', opacity: 0.75 }}>ACCOUNT</p>
        <h1 className="mb-2 text-[28px] font-bold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-cream)', textShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          {tab === 'login' ? '欢迎回来' : '创建账号'}
        </h1>
        <p className="text-[12px] font-light" style={{ color: 'rgba(253, 246, 236, 0.5)' }}>
          {tab === 'login' ? '登录你的旅行助手账号' : '注册新账号开始旅行规划'}
        </p>
      </div>

      <div className="px-4 -mt-5 relative z-10 md:px-8 md:max-w-md md:mx-auto">
        {/* 表单卡片 */}
        <div
          className="rounded-2xl overflow-hidden p-5"
          style={{ background: 'var(--c-white)', boxShadow: 'var(--shadow-lg)', border: '1px solid rgba(240, 232, 221, 0.3)' }}
        >
          {/* 登录/注册切换 */}
          <div className="flex mb-5 p-1 rounded-xl" style={{ background: 'var(--c-paper)' }}>
            {(['login', 'register'] as const).map(t => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className="flex-1 h-9 rounded-lg text-[13px] font-medium border-none cursor-pointer transition-all"
                style={{
                  background: tab === t ? 'var(--c-white)' : 'transparent',
                  color: tab === t ? 'var(--c-terracotta)' : 'var(--c-ink-light)',
                  boxShadow: tab === t ? 'var(--shadow-xs)' : 'none',
                }}
              >
                {t === 'login' ? '登录' : '注册'}
              </button>
            ))}
          </div>

          {/* 用户名 */}
          <div className="mb-4">
            <label className="block mb-1.5 text-[12px] font-medium" style={{ color: 'var(--c-ink-light)' }}>用户名</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="请输入用户名"
              autoComplete="username"
              className="w-full h-11 px-4 rounded-xl text-sm border outline-none transition-all"
              style={{
                background: 'var(--c-paper)',
                color: 'var(--c-ink)',
                borderColor: 'rgba(240, 232, 221, 0.6)',
              }}
            />
          </div>

          {/* 密码 */}
          <div className="mb-5">
            <label className="block mb-1.5 text-[12px] font-medium" style={{ color: 'var(--c-ink-light)' }}>密码</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={tab === 'register' ? '至少 6 位' : '请输入密码'}
              autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full h-11 px-4 rounded-xl text-sm border outline-none transition-all"
              style={{
                background: 'var(--c-paper)',
                color: 'var(--c-ink)',
                borderColor: 'rgba(240, 232, 221, 0.6)',
              }}
            />
          </div>

          {/* 提交按钮 */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-11 rounded-xl text-[14px] font-semibold border-none cursor-pointer transition-all active:scale-[0.98]"
            style={{
              background: loading ? 'var(--c-paper-dark)' : 'linear-gradient(135deg, var(--c-terracotta) 0%, var(--c-terracotta-light) 100%)',
              color: loading ? 'var(--c-ink-light)' : '#fff',
              boxShadow: loading ? 'none' : '0 2px 8px rgba(99, 102, 241, 0.2)',
            }}
          >
            {loading ? '处理中...' : tab === 'login' ? '登录' : '注册'}
          </button>
        </div>
      </div>
    </div>
  )
}
