/**
 * 社区数据种子脚本
 *
 * 用法:
 *   pnpm db:seed:community -- --dry-run   — 仅打印将要插入的数据，不写库
 *   pnpm db:seed:community                — 插入示例帖子、图片、点赞和评论
 *
 * 需要 DATABASE_URL 环境变量（如 pnpm exec tsx --env-file=.env scripts/seed-community.ts）。
 * 重复运行会新增一批新帖子（id 随机），不会清空已有数据。
 */
import { nanoid } from 'nanoid'
import pg from 'pg'

import { env } from '../src/lib/env'

const { Pool } = pg

interface SeedImage {
  url: string
  storageKey: string
  altText: string
}

export interface SeedPost {
  authorUsername: string
  city: string
  title: string
  content: string
  images: SeedImage[]
  itinerarySnapshot: null | Record<string, unknown>
}

interface SeedComment {
  postIndex: number
  authorUsername: string
  content: string
}

interface SeedLike {
  postIndex: number
  username: string
}

/** 与帖子同城的本地景点图，用作配图（仅展示用，storageKey 不指向真实文件）。 */
const CITY_IMAGES: Record<string, string[]> = {
  三亚: ['/images/attractions/sanya/sanya-yalong-bay.webp', '/images/attractions/sanya/sanya-dadonghai.webp'],
  北京: ['/images/attractions/beijing/beijing-palace-museum.webp', '/images/attractions/beijing/beijing-badaling-great-wall.webp'],
  成都: ['/images/attractions/chengdu/chengdu-panda-base.webp', '/images/attractions/chengdu/chengdu-kuanzhai-alley.webp'],
  杭州: ['/images/attractions/hangzhou/hangzhou-west-lake.webp', '/images/attractions/hangzhou/hangzhou-hefang-street.webp'],
  西安: ['/images/attractions/xian/xian-terracotta-warriors.webp', '/images/attractions/xian/xian-muslim-quarter.webp'],
  丽江: ['/images/attractions/lijiang/lijiang-ancient-city.webp', '/images/attractions/lijiang/lijiang-jade-dragon-snow-mountain.webp'],
  厦门: ['/images/attractions/xiamen/xiamen-gulangyu.webp', '/images/attractions/xiamen/xiamen-huandao-road.webp'],
  上海: ['/images/attractions/shanghai/shanghai-the-bund.webp', '/images/attractions/shanghai/shanghai-disneyland.webp'],
  大理: ['/images/attractions/dali/dali-erhai.webp'],
  南京: ['/images/attractions/nanjing/nanjing-fuzimiao.webp'],
}

const SEED_POSTS: SeedPost[] = [
  {
    authorUsername: 'joygy',
    city: '三亚',
    title: '三亚三天两夜海岛度假',
    content: '亚龙湾的海水很清澈，适合第一次去海南的朋友。建议住亚龙湾一带，出门就是沙滩，早晚人都很少。蜈支洲岛的浮潜值得一去。',
    images: CITY_IMAGES.三亚.slice(0, 2).map(toImage),
    itinerarySnapshot: {
      city: '三亚',
      days: 3,
      spots: ['亚龙湾', '蜈支洲岛', '南山文化旅游区'],
    },
  },
  {
    authorUsername: 'test',
    city: '北京',
    title: '北京故宫初雪一日游',
    content: '运气好赶上了故宫初雪，红墙白雪太美了。记得提前 7 天在公众号预约，周一闭馆。从天安门进，神武门出，顺路可以去景山公园看全景。',
    images: [CITY_IMAGES.北京[0]].map(toImage),
    itinerarySnapshot: null,
  },
  {
    authorUsername: 'joygy',
    city: '成都',
    title: '成都熊猫基地+宽窄巷子打卡',
    content: '看熊猫一定要赶早，上午 8 点前到熊猫基地，能看到熊猫吃竹子。下午去宽窄巷子逛吃，担担面和钟水饺都推荐。',
    images: [CITY_IMAGES.成都[0], CITY_IMAGES.成都[1]].map(toImage),
    itinerarySnapshot: {
      city: '成都',
      days: 2,
      spots: ['成都大熊猫繁育研究基地', '宽窄巷子'],
    },
  },
  {
    authorUsername: 'test',
    city: '杭州',
    title: '西湖骑行环线攻略',
    content: '强烈推荐环西湖骑行，全程约 15 公里，走走停停大半天。从断桥出发，经苏堤到雷峰塔，沿途风景很好。春秋两季最舒服。',
    images: [CITY_IMAGES.杭州[0]].map(toImage),
    itinerarySnapshot: null,
  },
  {
    authorUsername: 'joygy',
    city: '西安',
    title: '西安兵马俑+回民街美食之旅',
    content: '兵马俑一定要请讲解，否则就是看坑。回民街晚上人很多，肉夹馍和羊肉泡馍都很正宗。华清宫离兵马俑不远，可以安排在同一天。',
    images: [CITY_IMAGES.西安[0], CITY_IMAGES.西安[1]].map(toImage),
    itinerarySnapshot: {
      city: '西安',
      days: 3,
      spots: ['秦始皇兵马俑博物馆', '华清宫', '回民街'],
    },
  },
  {
    authorUsername: 'test',
    city: '丽江',
    title: '丽江古城慢生活五天',
    content: '丽江适合慢游，别赶行程。白天逛古城四方街，晚上去酒吧街听听歌。玉龙雪山要提前订索道票，蓝月谷的水特别蓝。',
    images: [CITY_IMAGES.丽江[0], CITY_IMAGES.丽江[1]].map(toImage),
    itinerarySnapshot: null,
  },
  {
    authorUsername: 'joygy',
    city: '厦门',
    title: '厦门鼓浪屿文艺两日',
    content: '鼓浪屿的万国建筑很美，适合拍照。日光岩能看全岛和海景。厦门大学现在需要预约参观，记得提前。环岛路骑行也很惬意。',
    images: [CITY_IMAGES.厦门[0]].map(toImage),
    itinerarySnapshot: null,
  },
  {
    authorUsername: 'test',
    city: '上海',
    title: '上海外滩夜景+迪士尼',
    content: '外滩夜景名不虚传，建议 19 点后去看灯。迪士尼工作日人少很多，热门项目可以抢快速通道。豫园的南翔小笼值得一吃。',
    images: [CITY_IMAGES.上海[0], CITY_IMAGES.上海[1]].map(toImage),
    itinerarySnapshot: {
      city: '上海',
      days: 3,
      spots: ['外滩', '上海迪士尼度假区', '豫园'],
    },
  },
]

