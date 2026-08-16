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

const mockQuery = vi.fn()
const mockGetClient = vi.fn()

vi.mock('@/lib/db', () => ({
  getClient: (...args: unknown[]) => mockGetClient(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  typedQuery: <T>(result: unknown[]) => result as unknown as T[],
}))

/** 创建一个 mock PoolClient */
function createMockClient() {
  const clientQuery = vi.fn()
  return {
    _query: clientQuery,
    query: clientQuery,
    release: vi.fn(),
  }
}

// ========== 辅助函数 ==========

/** 生成社区帖子原始行数据 */
function makePostRow(
  overrides: Partial<{
    author_id: string
    author_username: string
    city: string
    comment_count: number
    content: string
    id: string
    like_count: number
    liked_by_me: boolean
    original_post_id: null | string
    post_type: 'original' | 'repost'
    repost_count: number
    title: string
  }> = {},
) {
  return {
    author_id: overrides.author_id ?? 'author-1',
    author_username: overrides.author_username ?? 'testuser',
    city: overrides.city ?? '北京',
    comment_count: overrides.comment_count ?? 3,
    content: overrides.content ?? '帖子内容',
    created_at: new Date('2024-01-15T10:00:00Z'),
    id: overrides.id ?? 'post-1',
    itinerary_snapshot: null,
    like_count: overrides.like_count ?? 5,
    liked_by_me: overrides.liked_by_me ?? false,
    original_post_id: overrides.original_post_id ?? null,
    post_type: overrides.post_type ?? 'original',
    repost_count: overrides.repost_count ?? 1,
    title: overrides.title ?? '测试帖子',
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
      mockQuery.mockResolvedValueOnce({ rows: [{ cnt: 1 }] }) // count
      mockQuery.mockResolvedValueOnce({ rows: [postRow] }) // data
      // hydratePosts: getImagesByPostIds
      mockQuery.mockResolvedValueOnce({ rows: [] }) // images

      // act
      const result = await listCommunityPosts(
        {
          authorId: '',
          city: '',
          page: 1,
          pageSize: 10,
          withItinerary: false,
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
      mockQuery.mockResolvedValueOnce({ rows: [{ cnt: 0 }] }) // count
      mockQuery.mockResolvedValueOnce({ rows: [] }) // data

      // act
      const result = await listCommunityPosts({
        authorId: '',
        city: '',
        page: -1,
        pageSize: 100,
        withItinerary: false,
      })

      // assert
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(30) // 上限 30
    })

    it('城市筛选生效', async () => {
      // arrange
      mockQuery.mockResolvedValueOnce({ rows: [{ cnt: 0 }] }) // count
      mockQuery.mockResolvedValueOnce({ rows: [] }) // data

      // act
      await listCommunityPosts({
        authorId: '',
        city: '上海',
        page: 1,
        pageSize: 10,
        withItinerary: false,
      })

      // assert
      // 验证 query 被调用（count 查询）
      expect(mockQuery).toHaveBeenCalled()
    })
  })

  // ---------- getCommunityPostById ----------

  describe('getCommunityPostById()', () => {
    it('返回存在的帖子', async () => {
      // arrange
      const postRow = makePostRow()
      mockQuery.mockResolvedValueOnce({ rows: [postRow] }) // data
      mockQuery.mockResolvedValueOnce({ rows: [] }) // images

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
      mockQuery.mockResolvedValueOnce({ rows: [] })

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
      const client = createMockClient()
      mockGetClient.mockResolvedValue(client)
      client._query.mockResolvedValueOnce(undefined) // BEGIN
      client._query.mockResolvedValueOnce({ rows: [] }) // INSERT post
      client._query.mockResolvedValueOnce(undefined) // COMMIT

      const postRow = makePostRow({ id: 'new-post' })
      // getCommunityPostById
      mockQuery.mockResolvedValueOnce({ rows: [postRow] })
      mockQuery.mockResolvedValueOnce({ rows: [] }) // images

      // act
      const result = await createCommunityPost('author-1', {
        city: '北京',
        content: '内容',
        title: '新帖子',
      })

      // assert
      expect(result.id).toBe('new-post')
      expect(client.query).toHaveBeenCalledWith('BEGIN')
      expect(client.query).toHaveBeenCalledWith('COMMIT')
      expect(client.release).toHaveBeenCalled()
    })

    it('事务回滚时抛出错误', async () => {
      // arrange
      const client = createMockClient()
      mockGetClient.mockResolvedValue(client)
      client._query.mockResolvedValueOnce(undefined) // BEGIN
      client._query.mockRejectedValueOnce(new Error('事务失败')) // INSERT fails

      // act & assert
      await expect(
        createCommunityPost('author-1', {
          title: '新帖子',
        }),
      ).rejects.toThrow('事务失败')
      expect(client.query).toHaveBeenCalledWith('ROLLBACK')
      expect(client.release).toHaveBeenCalled()
    })
  })

  // ---------- deleteCommunityPost ----------

  describe('deleteCommunityPost()', () => {
    it('成功删除自己的帖子', async () => {
      // arrange
      mockQuery.mockResolvedValueOnce({ rows: [{ author_id: 'author-1' }] }) // SELECT
      mockQuery.mockResolvedValueOnce({ rows: [] }) // UPDATE

      // act & assert
      await expect(deleteCommunityPost('post-1', 'author-1')).resolves.toBeUndefined()
    })

    it('帖子不存在时抛出 404', async () => {
      // arrange
      mockQuery.mockResolvedValueOnce({ rows: [] }) // SELECT

      // act & assert
      const err = (await deleteCommunityPost('nonexistent', 'author-1').catch(
        (e) => e,
      )) as Error & { status: number }
      expect(err.status).toBe(404)
      expect(err.message).toBe('帖子不存在或已删除')
    })

    it('删除他人帖子时抛出 403', async () => {
      // arrange
      mockQuery.mockResolvedValueOnce({ rows: [{ author_id: 'other-author' }] }) // SELECT

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
      // ensurePostExists
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'post-1' }] })
      // INSERT like
      mockQuery.mockResolvedValueOnce({ rows: [] })
      // getLikeCount
      mockQuery.mockResolvedValueOnce({ rows: [{ cnt: 6 }] })

      // act
      const result = await likeCommunityPost('post-1', 'user-1')

      // assert
      expect(result.likedByMe).toBe(true)
      expect(result.likeCount).toBe(6)
    })

    it('帖子不存在时抛出 404', async () => {
      // arrange
      mockQuery.mockResolvedValueOnce({ rows: [] }) // ensurePostExists

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
      // ensurePostExists
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'post-1' }] })
      // DELETE like
      mockQuery.mockResolvedValueOnce({ rows: [] })
      // getLikeCount
      mockQuery.mockResolvedValueOnce({ rows: [{ cnt: 4 }] })

      // act
      const result = await unlikeCommunityPost('post-1', 'user-1')

      // assert
      expect(result.likedByMe).toBe(false)
      expect(result.likeCount).toBe(4)
    })

    it('帖子不存在时抛出 404', async () => {
      // arrange
      mockQuery.mockResolvedValueOnce({ rows: [] }) // ensurePostExists

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
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'post-1' }] })
      // data query
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            author_id: 'user-1',
            author_username: 'commenter',
            content: '好帖子',
            created_at: new Date('2024-01-15T12:00:00Z'),
            id: 'comment-1',
            post_id: 'post-1',
            updated_at: new Date('2024-01-15T12:00:00Z'),
          },
        ],
      })
      // count query
      mockQuery.mockResolvedValueOnce({ rows: [{ cnt: 1 }] })

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
      // ensurePostExists
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'post-1' }] })
      // INSERT RETURNING
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            author_id: 'user-1',
            content: '评论内容',
            created_at: new Date('2024-01-15T12:00:00Z'),
            id: 'comment-1',
            post_id: 'post-1',
            updated_at: new Date('2024-01-15T12:00:00Z'),
          },
        ],
      })
      // 查询用户名
      mockQuery.mockResolvedValueOnce({ rows: [{ username: 'testuser' }] })
      // getCommentCount
      mockQuery.mockResolvedValueOnce({ rows: [{ cnt: 1 }] })

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
      mockQuery.mockResolvedValueOnce({ rows: [{ author_id: 'user-1' }] }) // SELECT
      mockQuery.mockResolvedValueOnce({ rows: [] }) // UPDATE

      // act & assert
      await expect(deleteCommunityComment('comment-1', 'user-1')).resolves.toBeUndefined()
    })

    it('评论不存在时抛出 404', async () => {
      // arrange
      mockQuery.mockResolvedValueOnce({ rows: [] }) // SELECT

      // act & assert
      const err = (await deleteCommunityComment('nonexistent', 'user-1').catch(
        (e) => e,
      )) as Error & { status: number }
      expect(err.status).toBe(404)
      expect(err.message).toBe('评论不存在或已删除')
    })

    it('删除他人评论时抛出 403', async () => {
      // arrange
      mockQuery.mockResolvedValueOnce({ rows: [{ author_id: 'other-user' }] }) // SELECT

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
      mockQuery.mockResolvedValueOnce({
        rows: [{ city: '北京', id: 'post-1', original_post_id: null, post_type: 'original' }],
      })
      // ensurePostExists (originalPostId = post-1)
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'post-1' }] })

      // transaction
      const client = createMockClient()
      mockGetClient.mockResolvedValue(client)
      client._query.mockResolvedValueOnce(undefined) // BEGIN
      client._query.mockResolvedValueOnce({ rows: [] }) // INSERT post
      client._query.mockResolvedValueOnce(undefined) // COMMIT

      // getCommunityPostById
      const repostRow = makePostRow({
        id: 'repost-1',
        original_post_id: 'post-1',
        post_type: 'repost',
      })
      mockQuery.mockResolvedValueOnce({ rows: [repostRow] }) // post data
      mockQuery.mockResolvedValueOnce({ rows: [] }) // images for repost
      // getOriginalSummaryMap (original post 'post-1')
      const originalRow = makePostRow({ id: 'post-1' })
      mockQuery.mockResolvedValueOnce({ rows: [originalRow] })
      mockQuery.mockResolvedValueOnce({ rows: [] }) // images for original

      // act
      const result = await repostCommunityPost('post-1', 'author-2', '转发评论')

      // assert
      expect(result.id).toBe('repost-1')
      expect(result.postType).toBe('repost')
    })

    it('转发不存在的帖子时抛出 404', async () => {
      // arrange
      mockQuery.mockResolvedValueOnce({ rows: [] }) // getRepostTarget

      // act & assert
      const err = (await repostCommunityPost('nonexistent', 'author-1').catch(
        (e) => e,
      )) as Error & { status: number }
      expect(err.status).toBe(404)
    })
  })
})
