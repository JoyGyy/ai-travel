/**
 * 首页静态数据
 */
import { imageUrl } from '@/lib/images'

/** 真实目的地图片（维基百科 1280px 高清） */
const IMAGES = {
  sanya:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Yalong_Bay_01.jpg/1280px-Yalong_Bay_01.jpg',
  lijiang:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Black_Dragon_%E9%BB%91%E9%BE%99%E6%BD%AD_%285496141333%29.jpg/1280px-Black_Dragon_%E9%BB%91%E9%BE%99%E6%BD%AD_%285496141333%29.jpg',
  xian: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/City_wall_of_Xi%27an_51550-Xian_%2827959363326%29.jpg/1280px-City_wall_of_Xi%27an_51550-Xian_%2827959363326%29.jpg',
  chengdu:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Chengdu_Research_Base_Eingang.jpg/1280px-Chengdu_Research_Base_Eingang.jpg',
  dali: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Erhai_lake%2C_Yunnan%2C_China.jpg/1280px-Erhai_lake%2C_Yunnan%2C_China.jpg',
  xiamen:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/2018%E5%B9%B4%E7%9A%84%E9%BC%93%E6%B5%AA%E5%B1%BF.jpg/1280px-2018%E5%B9%B4%E7%9A%84%E9%BC%93%E6%B5%AA%E5%B1%BF.jpg',
}

/** 热门目的地 */
export const hotDestinations = [
  {
    img: imageUrl(IMAGES.sanya),
    name: '三亚',
    price: '¥2,899起',
    tag: '海岛度假',
    temp: '28°C',
  },
  {
    img: imageUrl(IMAGES.lijiang),
    name: '丽江',
    price: '¥1,599起',
    tag: '古城慢游',
    temp: '18°C',
  },
  {
    img: imageUrl(IMAGES.xian),
    name: '西安',
    price: '¥1,299起',
    tag: '历史探秘',
    temp: '22°C',
  },
  {
    img: imageUrl(IMAGES.chengdu),
    name: '成都',
    price: '¥1,499起',
    tag: '美食之都',
    temp: '24°C',
  },
  {
    img: imageUrl(IMAGES.dali),
    name: '大理',
    price: '¥1,899起',
    tag: '风花雪月',
    temp: '20°C',
  },
  {
    img: imageUrl(IMAGES.xiamen),
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
    image: imageUrl(IMAGES.sanya),
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
    image: imageUrl(IMAGES.lijiang),
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
    image: imageUrl(IMAGES.xian),
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
