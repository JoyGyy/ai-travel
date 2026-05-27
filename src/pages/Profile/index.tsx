/**
 * 个人中心页面
 * 展示用户信息和应用功能入口
 */
import { Dialog, Toast } from 'antd-mobile'
import { ClockCircleOutline, RightOutline, SetOutline, StarOutline } from 'antd-mobile-icons'
import { useNavigate } from 'react-router-dom'
import { loadCollections } from '@/utils/storage'

export default function Profile() {
  const navigate = useNavigate()

  /**
   * 显示收藏列表
   * 从 localStorage 加载收藏数据并弹窗展示
   */
  function showCollections() {
    const items = loadCollections()
    if (!items.length) {
      Toast.show('暂无收藏')
      return
    }
    // 将收藏列表格式化为字符串并显示
    Dialog.alert({
      content: items.map((item, i) => `${i + 1}. ${item.city || '行程'} — ${item.date || ''}`).join('\n'),
    })
  }

  /**
   * 显示关于我们信息
   */
  function showAbout() {
    Dialog.alert({
      title: '关于我们',
      content: '智能旅游助手 v1.0.0 — 基于 AI 技术的智能旅游规划平台，为您提供个性化的旅游行程推荐和实时旅游咨询服务',
    })
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'var(--c-paper)' }}>
      {/* Hero 区域 - 用户头像和昵称 */}
      <div
        className="relative px-6 pt-11 pb-12 text-center overflow-hidden md:pt-16 md:pb-16"
        style={{ background: 'linear-gradient(160deg, var(--c-forest) 0%, #2d6a4f 100%)' }}
      >
        {/* 装饰性圆形 */}
        <div className="absolute bottom-[-30px] left-[-20px] w-30 h-30 rounded-full" style={{ background: 'rgba(212, 165, 116, 0.1)' }} />
        <div className="relative z-10">
          {/* 用户头像 */}
          <div
            className="w-[76px] h-[76px] rounded-full mx-auto mb-3.5 border-[3px]"
            style={{
              borderColor: 'rgba(253, 246, 236, 0.25)',
              backgroundImage: 'url(https://img.yzcdn.cn/vant/cat.jpeg)',
              backgroundSize: 'cover',
            }}
          />
          <h2 className="mb-1.5 text-[22px] font-bold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-cream)' }}>游客</h2>
          <p className="text-[13px] font-light" style={{ color: 'rgba(253, 246, 236, 0.7)' }}>欢迎使用智能旅游助手</p>
        </div>
      </div>

      {/* 功能列表区域 */}
      <div className="px-4 -mt-5 relative z-10 md:px-8 md:max-w-2xl md:mx-auto">
        {/* 我的服务卡片 */}
        <div className="rounded-[18px] mb-3 overflow-hidden" style={{ background: 'var(--c-white)', boxShadow: '0 2px 12px rgba(45, 42, 38, 0.05)' }}>
          <div className="flex items-center gap-2 px-[18px] pt-4 pb-1 text-[13px] font-semibold" style={{ color: 'var(--c-ink-light)' }}>
            <div className="w-[5px] h-[5px] rounded-full" style={{ background: 'var(--c-terracotta)' }} />
            <span>我的服务</span>
          </div>
          <div className="py-1">
            {/* 我的收藏 */}
            <button onClick={showCollections} className="w-full flex items-center justify-between px-[18px] py-3.5 border-none bg-transparent cursor-pointer text-left">
              <div className="flex items-center gap-3">
                <StarOutline style={{ fontSize: '18px', color: 'var(--c-terracotta)' }} />
                <span className="text-sm" style={{ color: 'var(--c-ink)' }}>我的收藏</span>
              </div>
              <RightOutline style={{ fontSize: '14px', color: '#999' }} />
            </button>
            {/* 历史记录 */}
            <button onClick={() => navigate('/history')} className="w-full flex items-center justify-between px-[18px] py-3.5 border-none bg-transparent cursor-pointer text-left">
              <div className="flex items-center gap-3">
                <ClockCircleOutline style={{ fontSize: '18px', color: 'var(--c-terracotta)' }} />
                <span className="text-sm" style={{ color: 'var(--c-ink)' }}>历史记录</span>
              </div>
              <RightOutline style={{ fontSize: '14px', color: '#999' }} />
            </button>
            {/* 设置 */}
            <button onClick={() => Toast.show('功能开发中')} className="w-full flex items-center justify-between px-[18px] py-3.5 border-none bg-transparent cursor-pointer text-left">
              <div className="flex items-center gap-3">
                <SetOutline style={{ fontSize: '18px', color: 'var(--c-terracotta)' }} />
                <span className="text-sm" style={{ color: 'var(--c-ink)' }}>设置</span>
              </div>
              <RightOutline style={{ fontSize: '14px', color: '#999' }} />
            </button>
          </div>
        </div>

        {/* 关于卡片 */}
        <div className="rounded-[18px] overflow-hidden" style={{ background: 'var(--c-white)', boxShadow: '0 2px 12px rgba(45, 42, 38, 0.05)' }}>
          <div className="flex items-center gap-2 px-[18px] pt-4 pb-1 text-[13px] font-semibold" style={{ color: 'var(--c-ink-light)' }}>
            <div className="w-[5px] h-[5px] rounded-full" style={{ background: 'var(--c-terracotta)' }} />
            <span>关于</span>
          </div>
          <div className="py-1">
            {/* 关于我们 */}
            <button onClick={showAbout} className="w-full flex items-center justify-between px-[18px] py-3.5 border-none bg-transparent cursor-pointer text-left">
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
