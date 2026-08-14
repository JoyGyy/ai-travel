/**
 * Drizzle ORM Schema 定义
 * 对应 src/db/schema.sql 中的 11 张表
 */
import { relations } from 'drizzle-orm'
import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core'

// ========== 自定义类型 ==========

/** pgvector 向量类型，维度 1024 */
const vector = customType<{ data: string }>({
  dataType() {
    return 'vector(1024)'
  },
})

// ========== 用户表 ==========

export const users = pgTable('users', {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  email: varchar('email', { length: 128 }).notNull(),
  id: varchar('id', { length: 64 }).primaryKey(),
  passwordHash: varchar('password_hash', { length: 128 }).notNull(),
  username: varchar('username', { length: 64 }).unique().notNull(),
})

// ========== AI 使用额度表 ==========

export const aiUsage = pgTable(
  'ai_usage',
  {
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    usageDate: text('usage_date').notNull(),
    usedCount: integer('used_count').notNull().default(0),
    userId: varchar('user_id', { length: 64 })
      .notNull()
      .references(() => users.id),
  },
  (t) => [primaryKey({ columns: [t.userId, t.usageDate] })],
)

// ========== 用户收藏景点表 ==========

export const userFavoriteAttractions = pgTable(
  'user_favorite_attractions',
  {
    attractionId: varchar('attraction_id', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    userId: varchar('user_id', { length: 64 })
      .notNull()
      .references(() => users.id),
  },
  (t) => [primaryKey({ columns: [t.userId, t.attractionId] })],
)

// ========== 景点主表 ==========

export const attractions = pgTable(
  'attractions',
  {
    address: text('address').notNull().default(''),
    aliases: text('aliases').array().default([]),
    bookingLinks: jsonb('booking_links').default({}),
    city: text('city').notNull(),
    coverImage: text('cover_image').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    description: text('description').notNull().default(''),
    highlights: text('highlights').array().default([]),
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    openingHours: text('opening_hours').notNull().default(''),
    priceText: text('price_text').notNull().default(''),
    recommendedDuration: text('recommended_duration').notNull().default(''),
    suitableFor: text('suitable_for').array().default([]),
    summary: text('summary').notNull().default(''),
    ticketType: text('ticket_type').notNull().default('free'),
    tips: text('tips').array().default([]),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_attractions_city').on(t.city),
    index('idx_attractions_name_trgm').using('gin', t.name.op('gin_trgm_ops')),
  ],
)

// ========== 标签表 ==========

export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: text('name').unique().notNull(),
})

// ========== 景点-标签关联表 ==========

