'use client';

/**
 * 登录 / 注册页面
 * 左右分栏布局：左侧品牌展示区，右侧登录/注册表单。
 * 通过 Zustand auth store 管理认证状态，支持登录和注册两种模式切换。
 */
import { ArrowLeft, Compass, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { sendCodeApi } from '@/api/auth';
import { ComplianceFooter } from '@/components/ComplianceFooter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppToast } from '@/hooks/useAppToast';
import { imageUrl } from '@/lib/images';
import { useAuthStore } from '@/stores/auth';

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
};

export default function Login() {
  /* ---------- 状态与 Store ---------- */

  const router = useRouter();
  const toast = useAppToast();
  const { login, register } = useAuthStore();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    code?: string;
    email?: string;
    password?: string;
    username?: string;
  }>({});
  const [touched, setTouched] = useState<{
    code?: boolean;
    email?: boolean;
    password?: boolean;
    username?: boolean;
  }>({});
  const usernameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const currentCopy = formCopy[tab];

  /* ---------- 验证码 60s 倒计时 ---------- */

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  /* ---------- 登录/注册模式切换 ---------- */

  function switchTab(t: 'login' | 'register') {
    setTab(t);
    setUsername('');
    setPassword('');
    setEmail('');
    setCode('');
    setFormError('');
    setFieldErrors({});
    setTouched({});
    setShowPassword(false);
  }

  /* ---------- 表单校验（返回字段级错误） ---------- */

  function validateForm(): {
    code?: string;
    email?: string;
    password?: string;
    username?: string;
  } {
    const errors: {
      code?: string;
      email?: string;
      password?: string;
      username?: string;
    } = {};
    if (!username.trim()) errors.username = '请输入用户名';
    if (!password) {
      errors.password = '请输入密码';
    } else if (tab === 'register') {
      if (password.length < 8) {
        errors.password = '密码长度至少 8 位';
      } else if (!/[a-z]/.test(password)) {
        errors.password = '密码需包含小写字母';
      } else if (!/[A-Z]/.test(password)) {
        errors.password = '密码需包含大写字母';
      } else if (!/\d/.test(password)) {
        errors.password = '密码需包含数字';
      }

      if (!email.trim()) {
        errors.email = '请输入电子邮箱';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errors.email = '邮箱格式不正确';
      }

      if (!code.trim()) {
        errors.code = '请输入验证码';
      } else if (!/^\d{6}$/.test(code.trim())) {
        errors.code = '验证码需为 6 位数字';
      }
    }
    return errors;
  }

  /* ---------- 单字段校验（onBlur 时调用） ---------- */

  function validateField(field: 'code' | 'email' | 'password' | 'username') {
    const errors = validateForm();
    setFieldErrors((prev) => ({ ...prev, [field]: errors[field] }));
  }

  /* ---------- 获取邮箱验证码 ---------- */

  async function handleSendCode() {
    if (sendingCode || countdown > 0) return;
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFieldErrors((prev) => ({ ...prev, email: '请输入电子邮箱' }));
      setTouched((prev) => ({ ...prev, email: true }));
      emailRef.current?.focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFieldErrors((prev) => ({ ...prev, email: '邮箱格式不正确' }));
      setTouched((prev) => ({ ...prev, email: true }));
      emailRef.current?.focus();
      return;
    }

    setSendingCode(true);
    setFormError('');
    try {
      await sendCodeApi(trimmedEmail, 'register');
      toast.success('验证码已发送至您的邮箱，请注意查收');
      setCountdown(60);
      codeRef.current?.focus();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : '发送验证码失败，请稍后重试';
      toast.error(msg);
      setFormError(msg);
    } finally {
      setSendingCode(false);
    }
  }

  /* ---------- 提交登录/注册请求 ---------- */

  async function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (loading) return;

    const errors = validateForm();
    if (errors.username || errors.email || errors.code || errors.password) {
      setFieldErrors(errors);
      setTouched({ code: true, email: true, password: true, username: true });
      setFormError('');
      if (errors.username) {
        usernameRef.current?.focus();
      } else if (errors.email) {
        emailRef.current?.focus();
      } else if (errors.code) {
        codeRef.current?.focus();
      } else if (errors.password) {
        passwordRef.current?.focus();
      }
      return;
    }

    setFieldErrors({});
    setTouched({});
    setFormError('');
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), password, email.trim(), code.trim());
      }
      toast.success(tab === 'login' ? '登录成功' : '注册成功');
      router.push('/');
    } catch (err: unknown) {
      setFieldErrors({});
      setFormError(
        err instanceof Error ? err.message : '操作失败，请检查信息后重试',
      );
    } finally {
      setLoading(false);
    }
  }

  /* ========== 渲染 ========== */

  return (
    <main className="flex min-h-screen flex-col bg-white md:flex-row">
      {/* 左侧品牌区 */}
      <section className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 text-white md:w-[48%] md:p-12">
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

        {/* 品牌标识 */}
        <div className="relative z-[2] flex items-center gap-3 animate-fade-in-up">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-lg text-white shadow-lg shadow-primary/20">
            <Compass />
          </span>
          <span className="text-lg font-bold tracking-wide text-white">
            Travel AI
          </span>
        </div>

        {/* 主标语 */}
        <div className="relative z-[2] flex flex-1 flex-col justify-center gap-6 py-8 md:max-w-[440px]">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#b8e0df] animate-fade-in-up">
            AI Travel Planner
          </p>
          <h1
            className="text-3xl font-bold leading-tight text-white md:text-[36px] animate-fade-in-up"
            style={{ animationDelay: '100ms' }}
          >
            登录后保存你的
            <br />
            <span className="text-[#b8e0df]">智能旅行地图</span>
          </h1>
          <p
            className="text-base leading-relaxed text-gray-400 animate-fade-in-up"
            style={{ animationDelay: '200ms' }}
          >
            把目的地、天气灵感和预算计划沉淀下来，随时继续规划下一次出发。
          </p>
          <div
            className="flex flex-wrap gap-3 pt-2 animate-fade-in-up"
            style={{ animationDelay: '300ms' }}
          >
            {['实时天气', '预算规划', 'AI 咨询'].map((feature) => (
              <Badge
                className="gap-2 border-white/10 bg-white/5 px-4 py-1.5 text-sm text-gray-300 backdrop-blur-sm"
                key={feature}
                variant="outline"
              >
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#b8e0df]" />
                {feature}
              </Badge>
            ))}
          </div>
        </div>

        <ComplianceFooter variant="overlay" />
      </section>

      {/* 右侧表单区 */}
      <section className="flex flex-1 items-center justify-center bg-travel-surface-muted p-8 md:p-12">
        <div className="w-full max-w-[420px]">
          <Button
            className="mb-8 gap-2 shadow-sm"
            onClick={() => router.back()}
            variant="outline"
          >
            <ArrowLeft size={16} />
            返回
          </Button>

          <div className="mb-8 animate-fade-in-up">
            <h2
              className="mb-3 text-2xl font-bold text-gray-900"
              id="login-title"
            >
              {currentCopy.title}
            </h2>
            <p className="text-sm leading-relaxed text-gray-500">
              {currentCopy.subtitle}
            </p>
          </div>

          <div className="mb-8 flex rounded-2xl bg-gray-100 p-1.5">
            {(['login', 'register'] as const).map((t) => (
              <button
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
            <div className="mb-6 rounded-2xl border border-red-200/60 bg-red-50/80 p-4 text-sm leading-relaxed text-red-600 backdrop-blur-sm animate-fade-in-up">
              {formError}
            </div>
          )}

          <form noValidate onSubmit={handleSubmit}>
            <div
              className="mb-6 animate-fade-in-up"
              style={{ animationDelay: '100ms' }}
            >
              <Label className="mb-2 text-gray-700" htmlFor="login-username">
                {tab === 'login' ? '用户名 / 邮箱' : '用户名'}
                <span className="ml-1 text-red-500">*</span>
              </Label>
              <Input
                autoComplete={tab === 'login' ? 'username email' : 'username'}
                className="h-12 mt-2 border-gray-200 hover:border-primary/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                id="login-username"
                name="username"
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, username: true }));
                  validateField('username');
                }}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (fieldErrors.username)
                    setFieldErrors((prev) => ({
                      ...prev,
                      username: undefined,
                    }));
                  if (formError) setFormError('');
                }}
                placeholder={tab === 'login' ? '请输入用户名或电子邮箱' : '请输入用户名'}
                ref={usernameRef}
                spellCheck={false}
                type="text"
                value={username}
              />
              {touched.username && fieldErrors.username && (
                <p className="mt-2 text-xs font-medium text-red-500">
                  {fieldErrors.username}
                </p>
              )}
            </div>

            {tab === 'register' && (
              <>
                {/* 电子邮箱 */}
                <div
                  className="mb-6 animate-fade-in-up"
                  style={{ animationDelay: '150ms' }}
                >
                  <Label
                    className="mb-2 text-gray-700"
                    htmlFor="register-email"
                  >
                    电子邮箱
                    <span className="ml-1 text-red-500">*</span>
                  </Label>
                  <Input
                    autoComplete="email"
                    className="h-12 mt-2 border-gray-200 hover:border-primary/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                    id="register-email"
                    name="email"
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, email: true }));
                      validateField('email');
                    }}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email)
                        setFieldErrors((prev) => ({
                          ...prev,
                          email: undefined,
                        }));
                      if (formError) setFormError('');
                    }}
                    placeholder="请输入常用邮箱（接收验证码）"
                    ref={emailRef}
                    type="email"
                    value={email}
                  />
                  {touched.email && fieldErrors.email && (
                    <p className="mt-2 text-xs font-medium text-red-500">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                {/* 验证码 */}
                <div
                  className="mb-6 animate-fade-in-up"
                  style={{ animationDelay: '180ms' }}
                >
                  <Label className="mb-2 text-gray-700" htmlFor="register-code">
                    邮箱验证码
                    <span className="ml-1 text-red-500">*</span>
                  </Label>
                  <div className="mt-2 flex gap-2">
                    <Input
                      autoComplete="one-time-code"
                      className="h-12 border-gray-200 hover:border-primary/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/15 font-mono tracking-widest text-base"
                      id="register-code"
                      maxLength={6}
                      name="code"
                      onBlur={() => {
                        setTouched((prev) => ({ ...prev, code: true }));
                        validateField('code');
                      }}
                      onChange={(e) => {
                        setCode(e.target.value);
                        if (fieldErrors.code)
                          setFieldErrors((prev) => ({
                            ...prev,
                            code: undefined,
                          }));
                        if (formError) setFormError('');
                      }}
                      placeholder="6 位数字验证码"
                      ref={codeRef}
                      type="text"
                      value={code}
                    />
                    <Button
                      className="h-12 shrink-0 px-4 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/5 disabled:opacity-50"
                      disabled={sendingCode || countdown > 0}
                      onClick={handleSendCode}
                      type="button"
                      variant="outline"
                    >
                      {sendingCode
                        ? '发送中…'
                        : countdown > 0
                          ? `${countdown}s 后重发`
                          : '获取验证码'}
                    </Button>
                  </div>
                  {touched.code && fieldErrors.code && (
                    <p className="mt-2 text-xs font-medium text-red-500">
                      {fieldErrors.code}
                    </p>
                  )}
                </div>
              </>
            )}

            <div
              className="mb-6 animate-fade-in-up"
              style={{ animationDelay: '200ms' }}
            >
              <Label className="mb-2 text-gray-700" htmlFor="login-password">
                密码
                <span className="ml-1 text-red-500">*</span>
              </Label>
              <div className="relative mt-2">
                <Input
                  autoComplete={
                    tab === 'register' ? 'new-password' : 'current-password'
                  }
                  className="h-12 pr-12 border-gray-200 hover:border-primary/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                  id="login-password"
                  name="password"
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, password: true }));
                    validateField('password');
                  }}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password)
                      setFieldErrors((prev) => ({
                        ...prev,
                        password: undefined,
                      }));
                    if (formError) setFormError('');
                  }}
                  placeholder={currentCopy.passwordPlaceholder}
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                />
                <Button
                  className="absolute top-1/2 right-1 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword((v) => !v)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </Button>
              </div>
              {touched.password && fieldErrors.password && (
                <p className="mt-2 text-xs font-medium text-red-500">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <Button
              className="h-12 w-full gap-2 bg-primary text-white shadow-lg shadow-primary/20 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25 disabled:hover:translate-y-0 animate-fade-in-up"
              disabled={loading}
              size="lg"
              style={{ animationDelay: '300ms' }}
              type="submit"
            >
              {loading && (
                <span className="h-4 w-4 animate-spin-slow rounded-full border-2 border-white/30 border-t-white" />
              )}
              {loading ? currentCopy.loading : currentCopy.submit}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
