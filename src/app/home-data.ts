/**
 * 首页静态数据
 */
import { imageUrl } from '@/lib/images'

/** 热门目的地 */
export const hotDestinations = [
  {
    img: imageUrl('/images/home/trip-greece.jpg'),
    name: '三亚',
    price: '¥2,899起',
    tag: '海岛度假',
    temp: '28°C',
  },
  {
    img: imageUrl('/images/home/trip-scotland.jpg'),
    name: '丽江',
    price: '¥1,599起',
    tag: '古城慢游',
    temp: '18°C',
  },
  {
    img: imageUrl('/images/home/trip-egypt.jpg'),
    name: '西安',
    price: '¥1,299起',
    tag: '历史探秘',
    temp: '22°C',
  },
  {
    img: imageUrl('/images/home/trip-scotland.jpg'),
    name: '成都',
    price: '¥1,499起',
    tag: '美食之都',
    temp: '24°C',
  },
  {
    img: imageUrl('/images/home/trip-greece.jpg'),
    name: '大理',
    price: '¥1,899起',
    tag: '风花雪月',
    temp: '20°C',
  },
  {
    img: imageUrl('/images/home/trip-egypt.jpg'),
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
    image: imageUrl('/images/home/trip-greece.jpg'),
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
    image: imageUrl('/images/home/trip-scotland.jpg'),
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
    image: imageUrl('/images/home/trip-egypt.jpg'),
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
