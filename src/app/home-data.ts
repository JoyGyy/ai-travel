/**
 * 首页静态数据
 */
import type { ReactNode } from 'react'

import { Cloud, Compass, Home, MapPin, Bot, Users } from 'lucide-react'

import { imageUrl } from '@/lib/images'

/** 快捷入口 */
export interface QuickEntry {
  icon: ReactNode
  label: string
  color: string
  href: string
}

export const quickEntries: QuickEntry[] = [
  { icon: Home({}), label: '酒店民宿', color: '#FF6B35', href: '/' },
  { icon: Compass({}), label: 'AI 行程', color: '#F59E0B', href: '/detail' },
  { icon: MapPin({}), label: '精选景点', color: '#10B981', href: '/attractions' },
  { icon: Users({}), label: '旅友社区', color: '#8B5CF6', href: '/community' },
  { icon: Cloud({}), label: '天气查询', color: '#3B82F6', href: '/weather' },
  { icon: Bot({}), label: 'AI 咨询', color: '#E84057', href: '/chat' },
]

/** 热门目的地 */
export const hotDestinations = [
  { name: '三亚', tag: '海岛度假', img: imageUrl('/images/home/trip-greece.jpg'), temp: '28°C', price: '¥2,899起' },
  { name: '丽江', tag: '古城慢游', img: imageUrl('/images/home/trip-scotland.jpg'), temp: '18°C', price: '¥1,599起' },
  { name: '西安', tag: '历史探秘', img: imageUrl('/images/home/trip-egypt.jpg'), temp: '22°C', price: '¥1,299起' },
  { name: '成都', tag: '美食之都', img: imageUrl('/images/home/trip-scotland.jpg'), temp: '24°C', price: '¥1,499起' },
  { name: '大理', tag: '风花雪月', img: imageUrl('/images/home/trip-greece.jpg'), temp: '20°C', price: '¥1,899起' },
  { name: '厦门', tag: '文艺小城', img: imageUrl('/images/home/trip-egypt.jpg'), temp: '26°C', price: '¥1,699起' },
]

/** 精选推荐 */
export const featuredTrips = [
  {
    title: '三亚 5 天 4 晚海岛深度游',
    desc: '蜈支洲岛 + 亚龙湾 + 南山寺，含五星酒店',
    image: imageUrl('/images/home/trip-greece.jpg'),
    tag: '人气爆款',
    rating: 4.9,
    reviews: 2341,
    price: 3299,
    originalPrice: 4599,
    city: '三亚',
  },
  {
    title: '丽江古城 + 玉龙雪山 4 日游',
    desc: '纳西古韵 + 雪山索道 + 蓝月谷',
    image: imageUrl('/images/home/trip-scotland.jpg'),
    tag: '限时特惠',
    rating: 4.8,
    reviews: 1856,
    price: 2199,
    originalPrice: 3199,
    city: '丽江',
  },
  {
    title: '西安兵马俑 + 华清池 3 日文化之旅',
    desc: '世界遗产 + 回民街美食 + 大唐不夜城',
    image: imageUrl('/images/home/trip-egypt.jpg'),
    tag: '周末可用',
    rating: 4.7,
    reviews: 1523,
    price: 1699,
    originalPrice: 2499,
    city: '西安',
  },
]

/** 用户评价 */
export const userReviews = [
  { name: '小王', avatar: '王', dest: '三亚', text: 'AI 规划的行程太省心了！每天节奏刚好，酒店推荐也很赞。', rating: 5 },
  { name: '阿丽', avatar: '丽', dest: '丽江', text: '第一次用 AI 做旅行攻略，比自己查攻略高效 10 倍！', rating: 5 },
  { name: '老张', avatar: '张', dest: '西安', text: '带爸妈出行，行程安排考虑了老人家体力，很贴心。', rating: 5 },
]
