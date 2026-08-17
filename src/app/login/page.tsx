'use client'

/**
 * 登录 / 注册页面
 * 左右分栏布局：左侧品牌展示区，右侧登录/注册表单。
 * 通过 Zustand auth store 管理认证状态，支持登录和注册两种模式切换。
 */
import { ArrowLeft, Compass, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { ComplianceFooter } from '@/components/ComplianceFooter'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    passwordPlaceholder: '至少 8 位，含大小写字母和数字',
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
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ password?: string, username?: string }>({})
  const [touched, setTouched] = useState<{ password?: boolean, username?: boolean }>({})
  const usernameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const currentCopy = formCopy[tab]

  /* ---------- focus 到第一个错误字段 ---------- */

  useEffect(() => {
    if (fieldErrors.username) {
      usernameRef.current?.focus()
    }
    else if (fieldErrors.password) {
      passwordRef.current?.focus()
    }
  }, [fieldErrors])

  /* ---------- 登录/注册模式切换 ---------- */

  function switchTab(t: 'login' | 'register') {
    setTab(t)
    setUsername('')
    setPassword('')
    setFormError('')
    setFieldErrors({})
    setTouched({})
    setShowPassword(false)
  }

  /* ---------- 表单校验（返回字段级错误） ---------- */

  function validateForm(): { password?: string, username?: string } {
    const errors: { password?: string, username?: string } = {}
    if (!username.trim())
      errors.username = '请输入用户名'
    if (!password) {
      errors.password = '请输入密码'
    }
    else if (tab === 'register') {
      if (password.length < 8) {
        errors.password = '密码长度至少 8 位'
      }
      else if (!/[a-z]/.test(password)) {
        errors.password = '密码需包含小写字母'
      }
      else if (!/[A-Z]/.test(password)) {
        errors.password = '密码需包含大写字母'
      }
      else if (!/\d/.test(password)) {
        errors.password = '密码需包含数字'
      }
    }
    return errors
  }

  /* ---------- 单字段校验（onBlur 时调用） ---------- */

  function validateField(field: 'password' | 'username') {
    const errors = validateForm()
    setFieldErrors(prev => ({ ...prev, [field]: errors[field] }))
  }

  /* ---------- 提交登录/注册请求 ---------- */

  async function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault()
    if (loading)
      return

    const errors = validateForm()
    if (errors.username || errors.password) {
      setFieldErrors(errors)
      setTouched({ password: true, username: true })
      setFormError('')
      return
    }

    setFieldErrors({})
    setTouched({})
    setFormError('')
    setLoading(true)
    try {
      if (tab === 'login') {
        await login(username.trim(), password)
      }
      else {
        await register(username.trim(), password)
      }
      toast.success(tab === 'login' ? '登录成功' : '注册成功')
      router.push('/')
    }
    catch (err: unknown) {
      setFieldErrors({})
      setFormError(err instanceof Error ? err.message : '操作失败，请检查信息后重试')
    }
    finally {
      setLoading(false)
    }
  }

  /* ========== 渲染 ========== */

  return (
    <main aria-labelledby="login-title" className="flex min-h-screen flex-col bg-white md:flex-row">
      {/* 左侧品牌区 */}
      <section
        aria-label="品牌介绍"
        className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 text-white md:w-[48%] md:p-12"
      >
        {/* 背景图片 */}
        <div className="absolute inset-0 z-0">
          <Image
            alt=""
            className="object-cover opacity-20"
            fill
            src={imageUrl('/images/home/hero-boat.jpg')}
          />
        </div>
        {/* 渐变遮罩 */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-br from-gray-900/95 via-gray-900/80 to-gray-800/90" />

        {/* 装饰元素 */}
        <div className="absolute -right-20 -top-20 z-[1] h-[400px] w-[400px] rounded-full bg-orange-500/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 z-[1] h-[300px] w-[300px] rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-3xl" />

        {/* 品牌标识 */}
        <div className="relative z-[2] flex items-center gap-3 animate-fade-in-up">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-lg text-white shadow-lg shadow-orange-500/20">
            <Compass />
          </span>
          <span className="text-lg font-bold tracking-wide text-white">Travel AI</span>
        </div>

        {/* 主标语 */}
        <div className="relative z-[2] flex flex-1 flex-col justify-center gap-6 py-8 md:max-w-[440px]">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-400 animate-fade-in-up">
            AI Travel Planner
          </p>
          <h1 className="text-3xl font-bold leading-tight text-white md:text-[36px] animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            登录后保存你的
            <br />
            <span className="text-orange-400">
              智能旅行地图
            </span>
          </h1>
          <p className="text-base leading-relaxed text-gray-400 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            把目的地、天气灵感和预算计划沉淀下来，随时继续规划下一次出发。
          </p>
          <div aria-label="核心功能" className="flex flex-wrap gap-3 pt-2 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            {['实时天气', '预算规划', 'AI 咨询'].map(feature => (
              <Badge
                className="gap-2 border-white/10 bg-white/5 px-4 py-1.5 text-sm text-gray-300 backdrop-blur-sm"
                key={feature}
                variant="outline"
              >
                <span
                  aria-hidden="true"
                  className="h-2 w-2 flex-shrink-0 rounded-full bg-orange-400"
                />
                {feature}
              </Badge>
            ))}
          </div>
        </div>

        <ComplianceFooter variant="overlay" />
      </section>

      {/* 右侧表单区 */}
      <section
        aria-label={tab === 'login' ? '登录表单' : '注册表单'}
        className="flex flex-1 items-center justify-center bg-gradient-to-br from-gray-50 to-white p-8 md:p-12"
      >
        <div className="w-full max-w-[420px]">
          <Button
            aria-label="返回上一页"
            className="mb-8 gap-2 shadow-sm"
            onClick={() => router.back()}
            variant="outline"
          >
            <ArrowLeft aria-hidden="true" size={16} />
            返回
          </Button>

          <div className="mb-8 animate-fade-in-up">
            <h2 className="mb-3 text-2xl font-bold text-gray-900" id="login-title">
              {currentCopy.title}
            </h2>
            <p className="text-sm leading-relaxed text-gray-500">{currentCopy.subtitle}</p>
          </div>

          <div
            aria-label="选择登录或注册"
            className="mb-8 flex rounded-2xl bg-gray-100 p-1.5"
            role="group"
          >
            {(['login', 'register'] as const).map(t => (
              <button
                aria-pressed={tab === t}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  tab === t
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
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
            <div
              className="mb-6 rounded-2xl border border-red-200/60 bg-red-50/80 p-4 text-sm leading-relaxed text-red-600 backdrop-blur-sm animate-fade-in-up"
              role="alert"
            >
              {formError}
            </div>
          )}

          <form aria-busy={loading} noValidate onSubmit={handleSubmit}>
            <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <Label className="mb-2 text-gray-700" htmlFor="login-username">
                用户名
                <span aria-hidden="true" className="ml-1 text-red-500">*</span>
              </Label>
              <Input
                aria-invalid={Boolean(fieldErrors.username)}
                autoComplete="username"
                className="h-12 mt-2 border-gray-200 hover:border-gray-300 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-100"
                id="login-username"
                name="username"
                onBlur={() => {
                  setTouched(prev => ({ ...prev, username: true }))
                  validateField('username')
                }}
                onChange={(e) => {
                  setUsername(e.target.value)
                  if (fieldErrors.username)
                    setFieldErrors(prev => ({ ...prev, username: undefined }))
                  if (formError)
                    setFormError('')
                }}
                placeholder="请输入用户名"
                ref={usernameRef}
                spellCheck={false}
                type="text"
                value={username}
              />
              {touched.username && fieldErrors.username && (
                <p aria-live="polite" className="mt-2 text-xs font-medium text-red-500">
                  {fieldErrors.username}
                </p>
              )}
            </div>

            <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <Label className="mb-2 text-gray-700" htmlFor="login-password">
                密码
                <span aria-hidden="true" className="ml-1 text-red-500">*</span>
              </Label>
              <div className="relative mt-2">
                <Input
                  aria-invalid={Boolean(fieldErrors.password)}
                  autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
                  className="h-12 pr-12 border-gray-200 hover:border-gray-300 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-100"
                  id="login-password"
                  name="password"
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, password: true }))
                    validateField('password')
                  }}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (fieldErrors.password)
                      setFieldErrors(prev => ({ ...prev, password: undefined }))
                    if (formError)
                      setFormError('')
                  }}
                  placeholder={currentCopy.passwordPlaceholder}
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                />
                <Button
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                  className="absolute top-1/2 right-1 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(v => !v)}
                  size="icon"
                  tabIndex={-1}
                  type="button"
                  variant="ghost"
                >
                  {showPassword
                    ? (
                        <EyeOff aria-hidden="true" size={18} />
                      )
                    : (
                        <Eye aria-hidden="true" size={18} />
                      )}
                </Button>
              </div>
              {touched.password && fieldErrors.password && (
                <p aria-live="polite" className="mt-2 text-xs font-medium text-red-500">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <Button
              className="h-12 w-full gap-2 bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/25 disabled:hover:translate-y-0 animate-fade-in-up"
              disabled={loading}
              size="lg"
              style={{ animationDelay: '300ms' }}
              type="submit"
            >
              {loading && (
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin-slow rounded-full border-2 border-white/30 border-t-white"
                />
              )}
              {loading ? currentCopy.loading : currentCopy.submit}
            </Button>
          </form>
        </div>
      </section>
    </main>
  )
}