export const attractionTags = pgTable(
  'attraction_tags',
  {
    attractionId: text('attraction_id')
      .notNull()
      .references(() => attractions.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [
    primaryKey({ columns: [t.attractionId, t.tagId] }),
    index('idx_attraction_tags_tag').on(t.tagId),
  ],
)

// ========== RAG 知识库表 ==========

export const attractionKnowledge = pgTable(
  'attraction_knowledge',
  {
    accommodation: jsonb('accommodation').default([]),
    bestSeason: text('best_season').notNull().default(''),
    city: text('city').notNull(),
    description: text('description').notNull().default(''),
    duration: text('duration').notNull().default(''),
    embedding: vector('embedding'),
    food: text('food').array().default([]),
    id: serial('id').primaryKey(),
    indoor: boolean('indoor').notNull().default(false),
    name: text('name').notNull(),
    nightlife: jsonb('nightlife').default([]),
    tags: text('tags').array().default([]),
    ticket: numeric('ticket').notNull().default('0'),
    tips: text('tips').notNull().default(''),
    transport: text('transport').notNull().default(''),
  },
  (t) => [
    uniqueIndex('attraction_knowledge_city_name_unique').on(t.city, t.name),
    index('idx_knowledge_city').on(t.city),
  ],
)

// ========== 社区帖子表 ==========

export const communityPosts = pgTable(
  'community_posts',
  {
    authorId: varchar('author_id', { length: 64 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    city: text('city').notNull().default(''),
    content: text('content').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    id: text('id').primaryKey(),
    itinerarySnapshot: jsonb('itinerary_snapshot'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 自引用表需要 any 打破循环类型
    originalPostId: text('original_post_id').references((): any => communityPosts.id, {
      onDelete: 'set null',
    }),
    postType: text('post_type').notNull().default('original'),
    title: text('title').notNull().default(''),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    visibility: text('visibility').notNull().default('public'),
  },
  (t) => [
    index('idx_community_posts_created_at').on(t.createdAt.desc()),
    index('idx_community_posts_author').on(t.authorId, t.createdAt.desc()),
    index('idx_community_posts_city').on(t.city),
    index('idx_community_posts_original').on(t.originalPostId),
  ],
)

// ========== 社区帖子图片表 ==========

export const communityPostImages = pgTable(
  'community_post_images',
  {
    altText: text('alt_text').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    id: text('id').primaryKey(),
    postId: text('post_id')
      .notNull()
      .references(() => communityPosts.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull().default(0),
    storageKey: text('storage_key').notNull(),
    url: text('url').notNull(),
  },
  (t) => [index('idx_community_post_images_post').on(t.postId, t.sortOrder)],
)

// ========== 社区帖子点赞表 ==========

export const communityPostLikes = pgTable(
  'community_post_likes',
  {
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    postId: text('post_id')
      .notNull()
      .references(() => communityPosts.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 64 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (t) => [
    primaryKey({ columns: [t.postId, t.userId] }),
    index('idx_community_post_likes_user').on(t.userId, t.createdAt.desc()),
  ],
)

// ========== 社区帖子评论表 ==========

export const communityPostComments = pgTable(
  'community_post_comments',
  {
    authorId: varchar('author_id', { length: 64 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    id: text('id').primaryKey(),
    postId: text('post_id')
      .notNull()
      .references(() => communityPosts.id, { onDelete: 'cascade' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_community_comments_post').on(t.postId, t.createdAt.asc()),
    index('idx_community_comments_author').on(t.authorId, t.createdAt.desc()),
  ],
)

// ========== Relations ==========

export const usersRelations = relations(users, ({ many }) => ({
  aiUsage: many(aiUsage),
  comments: many(communityPostComments),
  favorites: many(userFavoriteAttractions),
  likes: many(communityPostLikes),
  posts: many(communityPosts),
}))

export const communityPostsRelations = relations(communityPosts, ({ many, one }) => ({
  author: one(users, { fields: [communityPosts.authorId], references: [users.id] }),
  comments: many(communityPostComments),
  images: many(communityPostImages),
  likes: many(communityPostLikes),
  originalPost: one(communityPosts, {
    fields: [communityPosts.originalPostId],
    references: [communityPosts.id],
    relationName: 'reposts',
  }),
}))

export const communityPostImagesRelations = relations(communityPostImages, ({ one }) => ({
  post: one(communityPosts, {
    fields: [communityPostImages.postId],
    references: [communityPosts.id],
  }),
}))

export const communityPostLikesRelations = relations(communityPostLikes, ({ one }) => ({
  post: one(communityPosts, {
    fields: [communityPostLikes.postId],
    references: [communityPosts.id],
  }),
  user: one(users, { fields: [communityPostLikes.userId], references: [users.id] }),
}))

export const communityPostCommentsRelations = relations(communityPostComments, ({ one }) => ({
  author: one(users, { fields: [communityPostComments.authorId], references: [users.id] }),
  post: one(communityPosts, {
    fields: [communityPostComments.postId],
    references: [communityPosts.id],
  }),
}))

export const attractionTagsRelations = relations(attractionTags, ({ one }) => ({
  attraction: one(attractions, {
    fields: [attractionTags.attractionId],
    references: [attractions.id],
  }),
  tag: one(tags, { fields: [attractionTags.tagId], references: [tags.id] }),
}))

export const attractionsRelations = relations(attractions, ({ many }) => ({
  tags: many(attractionTags),
}))

export const tagsRelations = relations(tags, ({ many }) => ({
  attractions: many(attractionTags),
}))
