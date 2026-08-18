/**
 * 天气页面静态数据
 */

/** 多城速览数据 */
export const QUICK_CITIES = [
  { emoji: '🏖️', gradient: 'from-sky-400 to-blue-500', name: '三亚', temp: '28°C', weather: '晴' },
  { emoji: '🏔️', gradient: 'from-emerald-400 to-teal-500', name: '丽江', temp: '18°C', weather: '多云' },
  { emoji: '🏯', gradient: 'from-cyan-400 to-teal-500', name: '西安', temp: '22°C', weather: '晴' },
  { emoji: '🐼', gradient: 'from-lime-400 to-green-500', name: '成都', temp: '24°C', weather: '阴' },
  { emoji: '🌊', gradient: 'from-cyan-400 to-blue-500', name: '大理', temp: '20°C', weather: '晴' },
  { emoji: '🎵', gradient: 'from-teal-400 to-emerald-500', name: '厦门', temp: '26°C', weather: '多云' },
  { emoji: '🌸', gradient: 'from-fuchsia-400 to-purple-500', name: '杭州', temp: '25°C', weather: '小雨' },
  { emoji: '🏙️', gradient: 'from-slate-400 to-gray-500', name: '上海', temp: '27°C', weather: '阴' },
]

/** 当季推荐数据 */
export const SEASONAL_RECOMMENDS = [
  {
    color: 'from-sky-500 to-blue-600',
    cities: ['三亚', '厦门', '青岛'],
    desc: '阳光、沙滩、海浪，夏日避暑首选',
    icon: '☀️',
    season: '夏季出游',
    tag: '避暑',
  },
  {
    color: 'from-teal-500 to-cyan-600',
    cities: ['西安', '北京', '南京'],
    desc: '秋高气爽，适合历史文化深度游',
    icon: '📍',
    season: '秋季赏景',
    tag: '赏秋',
  },
]

/** 天气知识卡数据 */
export const WEATHER_KNOWLEDGE = [
  { color: 'from-blue-500 to-cyan-500', desc: '相对湿度高于 80% 时体感闷热，低于 30% 时皮肤易干燥', icon: '💧', title: '湿度与舒适度' },
  { color: 'bg-teal-500', desc: '紫外线指数 6 以上建议涂抹 SPF30+ 防晒霜', icon: '☀️', title: '紫外线防护' },
  { color: 'from-emerald-500 to-teal-500', desc: '气温每升高 10°C，体感温度可能高出 2-3°C', icon: '🌡️', title: '体感温度' },
]
