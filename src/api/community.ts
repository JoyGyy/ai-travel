import type {
  CommunityCommentFilters,
  CommunityCommentListData,
  CommunityImage,
  CommunityPost,
  CommunityPostFilters,
  CommunityPostListData,
  CreateCommunityCommentInput,
  CreateCommunityCommentResult,
  CreateCommunityPostInput,
  LikeCommunityPostResult,
} from '@/types/community'

import { hasAuthToken, request } from './client'

interface DataResponse<T> {
  data: T
}

/** 创建帖子评论 */
export async function createCommunityComment(
  postId: string,
  input: CreateCommunityCommentInput,
): Promise<CreateCommunityCommentResult> {
  const res = await request<DataResponse<CreateCommunityCommentResult>>(
    `/api/community/posts/${postId}/comments`,
    { auth: true, body: input, method: 'POST' },
  )
  return res.data
}

/** 创建社区帖子 */
export async function createCommunityPost(input: CreateCommunityPostInput): Promise<CommunityPost> {
  const res = await request<DataResponse<CommunityPost>>('/api/community/posts', {
    auth: true,
    body: input,
    method: 'POST',
  })
  return res.data
}

/** 删除自己的评论 */
export async function deleteCommunityComment(commentId: string): Promise<void> {
  await request(`/api/community/comments/${commentId}`, { auth: true, method: 'DELETE' })
}

/** 删除社区帖子 */
export async function deleteCommunityPost(id: string): Promise<void> {
  await request(`/api/community/posts/${id}`, { auth: true, method: 'DELETE' })
}

/** 获取帖子评论 */
export async function fetchCommunityComments(
  postId: string,
  filters: CommunityCommentFilters = {},
): Promise<CommunityCommentListData> {
  const res = await request<DataResponse<CommunityCommentListData>>(
    `/api/community/posts/${postId}/comments${buildCommentQuery(filters)}`,
    { auth: hasAuthToken() },
  )
  return res.data
}

/** 获取社区帖子详情 */
export async function fetchCommunityPost(id: string): Promise<CommunityPost> {
  const res = await request<DataResponse<CommunityPost>>(`/api/community/posts/${id}`, {
    auth: hasAuthToken(),
  })
  return res.data
}

/** 获取社区帖子列表 */
export async function fetchCommunityPosts(
  filters: CommunityPostFilters = {},
): Promise<CommunityPostListData> {
  const res = await request<DataResponse<CommunityPostListData>>(
    `/api/community/posts${buildPostQuery(filters)}`,
    { auth: hasAuthToken() },
  )
  return res.data
}

/** 点赞帖子 */
export async function likeCommunityPost(id: string): Promise<LikeCommunityPostResult> {
  const res = await request<DataResponse<LikeCommunityPostResult>>(
    `/api/community/posts/${id}/like`,
    { auth: true, method: 'POST' },
  )
  return res.data
}

/** 转发社区帖子 */
export async function repostCommunityPost(postId: string, content = ''): Promise<CommunityPost> {
  const res = await request<DataResponse<CommunityPost>>(`/api/community/posts/${postId}/repost`, {
    auth: true,
    body: { content },
    method: 'POST',
  })
  return res.data
}

/** 取消点赞帖子 */
export async function unlikeCommunityPost(id: string): Promise<LikeCommunityPostResult> {
  const res = await request<DataResponse<LikeCommunityPostResult>>(
    `/api/community/posts/${id}/like`,
    { auth: true, method: 'DELETE' },
  )
  return res.data
}

/** 上传社区图片 */
export async function uploadCommunityImages(files: File[]): Promise<CommunityImage[]> {
  const formData = new FormData()
  for (const file of files) formData.append('files', file)

  const res = await request<DataResponse<{ images: CommunityImage[] }>>(
    '/api/community/uploads/images',
    { auth: true, body: formData, method: 'POST' },
  )
  return res.data.images
}

function buildCommentQuery(filters: CommunityCommentFilters = {}) {
  const params = new URLSearchParams()
  if (filters.page)
    params.set('page', String(filters.page))
  if (filters.pageSize)
    params.set('pageSize', String(filters.pageSize))

  const query = params.toString()
  return query ? `?${query}` : ''
}

function buildPostQuery(filters: CommunityPostFilters = {}) {
  const params = new URLSearchParams()
  if (filters.page)
    params.set('page', String(filters.page))
  if (filters.pageSize)
    params.set('pageSize', String(filters.pageSize))
  if (filters.city)
    params.set('city', filters.city)
  if (filters.withItinerary)
    params.set('withItinerary', 'true')
  if (filters.authorId)
    params.set('authorId', filters.authorId)

  const query = params.toString()
  return query ? `?${query}` : ''
}
