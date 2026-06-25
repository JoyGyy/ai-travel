/**
 * 天气查询页面
 * 提供城市搜索和实时天气展示
 */
import { useMemo, useState } from 'react'
import { HomeWeather } from '@/components/HomeWeather'
import { allCities, hotCities } from '@/constants/cities'
import { useWeather } from '@/hooks/useWeather'

export default function Weather() {
  const [city, setCity] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const { weather, loading, error, fetchWeather } = useWeather()

  // loading 通过 HomeWeather 组件展示

  const filteredCities = useMemo(() => {
    const keyword = city.trim()
    if (!keyword)
      return allCities
    return allCities.filter(c => c.includes(keyword))
  }, [city])

  function selectCity(name: string) {
    setCity(name)
    setShowDropdown(false)
    fetchWeather(name)
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'var(--c-paper)' }}>
      {/* 顶部标题 */}
      <div
        className="relative px-6 pt-5 pb-8 md:pt-8 md:pb-12"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
      >
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full" style={{ background: 'rgba(99, 102, 241, 0.06)', filter: 'blur(30px)' }} />
        <p className="mb-2 text-[10px] font-semibold tracking-[5px]" style={{ color: 'var(--c-gold-light)', opacity: 0.75 }}>WEATHER</p>
        <h1 className="text-[28px] font-bold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-cream)', textShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          天气查询
        </h1>
        <p className="text-[12px] font-light mt-1" style={{ color: 'rgba(253, 246, 236, 0.5)' }}>
          查看目的地实时天气，合理安排行程
        </p>
      </div>

      <div className="md:max-w-3xl md:mx-auto">
        {/* 搜索框 */}
        <div
          className="relative mx-4 -mt-5 px-5 py-4 rounded-2xl z-10"
          style={{ background: 'var(--c-white)', boxShadow: 'var(--shadow-lg)', border: '1px solid rgba(240, 232, 221, 0.3)' }}
          onClick={() => showDropdown && setShowDropdown(false)}
        >
          <div
            className="flex items-center gap-2.5 border-b pb-3 mb-0"
            style={{ borderColor: 'rgba(240, 232, 221, 0.6)' }}
            onClick={e => e.stopPropagation()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--c-ink-light)', opacity: 0.6, flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="输入城市名称查询天气"
              value={city}
              onChange={(e) => {
                setCity(e.target.value)
                setShowDropdown(true)
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full py-1 px-0 text-sm border-0 outline-none"
              style={{ background: 'transparent', color: 'var(--c-ink)' }}
            />
          </div>
          {showDropdown && (
            <div
              className="max-h-60 overflow-y-auto"
            >
              {filteredCities.map(name => (
                <div
                  key={name}
                  onClick={() => selectCity(name)}
                  className="px-1 py-3 text-sm cursor-pointer transition-colors border-b last:border-b-0"
                  style={{
                    color: city === name ? 'var(--c-terracotta)' : 'var(--c-ink)',
                    fontWeight: city === name ? 600 : 400,
                    borderColor: 'rgba(240, 232, 221, 0.3)',
                  }}
                >
                  {name}
                </div>
              ))}
              {!filteredCities.length && (
                <div className="px-1 py-6 text-center text-xs" style={{ color: 'var(--c-ink-light)' }}>未找到匹配城市</div>
              )}
            </div>
          )}
        </div>

        {/* 天气结果 */}
        {weather && (
          <div className="px-4 pt-4">
            <HomeWeather weather={weather} loading={loading} />
          </div>
        )}

        {error && (
          <div className="px-4 pt-4">
            <div
              className="rounded-2xl px-5 py-4 text-center text-[13px]"
              style={{ background: 'var(--c-white)', color: 'var(--c-ink-light)', boxShadow: 'var(--shadow-sm)' }}
            >
              {error}
            </div>
          </div>
        )}

        {/* 热门城市快捷选择 */}
        <div className="px-4 pt-6 pb-8 md:px-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--c-paper-dark), transparent)' }} />
            <h3 className="whitespace-nowrap text-[13px] font-semibold tracking-wider" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-ink-light)' }}>
              热门城市
            </h3>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--c-paper-dark), transparent)' }} />
          </div>
          <div className="flex flex-wrap gap-2 md:gap-3">
            {hotCities.map(name => (
              <button
                key={name}
                onClick={() => selectCity(name)}
                className="px-4 py-2 rounded-xl text-[13px] font-medium border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.96]"
                style={{
                  background: city === name ? 'var(--c-terracotta)' : 'var(--c-white)',
                  color: city === name ? '#fff' : 'var(--c-ink-light)',
                  borderColor: city === name ? 'var(--c-terracotta)' : 'rgba(240, 232, 221, 0.6)',
                  boxShadow: city === name ? '0 2px 8px rgba(99, 102, 241, 0.2)' : 'var(--shadow-xs)',
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
