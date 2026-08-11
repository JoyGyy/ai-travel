/**
 * 社区服务单元测试
 */

import {
  createCommunityComment,
  createCommunityPost,
  deleteCommunityComment,
  deleteCommunityPost,
  getCommunityPostById,
  likeCommunityPost,
  listCommunityComments,
  listCommunityPosts,
  repostCommunityPost,
  unlikeCommunityPost,
} from './community'

// ========== Mock 依赖 ==========

vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'mock-nanoid-id'),
}))

const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockExecute = vi.fn()
const mockTransaction = vi.fn()

vi.mock('@/lib/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => mockInsert(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
    execute: (...args: unknown[]) => mockExecute(...args),
    transaction: (...args: unknown[]) => mockTransaction(...args),
  },
  typedQuery: <T>(result: unknown[]) => result as unknown as T[],
}))

// ========== 辅助函数 ==========

/** 创建可链式调用的 mock query builder */
function createQueryBuilder(finalResult: unknown[]) {
  const builder: Record<string, unknown> = {}
  builder.from = vi.fn(() => builder)
  builder.where = vi.fn(() => builder)
  builder.orderBy = vi.fn(() => builder)
  builder.limit = vi.fn(() => builder)
  builder.offset = vi.fn(() => builder)
  builder.innerJoin = vi.fn(() => builder)
  builder.values = vi.fn(() => Promise.resolve(undefined))
  builder.returning = vi.fn(() => Promise.resolve(finalResult))
  builder.set = vi.fn(() => builder)
  builder.onConflictDoNothing = vi.fn(() => Promise.resolve(undefined))
  builder.then = (resolve: (value: unknown[]) => unknown) => resolve(finalResult)
  return builder
}

/** 生成社区帖子原始行数据 */
function makePostRow(
  overrides: Partial<{
    id: string
    author_id: string
    author_username: string
    post_type: 'original' | 'repost'
    original_post_id: string | null
    title: string
    content: string
    city: string
    like_count: number
    comment_count: number
    repost_count: number
    liked_by_me: boolean
  }> = {},
) {
  return {
    id: overrides.id ?? 'post-1',
    author_id: overrides.author_id ?? 'author-1',
    author_username: overrides.author_username ?? 'testuser',
    post_type: overrides.post_type ?? 'original',
    original_post_id: overrides.original_post_id ?? null,
    title: overrides.title ?? '测试帖子',
    content: overrides.content ?? '帖子内容',
    city: overrides.city ?? '北京',
    itinerary_snapshot: null,
    like_count: overrides.like_count ?? 5,
    comment_count: overrides.comment_count ?? 3,
    repost_count: overrides.repost_count ?? 1,
    liked_by_me: overrides.liked_by_me ?? false,
    created_at: new Date('2024-01-15T10:00:00Z'),
    updated_at: new Date('2024-01-15T10:00:00Z'),
  }
}

// ========== 测试 ==========