const SEED_COMMENTS: SeedComment[] = [
  { postIndex: 0, authorUsername: 'test', content: '请问几月份去最合适？想带爸妈一起去。' },
  { postIndex: 0, authorUsername: 'joygy', content: '我是 10 月去的，人不多，天气也舒服。' },
  { postIndex: 2, authorUsername: 'test', content: '熊猫基地人多不多？需要提前订票吗？' },
  { postIndex: 4, authorUsername: 'joygy', content: '兵马俑讲解多少钱？大概讲多久？' },
  { postIndex: 1, authorUsername: 'joygy', content: '故宫现在预约难吗？想周末去。' },
]

const SEED_LIKES: SeedLike[] = [
  { postIndex: 0, username: 'test' },
  { postIndex: 1, username: 'joygy' },
  { postIndex: 3, username: 'joygy' },
  { postIndex: 4, username: 'test' },
  { postIndex: 5, username: 'joygy' },
  { postIndex: 7, username: 'test' },
]

function toImage(url: string): SeedImage {
  return { url, storageKey: `seed:${nanoid(12)}`, altText: '旅行分享图片' }
}

/** 最小查询客户端 */
interface QueryClient {
  query: (text: string, params?: unknown[]) => Promise<{ rows: unknown[] }>
}

/** 将种子数据写入数据库（单个事务）。返回插入统计。 */
export async function seedCommunity(
  client: QueryClient,
  posts: SeedPost[] = SEED_POSTS,
  comments: SeedComment[] = SEED_COMMENTS,
  likes: SeedLike[] = SEED_LIKES,
): Promise<{ posts: number, images: number, comments: number, likes: number }> {
  const users = (await client.query('SELECT id, username FROM users')).rows as { id: string, username: string }[]
  const userByUsername = new Map(users.map(user => [user.username, user.id]))
  const postIds: string[] = []
  let imageCount = 0

  await client.query('BEGIN')
  try {
    for (const post of posts) {
      const authorId = userByUsername.get(post.authorUsername)
      if (!authorId)
        throw new Error(`种子作者不存在: ${post.authorUsername}`)

      const postId = nanoid(12)
      postIds.push(postId)
      const itinerary = post.itinerarySnapshot === null
        ? null
        : JSON.stringify(post.itinerarySnapshot)

      await client.query(
        `INSERT INTO community_posts
           (id, author_id, post_type, original_post_id, title, content, city, itinerary_snapshot, visibility)
         VALUES ($1, $2, 'original', NULL, $3, $4, $5, $6::jsonb, 'public')`,
        [postId, authorId, post.title, post.content, post.city, itinerary],
      )

      for (const [idx, image] of post.images.entries()) {
        await client.query(
          `INSERT INTO community_post_images (id, post_id, url, storage_key, alt_text, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [nanoid(12), postId, image.url, image.storageKey, image.altText, idx],
        )
        imageCount++
      }
    }

    for (const comment of comments) {
      const authorId = userByUsername.get(comment.authorUsername)
      const postId = postIds[comment.postIndex]
      if (!authorId || !postId)
        continue
      await client.query(
        `INSERT INTO community_post_comments (id, post_id, author_id, content)
         VALUES ($1, $2, $3, $4)`,
        [nanoid(12), postId, authorId, comment.content],
      )
    }

    for (const like of likes) {
      const userId = userByUsername.get(like.username)
      const postId = postIds[like.postIndex]
      if (!userId || !postId)
        continue
      await client.query(
        `INSERT INTO community_post_likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [postId, userId],
      )
    }

    await client.query('COMMIT')
  }
  catch (error) {
    await client.query('ROLLBACK')
    throw error
  }

  return { posts: postIds.length, images: imageCount, comments: comments.length, likes: likes.length }
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run')

  if (dryRun) {
    const imageCount = SEED_POSTS.reduce((sum, post) => sum + post.images.length, 0)
    console.log(`[dry-run] 将插入 ${SEED_POSTS.length} 篇帖子, ${imageCount} 张图片, ${SEED_COMMENTS.length} 条评论, ${SEED_LIKES.length} 个赞`)
    return
  }

  if (!env.DATABASE_URL)
    throw new Error('缺少 DATABASE_URL 环境变量，无法连接数据库')

  const pool = new Pool({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 5_000 })
  const client = await pool.connect()
  try {
    const stats = await seedCommunity(client)
    console.log(
      `成功插入: ${stats.posts} 篇帖子, ${stats.images} 张图片, ${stats.comments} 条评论, ${stats.likes} 个赞`,
    )
  }
  finally {
    client.release()
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
