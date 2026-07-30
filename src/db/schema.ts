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
  id: varchar('id', { length: 64 }).primaryKey(),
  username: varchar('username', { length: 64 }).unique().notNull(),
  email: varchar('email', { length: 128 }).notNull(),
  passwordHash: varchar('password_hash', { length: 128 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ========== AI 使用额度表 ==========

export const aiUsage = pgTable('ai_usage', {
  userId: varchar('user_id', { length: 64 }).notNull().references(() => users.id),
  usageDate: text('usage_date').notNull().default('CURRENT_DATE'),
  usedCount: integer('used_count').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [
  primaryKey({ columns: [t.userId, t.usageDate] }),
])

// ========== 用户收藏景点表 ==========

export const userFavoriteAttractions = pgTable('user_favorite_attractions', {
  userId: varchar('user_id', { length: 64 }).notNull().references(() => users.id),
  attractionId: varchar('attraction_id', { length: 64 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [
  primaryKey({ columns: [t.userId, t.attractionId] }),
])

// ========== 景点主表 ==========

export const attractions = pgTable('attractions', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  city: text('city').notNull(),
  ticketType: text('ticket_type').notNull().default('free'),
  priceText: text('price_text').notNull().default(''),
  coverImage: text('cover_image').notNull().default(''),
  summary: text('summary').notNull().default(''),
  description: text('description').notNull().default(''),
  address: text('address').notNull().default(''),
  openingHours: text('opening_hours').notNull().default(''),
  recommendedDuration: text('recommended_duration').notNull().default(''),
  aliases: text('aliases').array().default([]),
  highlights: text('highlights').array().default([]),
  tips: text('tips').array().default([]),
  suitableFor: text('suitable_for').array().default([]),
  bookingLinks: jsonb('booking_links').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [
  index('idx_attractions_city').on(t.city),
  index('idx_attractions_name_trgm').using('gin', t.name.op('gin_trgm_ops')),
])

// ========== 标签表 ==========

export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: text('name').unique().notNull(),
})

// ========== 景点-标签关联表 ==========

export const attractionTags = pgTable('attraction_tags', {
  attractionId: text('attraction_id').notNull().references(() => attractions.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, t => [
  primaryKey({ columns: [t.attractionId, t.tagId] }),
  index('idx_attraction_tags_tag').on(t.tagId),
])

// ========== RAG 知识库表 ==========

export const attractionKnowledge = pgTable('attraction_knowledge', {
  id: serial('id').primaryKey(),
  city: text('city').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  ticket: numeric('ticket').notNull().default('0'),
  duration: text('duration').notNull().default(''),
  tips: text('tips').notNull().default(''),
  indoor: boolean('indoor').notNull().default(false),
  tags: text('tags').array().default([]),
  food: text('food').array().default([]),
  transport: text('transport').notNull().default(''),
  bestSeason: text('best_season').notNull().default(''),
  accommodation: jsonb('accommodation').default([]),
  nightlife: jsonb('nightlife').default([]),
  embedding: vector('embedding'),
}, t => [
  uniqueIndex('attraction_knowledge_city_name_unique').on(t.city, t.name),
  index('idx_knowledge_city').on(t.city),
])

// ========== 社区帖子表 ==========

export const communityPosts = pgTable('community_posts', {
  id: text('id').primaryKey(),
  authorId: varchar('author_id', { length: 64 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  postType: text('post_type').notNull().default('original'),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 自引用表需要 any 打破循环类型
  originalPostId: text('original_post_id').references((): any => communityPosts.id, { onDelete: 'set null' }),
  title: text('title').notNull().default(''),
  content: text('content').notNull().default(''),
  city: text('city').notNull().default(''),
  itinerarySnapshot: jsonb('itinerary_snapshot'),
  visibility: text('visibility').notNull().default('public'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, t => [
  index('idx_community_posts_created_at').on(t.createdAt.desc()),
  index('idx_community_posts_author').on(t.authorId, t.createdAt.desc()),
  index('idx_community_posts_city').on(t.city),
  index('idx_community_posts_original').on(t.originalPostId),
])

// ========== 社区帖子图片表 ==========

export const communityPostImages = pgTable('community_post_images', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull().references(() => communityPosts.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  storageKey: text('storage_key').notNull(),
  altText: text('alt_text').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [
  index('idx_community_post_images_post').on(t.postId, t.sortOrder),
])

// ========== 社区帖子点赞表 ==========

export const communityPostLikes = pgTable('community_post_likes', {
  postId: text('post_id').notNull().references(() => communityPosts.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 64 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [
  primaryKey({ columns: [t.postId, t.userId] }),
  index('idx_community_post_likes_user').on(t.userId, t.createdAt.desc()),
])

// ========== 社区帖子评论表 ==========

export const communityPostComments = pgTable('community_post_comments', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull().references(() => communityPosts.id, { onDelete: 'cascade' }),
  authorId: varchar('author_id', { length: 64 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, t => [
  index('idx_community_comments_post').on(t.postId, t.createdAt.asc()),
  index('idx_community_comments_author').on(t.authorId, t.createdAt.desc()),
])

// ========== Relations ==========

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(communityPosts),
  comments: many(communityPostComments),
  likes: many(communityPostLikes),
  favorites: many(userFavoriteAttractions),
  aiUsage: many(aiUsage),
}))

export const communityPostsRelations = relations(communityPosts, ({ one, many }) => ({
  author: one(users, { fields: [communityPosts.authorId], references: [users.id] }),
  originalPost: one(communityPosts, { fields: [communityPosts.originalPostId], references: [communityPosts.id], relationName: 'reposts' }),
  images: many(communityPostImages),
  likes: many(communityPostLikes),
  comments: many(communityPostComments),
}))

export const communityPostImagesRelations = relations(communityPostImages, ({ one }) => ({
  post: one(communityPosts, { fields: [communityPostImages.postId], references: [communityPosts.id] }),
}))

export const communityPostLikesRelations = relations(communityPostLikes, ({ one }) => ({
  post: one(communityPosts, { fields: [communityPostLikes.postId], references: [communityPosts.id] }),
  user: one(users, { fields: [communityPostLikes.userId], references: [users.id] }),
}))

export const communityPostCommentsRelations = relations(communityPostComments, ({ one }) => ({
  post: one(communityPosts, { fields: [communityPostComments.postId], references: [communityPosts.id] }),
  author: one(users, { fields: [communityPostComments.authorId], references: [users.id] }),
}))

export const attractionTagsRelations = relations(attractionTags, ({ one }) => ({
  attraction: one(attractions, { fields: [attractionTags.attractionId], references: [attractions.id] }),
  tag: one(tags, { fields: [attractionTags.tagId], references: [tags.id] }),
}))

export const attractionsRelations = relations(attractions, ({ many }) => ({
  tags: many(attractionTags),
}))

export const tagsRelations = relations(tags, ({ many }) => ({
  attractions: many(attractionTags),
}))
