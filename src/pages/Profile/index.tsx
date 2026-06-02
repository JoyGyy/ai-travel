/**
 * 个人中心页面
 * 展示用户信息和应用功能入口，支持登录/退出
 */
import { Toast } from 'antd-mobile'
import { ClockCircleOutline, RightOutline } from 'antd-mobile-icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'

export default function Profile() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  function handleLogout() {
    if (!window.confirm('确定要退出登录吗？')) return
    logout()
    Toast.show({ content: '已退出登录', position: 'center' })
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'var(--c-paper)' }}>
      {/* Hero 区域 - 用户头像和昵称 */}
      <div
        className="relative px-6 pt-11 pb-12 text-center overflow-hidden md:pt-16 md:pb-16"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
      >
        {/* 装饰性圆形 */}
        <div className="absolute bottom-[-30px] left-[-20px] w-30 h-30 rounded-full" style={{ background: 'rgba(99, 102, 241, 0.06)', filter: 'blur(30px)' }} />
        <div className="relative z-10">
          {/* 用户头像 */}
          <div
            className="w-[88px] h-[88px] rounded-full mx-auto mb-3.5 border-[3px]"
            style={{
              borderColor: 'rgba(253, 246, 236, 0.25)',
              backgroundImage: 'url(https://img.yzcdn.cn/vant/cat.jpeg)',
              backgroundSize: 'cover',
              boxShadow: '0 0 0 4px rgba(253,246,236,0.2), 0 4px 16px rgba(0,0,0,0.15)',
            }}
          />
          <h2 className="mb-1.5 text-[22px] font-bold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-cream)', textShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            {user ? user.username : '游客'}
          </h2>
          <p className="text-[13px] font-light" style={{ color: 'rgba(253, 246, 236, 0.7)' }}>
            {user ? '欢迎回来' : '欢迎使用智能旅游助手'}
          </p>
        </div>
      </div>

      {/* 功能列表区域 */}
      <div className="px-4 -mt-5 relative z-10 md:px-8 md:max-w-2xl md:mx-auto">
        {/* 登录/退出卡片 */}
        {!user
          ? (
              <div
                className="rounded-[18px] mb-3 overflow-hidden"
                style={{ background: 'var(--c-white)', boxShadow: 'var(--shadow-md)' }}
              >
                <button
                  onClick={() => navigate('/login')}
                  className="w-full flex items-center justify-center px-[18px] py-4 border-none cursor-pointer transition-all active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, var(--c-terracotta) 0%, var(--c-terracotta-light) 100%)' }}
                >
                  <span className="text-sm font-semibold" style={{ color: '#fff' }}>登录 / 注册</span>
                </button>
              </div>
            )
          : (
              <div
                className="rounded-[18px] mb-3 overflow-hidden"
                style={{ background: 'var(--c-white)', boxShadow: 'var(--shadow-md)' }}
              >
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-[18px] py-4 border-none cursor-pointer transition-all active:scale-[0.98]"
                  style={{ background: 'var(--c-paper)' }}
                >
                  <span className="text-sm font-medium" style={{ color: 'var(--c-ink-light)' }}>退出登录</span>
                </button>
              </div>
            )}

        {/* 我的服务卡片 */}
        <div className="rounded-[18px] mb-3 overflow-hidden" style={{ background: 'var(--c-white)', boxShadow: 'var(--shadow-md)' }}>
          <div className="flex items-center gap-2 px-[18px] pt-4 pb-1 text-[13px] font-semibold" style={{ color: 'var(--c-ink-light)' }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--c-terracotta)' }} />
            <span>我的服务</span>
          </div>
          <div className="py-1">
            {/* 历史记录 */}
            <button onClick={() => navigate('/history')} className="w-full flex items-center justify-between px-[18px] py-3.5 border-none bg-transparent cursor-pointer text-left transition-colors duration-200 hover:bg-[var(--c-paper)]">
              <div className="flex items-center gap-3">
                <ClockCircleOutline style={{ fontSize: '18px', color: 'var(--c-terracotta)' }} />
                <span className="text-sm" style={{ color: 'var(--c-ink)' }}>历史记录</span>
              </div>
              <RightOutline style={{ fontSize: '14px', color: '#999' }} />
            </button>
          </div>
        </div>

        {/* 关于卡片 */}
        <div className="rounded-[18px] overflow-hidden" style={{ background: 'var(--c-white)', boxShadow: 'var(--shadow-md)' }}>
          <div className="flex items-center gap-2 px-[18px] pt-4 pb-1 text-[13px] font-semibold" style={{ color: 'var(--c-ink-light)' }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--c-terracotta)' }} />
            <span>关于</span>
          </div>
          <div className="py-1">
            {/* 关于我们 */}
            <button onClick={() => alert('智能旅游助手 v1.0.0\n基于 AI 技术的智能旅游规划平台，为您提供个性化的旅游行程推荐和实时旅游咨询服务')} className="w-full flex items-center justify-between px-[18px] py-3.5 border-none bg-transparent cursor-pointer text-left transition-colors duration-200 hover:bg-[var(--c-paper)]">
              <span className="text-sm" style={{ color: 'var(--c-ink)' }}>关于我们</span>
              <RightOutline style={{ fontSize: '14px', color: '#999' }} />
            </button>
            {/* 版本信息 */}
            <div className="flex items-center justify-between px-[18px] py-3.5">
              <span className="text-sm" style={{ color: 'var(--c-ink)' }}>版本信息</span>
              <span className="text-sm" style={{ color: 'var(--c-ink-light)' }}>v1.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
