/**
 * 天气页面静态数据
 */

/** 多城速览数据 */
export const QUICK_CITIES = [
  { name: '三亚', temp: '28°C', weather: '晴' },
  { name: '丽江', temp: '18°C', weather: '多云' },
  { name: '西安', temp: '22°C', weather: '晴' },
  { name: '成都', temp: '24°C', weather: '阴' },
  { name: '大理', temp: '20°C', weather: '晴' },
  { name: '厦门', temp: '26°C', weather: '多云' },
  { name: '杭州', temp: '25°C', weather: '小雨' },
  { name: '上海', temp: '27°C', weather: '阴' },
]

/** 当季推荐数据 */
export const SEASONAL_RECOMMENDS = [
  {
    cities: ['三亚', '厦门', '青岛'],
    desc: '阳光、沙滩、海浪，夏日避暑首选',
    season: '夏季出游',
    tag: '避暑',
  },
  {
    cities: ['西安', '北京', '南京'],
    desc: '秋高气爽，适合历史文化深度游',
    season: '秋季赏景',
    tag: '赏秋',
  },
]

/** 天气知识卡数据 */
export const WEATHER_KNOWLEDGE = [
  { desc: '相对湿度高于 80% 时体感闷热，低于 30% 时皮肤易干燥', title: '湿度与舒适度' },
  { desc: '紫外线指数 6 以上建议涂抹 SPF30+ 防晒霜', title: '紫外线防护' },
  { desc: '气温每升高 10°C，体感温度可能高出 2-3°C', title: '体感温度' },
]
