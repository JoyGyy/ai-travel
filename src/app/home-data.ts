/**
 * 首页静态数据
 */

/** 真实目的地图片（高德地图） */
const IMAGES = {
  chengdu: 'http://store.is.autonavi.com/showpic/a053c92a40b8a3591e3c24fd3d9bc40a',
  dali: 'http://store.is.autonavi.com/showpic/259f92e8e83511f6ef58afd321d2a08e',
  lijiang: 'http://store.is.autonavi.com/showpic/c229c50a07284982a5f93aecdd309b81',
  sanya: 'http://store.is.autonavi.com/showpic/b9c402b7d34ea98654cc915e567761dd',
  xiamen: 'http://store.is.autonavi.com/showpic/4aa0a6a1b6ee72c9833441f363cbb43a',
  xian: 'http://store.is.autonavi.com/showpic/00f713e61c99c4956ab27df73afdde71',
}

/** 热门目的地 */
export const hotDestinations = [
  {
    img: IMAGES.sanya,
    name: '三亚',
    price: '¥2,899起',
    tag: '海岛度假',
    temp: '28°C',
  },
  {
    img: IMAGES.lijiang,
    name: '丽江',
    price: '¥1,599起',
    tag: '古城慢游',
    temp: '18°C',
  },
  {
    img: IMAGES.xian,
    name: '西安',
    price: '¥1,299起',
    tag: '历史探秘',
    temp: '22°C',
  },
  {
    img: IMAGES.chengdu,
    name: '成都',
    price: '¥1,499起',
    tag: '美食之都',
    temp: '24°C',
  },
  {
    img: IMAGES.dali,
    name: '大理',
    price: '¥1,899起',
    tag: '风花雪月',
    temp: '20°C',
  },
  {
    img: IMAGES.xiamen,
    name: '厦门',
    price: '¥1,699起',
    tag: '文艺小城',
    temp: '26°C',
  },
]

/** 精选推荐 */
export const featuredTrips = [
  {
    city: '三亚',
    desc: '蜈支洲岛 + 亚龙湾 + 南山寺，含五星酒店',
    image: IMAGES.sanya,
    originalPrice: 4599,
    price: 3299,
    rating: 4.9,
    reviews: 2341,
    tag: '人气爆款',
    title: '三亚 5 天 4 晚海岛深度游',
  },
  {
    city: '丽江',
    desc: '纳西古韵 + 雪山索道 + 蓝月谷',
    image: IMAGES.lijiang,
    originalPrice: 3199,
    price: 2199,
    rating: 4.8,
    reviews: 1856,
    tag: '限时特惠',
    title: '丽江古城 + 玉龙雪山 4 日游',
  },
  {
    city: '西安',
    desc: '世界遗产 + 回民街美食 + 大唐不夜城',
    image: IMAGES.xian,
    originalPrice: 2499,
    price: 1699,
    rating: 4.7,
    reviews: 1523,
    tag: '周末可用',
    title: '西安兵马俑 + 华清池 3 日文化之旅',
  },
]

/** 用户评价 */
export const userReviews = [
  {
    avatar: '王',
    dest: '三亚',
    name: '小王',
    rating: 5,
    text: 'AI 规划的行程太省心了！每天节奏刚好，酒店推荐也很赞。',
  },
  {
    avatar: '丽',
    dest: '丽江',
    name: '阿丽',
    rating: 5,
    text: '第一次用 AI 做旅行攻略，比自己查攻略高效 10 倍！',
  },
  {
    avatar: '张',
    dest: '西安',
    name: '老张',
    rating: 5,
    text: '带爸妈出行，行程安排考虑了老人家体力，很贴心。',
  },
]