describe('community 服务', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ---------- listCommunityPosts ----------

  describe('listCommunityPosts()', () => {
    it('正常返回帖子列表', async () => {
      // arrange
      const postRow = makePostRow()
      mockSelect.mockReturnValue(createQueryBuilder([{ cnt: 1 }]))
      mockExecute.mockResolvedValue({ rows: [postRow] })

      // act
      const result = await listCommunityPosts(
        {
          page: 1,
          pageSize: 10,
          city: '',
          withItinerary: false,
          authorId: '',
        },
        'viewer-1',
      )

      // assert
      expect(result.total).toBe(1)
      expect(result.items).toHaveLength(1)
      expect(result.items[0].id).toBe('post-1')
      expect(result.items[0].author.username).toBe('testuser')
      expect(result.items[0].likeCount).toBe(5)
    })

    it('分页参数归一化', async () => {
      // arrange
      mockSelect.mockReturnValue(createQueryBuilder([{ cnt: 0 }]))
      mockExecute.mockResolvedValue({ rows: [] })

      // act
      const result = await listCommunityPosts({
        page: -1,
        pageSize: 100,
        city: '',
        withItinerary: false,
        authorId: '',
      })

      // assert
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(30) // 上限 30
    })

    it('城市筛选生效', async () => {
      // arrange
      mockSelect.mockReturnValue(createQueryBuilder([{ cnt: 0 }]))
      mockExecute.mockResolvedValue({ rows: [] })

      // act
      await listCommunityPosts({
        page: 1,
        pageSize: 10,
        city: '上海',
        withItinerary: false,
        authorId: '',
      })

      // assert
      // 验证 select 被调用（count 查询）
      expect(mockSelect).toHaveBeenCalled()
    })
  })

  // ---------- getCommunityPostById ----------

  describe('getCommunityPostById()', () => {
    it('返回存在的帖子', async () => {
      // arrange
      const postRow = makePostRow()
      mockExecute.mockResolvedValue({ rows: [postRow] })

      // act
      const result = await getCommunityPostById('post-1', 'viewer-1')

      // assert
      expect(result).not.toBeNull()
      expect(result!.id).toBe('post-1')
      expect(result!.title).toBe('测试帖子')
      expect(result!.city).toBe('北京')
    })

    it('帖子不存在时返回 null', async () => {
      // arrange
      mockExecute.mockResolvedValue({ rows: [] })

      // act
      const result = await getCommunityPostById('nonexistent')

      // assert
      expect(result).toBeNull()
    })
  })

  // ---------- createCommunityPost ----------

  describe('createCommunityPost()', () => {
    it('成功创建原帖', async () => {
      // arrange
      const postRow = makePostRow({ id: 'new-post' })
      mockTransaction.mockImplementation(async (callback: (tx: unknown) => Promise<string>) => {
        const mockTx = {
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockResolvedValue(undefined),
          }),
        }
        return callback(mockTx)
      })
      // getCommunityPostById 的 mock
      mockExecute.mockResolvedValue({ rows: [postRow] })

      // act
      const result = await createCommunityPost('author-1', {
        title: '新帖子',
        content: '内容',
        city: '北京',
      })

      // assert
      expect(result.id).toBe('new-post')
      expect(mockTransaction).toHaveBeenCalled()
    })

    it('事务回滚时抛出错误', async () => {
      // arrange
      mockTransaction.mockRejectedValue(new Error('事务失败'))

      // act & assert
      await expect(
        createCommunityPost('author-1', {
          title: '新帖子',
        }),
      ).rejects.toThrow('事务失败')
    })
  })

  // ---------- deleteCommunityPost ----------

  describe('deleteCommunityPost()', () => {
    it('成功删除自己的帖子', async () => {
      // arrange
      mockSelect.mockReturnValue(createQueryBuilder([{ authorId: 'author-1' }]))
      mockUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      })

      // act & assert
      await expect(deleteCommunityPost('post-1', 'author-1')).resolves.toBeUndefined()
    })

    it('帖子不存在时抛出 404', async () => {
      // arrange
      mockSelect.mockReturnValue(createQueryBuilder([]))

      // act & assert
      const err = (await deleteCommunityPost('nonexistent', 'author-1').catch(
        (e) => e,
      )) as Error & { status: number }
      expect(err.status).toBe(404)
      expect(err.message).toBe('帖子不存在或已删除')
    })

    it('删除他人帖子时抛出 403', async () => {
      // arrange
      mockSelect.mockReturnValue(createQueryBuilder([{ authorId: 'other-author' }]))

      // act & assert
      const err = (await deleteCommunityPost('post-1', 'author-1').catch((e) => e)) as Error & {
        status: number
      }
      expect(err.status).toBe(403)
      expect(err.message).toBe('只能删除自己的帖子')
    })
  })

  // ---------- likeCommunityPost / unlikeCommunityPost ----------

  describe('likeCommunityPost()', () => {
    it('成功点赞帖子', async () => {
      // arrange
      // ensurePostExists 的 mock
      mockSelect.mockReturnValue(createQueryBuilder([{ id: 'post-1' }]))
      // insert like 的 mock
      mockInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
        }),
      })

      // act
      const result = await likeCommunityPost('post-1', 'user-1')

      // assert
      expect(result.likedByMe).toBe(true)
    })

    it('帖子不存在时抛出 404', async () => {
      // arrange
      mockSelect.mockReturnValue(createQueryBuilder([]))

      // act & assert
      const err = (await likeCommunityPost('nonexistent', 'user-1').catch((e) => e)) as Error & {
        status: number
      }
      expect(err.status).toBe(404)
    })
  })

  describe('unlikeCommunityPost()', () => {
    it('成功取消点赞', async () => {
      // arrange
      // ensurePostExists 的 mock
      mockSelect.mockReturnValue(createQueryBuilder([{ id: 'post-1' }]))
      // delete like 的 mock
      mockDelete.mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      })

      // act
      const result = await unlikeCommunityPost('post-1', 'user-1')

      // assert
      expect(result.likedByMe).toBe(false)
    })

    it('帖子不存在时抛出 404', async () => {
      // arrange
      mockSelect.mockReturnValue(createQueryBuilder([]))

      // act & assert
      const err = (await unlikeCommunityPost('nonexistent', 'user-1').catch((e) => e)) as Error & {
        status: number
      }
      expect(err.status).toBe(404)
    })
  })

  // ---------- listCommunityComments ----------

  describe('listCommunityComments()', () => {
    it('返回评论列表', async () => {
      // arrange
      // ensurePostExists
      mockSelect
        .mockReturnValueOnce(createQueryBuilder([{ id: 'post-1' }])) // ensurePostExists
        .mockReturnValueOnce(
          createQueryBuilder([
            {
              id: 'comment-1',
              postId: 'post-1',
              authorId: 'user-1',
              authorUsername: 'commenter',
              content: '好帖子',
              createdAt: new Date('2024-01-15T12:00:00Z'),
              updatedAt: new Date('2024-01-15T12:00:00Z'),
            },
          ]),
        ) // data
        .mockReturnValueOnce(createQueryBuilder([{ cnt: 1 }])) // count

      // act
      const result = await listCommunityComments('post-1', 1, 20)

      // assert
      expect(result.items).toHaveLength(1)
      expect(result.items[0].content).toBe('好帖子')
      expect(result.total).toBe(1)
    })
  })

  // ---------- createCommunityComment ----------

  describe('createCommunityComment()', () => {
    it('成功创建评论', async () => {
      // arrange
      // ensurePostExists 的 mock
      mockSelect.mockReturnValueOnce(createQueryBuilder([{ id: 'post-1' }]))
      // insert returning
      const insertedComment = {
        id: 'comment-1',
        postId: 'post-1',
        authorId: 'user-1',
        content: '评论内容',
        createdAt: new Date('2024-01-15T12:00:00Z'),
        updatedAt: new Date('2024-01-15T12:00:00Z'),
      }
      mockInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([insertedComment]),
        }),
      })
      // 查询用户名
      mockSelect.mockReturnValueOnce(createQueryBuilder([{ username: 'testuser' }]))

      // act
      const result = await createCommunityComment('post-1', 'user-1', '评论内容')

      // assert
      expect(result.comment.content).toBe('评论内容')
      expect(result.comment.author.username).toBe('testuser')
    })
  })

  // ---------- deleteCommunityComment ----------

  describe('deleteCommunityComment()', () => {
    it('成功删除自己的评论', async () => {
      // arrange
      mockSelect.mockReturnValue(createQueryBuilder([{ authorId: 'user-1' }]))
      mockUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      })

      // act & assert
      await expect(deleteCommunityComment('comment-1', 'user-1')).resolves.toBeUndefined()
    })

    it('评论不存在时抛出 404', async () => {
      // arrange
      mockSelect.mockReturnValue(createQueryBuilder([]))

      // act & assert
      const err = (await deleteCommunityComment('nonexistent', 'user-1').catch(
        (e) => e,
      )) as Error & { status: number }
      expect(err.status).toBe(404)
      expect(err.message).toBe('评论不存在或已删除')
    })

    it('删除他人评论时抛出 403', async () => {
      // arrange
      mockSelect.mockReturnValue(createQueryBuilder([{ authorId: 'other-user' }]))

      // act & assert
      const err = (await deleteCommunityComment('comment-1', 'user-1').catch((e) => e)) as Error & {
        status: number
      }
      expect(err.status).toBe(403)
      expect(err.message).toBe('只能删除自己的评论')
    })
  })

  // ---------- repostCommunityPost ----------

  describe('repostCommunityPost()', () => {
    it('成功转发帖子', async () => {
      // arrange
      // getRepostTarget
      mockSelect.mockReturnValueOnce(
        createQueryBuilder([
          {
            id: 'post-1',
            postType: 'original',
            originalPostId: null,
            city: '北京',
          },
        ]),
      )
      // ensurePostExists (originalPostId = post-1)
      mockSelect.mockReturnValueOnce(createQueryBuilder([{ id: 'post-1' }]))

      // insertPost in transaction
      mockTransaction.mockImplementation(async (callback: (tx: unknown) => Promise<string>) => {
        const mockTx = {
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockResolvedValue(undefined),
          }),
        }
        return callback(mockTx)
      })

      // getCommunityPostById
      const repostRow = makePostRow({
        id: 'repost-1',
        post_type: 'repost',
        original_post_id: 'post-1',
      })
      mockExecute.mockResolvedValue({ rows: [repostRow] })

      // act
      const result = await repostCommunityPost('post-1', 'author-2', '转发评论')

      // assert
      expect(result.id).toBe('repost-1')
      expect(result.postType).toBe('repost')
    })

    it('转发不存在的帖子时抛出 404', async () => {
      // arrange
      mockSelect.mockReturnValue(createQueryBuilder([]))

      // act & assert
      const err = (await repostCommunityPost('nonexistent', 'author-1').catch(
        (e) => e,
      )) as Error & { status: number }
      expect(err.status).toBe(404)
    })
  })
})
