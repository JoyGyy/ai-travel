/**
 * 首页组件
 * 应用的主入口页面，提供行程规划表单和热门城市推荐
 */
import { Toast } from 'antd-mobile'
import { TagOutline } from 'antd-mobile-icons'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { allCities, hotCities } from '@/constants/cities'

export default function Home() {
  const navigate = useNavigate() // 路由导航函数
  const [city, setCity] = useState('') // 选中的城市
  const [budget, setBudget] = useState('') // 预算金额（字符串形式，便于输入处理）
  const [days, setDays] = useState(1) // 行程天数
  const [showDropdown, setShowDropdown] = useState(false) // 是否显示城市下拉列表

  /**
   * 根据输入关键词过滤城市列表
   * 使用 useMemo 缓存过滤结果，避免每次渲染都重新计算
   */
  const filteredCities = useMemo(() => {
    const keyword = city.trim()
    if (!keyword)
      return allCities // 无输入时显示所有城市
    return allCities.filter(c => c.includes(keyword)) // 模糊匹配城市名
  }, [city]) // 仅当 city 变化时重新计算

  /**
   * 选择城市
   * @param name - 城市名称
   */
  function selectCity(name: string) {
    setCity(name)
    setShowDropdown(false) // 选择后关闭下拉列表
  }

  /**
   * 开始规划
   * 验证表单数据后跳转到详情页
   */
  function onStart() {
    // 表单验证
    if (!city)
      return Toast.show('请选择目的地')
    if (!budget)
      return Toast.show('请输入预算')
    // 携带参数导航到详情页
    navigate(`/detail?city=${encodeURIComponent(city)}&budget=${budget}&days=${days}`)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--c-paper)' }}>
      {/* Hero 区域 - 全宽展示标题和副标题 */}
      <div
        className="relative overflow-hidden px-6 pb-14 pt-12 md:pb-20 md:pt-16"
        style={{ background: 'linear-gradient(160deg, var(--c-forest) 0%, #1b4332 40%, #2d6a4f 100%)' }}
      >
        {/* 装饰性圆形背景 */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full" style={{ background: 'rgba(212, 165, 116, 0.15)' }}>
          <div className="absolute -bottom-15 -left-20 w-30 h-30 rounded-full" style={{ background: 'rgba(212, 165, 116, 0.1)' }} />
        </div>
        <div className="relative z-10">
          <p className="mb-3 text-xs font-semibold tracking-[3px]" style={{ fontFamily: 'var(--font-sans)', color: 'var(--c-gold-light)' }}>
            AI-POWERED TRAVEL
          </p>
          <h1 className="mb-3 text-4xl font-bold leading-tight" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-cream)' }}>
            智能旅游
            <br />
            助手
          </h1>
          <p className="text-sm font-light tracking-wide" style={{ color: 'rgba(253, 246, 236, 0.7)' }}>
            让 AI 为你规划一段完美旅程
          </p>
        </div>
      </div>

      {/* 表单区域 - 限宽居中 */}
      <div className="px-4 -mt-7 relative z-10 md:max-w-xl md:mx-auto md:px-6" onClick={() => showDropdown && setShowDropdown(false)}>
        <div className="rounded-[20px] overflow-hidden" style={{ background: 'var(--c-white)', boxShadow: '0 4px 24px rgba(45, 42, 38, 0.08)' }}>
          {/* 表单标题 */}
          <div className="flex items-center gap-2 pt-[18px] px-5 text-[15px] font-semibold" style={{ color: 'var(--c-ink)' }}>
            <span className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: 'var(--c-sand)', color: 'var(--c-terracotta)', fontSize: '14px' }}>
              <TagOutline />
            </span>
            <span>规划你的旅行</span>
          </div>

          {/* 城市输入框 - 带搜索下拉功能 */}
          <div className="relative px-5 py-3" onClick={e => e.stopPropagation()}>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--c-ink-light)' }}>目的地</label>
            <input
              type="text"
              placeholder="输入搜索城市"
              value={city}
              onChange={(e) => { setCity(e.target.value); setShowDropdown(true) }}
              onFocus={() => setShowDropdown(true)}
              className="w-full py-2.5 px-0 text-sm border-0 outline-none"
              style={{ background: 'transparent', color: 'var(--c-ink)' }}
            />
            {/* 城市下拉列表 */}
            {showDropdown && (
              <div className="absolute left-0 right-0 z-10 max-h-60 overflow-y-auto border-t" style={{ background: 'var(--c-white)', borderColor: 'var(--c-paper-dark)', boxShadow: '0 8px 24px rgba(45, 42, 38, 0.12)' }}>
                {filteredCities.map(name => (
                  <div
                    key={name}
                    onClick={() => selectCity(name)}
                    className="px-5 py-3 text-sm cursor-pointer active:bg-[var(--c-sand)]"
                    style={{ color: city === name ? 'var(--c-terracotta)' : 'var(--c-ink)', fontWeight: city === name ? 600 : 400 }}
                  >
                    {name}
                  </div>
                ))}
                {/* 无匹配结果提示 */}
                {!filteredCities.length && (
                  <div className="px-5 py-5 text-center text-xs" style={{ color: 'var(--c-ink-light)' }}>未找到匹配城市</div>
                )}
              </div>
            )}
          </div>

          {/* 预算输入框 */}
          <div className="px-5 py-3 border-t" style={{ borderColor: 'var(--c-paper-dark)' }}>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--c-ink-light)' }}>预算(元)</label>
            <input
              type="number"
              placeholder="输入预算金额"
              value={budget}
              onChange={e => setBudget(e.target.value)}
              className="w-full py-2.5 px-0 text-sm border-0 outline-none"
              style={{ background: 'transparent', color: 'var(--c-ink)' }}
            />
          </div>

          {/* 天数选择器 */}
          <div className="px-5 py-3 border-t" style={{ borderColor: 'var(--c-paper-dark)' }}>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--c-ink-light)' }}>天数</label>
            <div className="flex items-center gap-3">
              {/* 减少天数按钮 */}
              <button
                onClick={() => setDays(Math.max(1, days - 1))}
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-medium border-none cursor-pointer"
                style={{ background: 'var(--c-paper)', color: 'var(--c-ink)' }}
              >
                -
              </button>
              {/* 天数显示 */}
              <span className="w-8 text-center text-base font-semibold" style={{ color: 'var(--c-ink)' }}>{days}</span>
              {/* 增加天数按钮 */}
              <button
                onClick={() => setDays(Math.min(30, days + 1))}
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-medium border-none cursor-pointer"
                style={{ background: 'var(--c-paper)', color: 'var(--c-ink)' }}
              >
                +
              </button>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="px-5 pb-5 pt-2">
            <button
              onClick={onStart}
              className="w-full h-[50px] rounded-full text-base font-semibold tracking-wider border-none cursor-pointer text-white"
              style={{ background: 'var(--c-terracotta)' }}
            >
              开始规划
            </button>
          </div>
        </div>
      </div>

      {/* 热门城市推荐区域 - 限宽居中 */}
      <div className="px-4 py-7 pb-8 md:max-w-xl md:mx-auto md:px-6 md:py-10">
        {/* 标题 - 带装饰线 */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 h-px" style={{ background: 'var(--c-paper-dark)' }} />
          <h3 className="whitespace-nowrap text-base font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-ink)' }}>热门目的地</h3>
          <div className="flex-1 h-px" style={{ background: 'var(--c-paper-dark)' }} />
        </div>
        {/* 热门城市标签列表 */}
        <div className="flex flex-wrap gap-2.5 md:gap-3.5">
          {hotCities.map(name => (
            <button
              key={name}
              onClick={() => selectCity(name)}
              className="px-4 py-2 rounded-full text-[13px] font-medium border cursor-pointer active:scale-[0.96] transition-all"
              style={{
                // 选中状态的样式
                background: city === name ? 'var(--c-terracotta)' : 'var(--c-white)',
                color: city === name ? '#fff' : 'var(--c-ink-light)',
                borderColor: city === name ? 'var(--c-terracotta)' : 'var(--c-paper-dark)',
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
