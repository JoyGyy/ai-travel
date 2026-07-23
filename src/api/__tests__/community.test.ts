import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  createCommunityPost,
  fetchCommunityPosts,
  likeCommunityPost,
  unlikeCommunityPost,
  uploadCommunityImages,
} from '../community'

describe('community api', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  function mockFetch(data: unknown) {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => data,
    })
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
  }

  it('fetchCommunityPosts 会拼接筛选参数', async () => {
    const fetchMock = mockFetch({ success: true, data: { items: [], total: 0, page: 1, pageSize: 10 } })

    await fetchCommunityPosts({ page: 2, pageSize: 10, city: '成都', withItinerary: true })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/community/posts?page=2&pageSize=10&city=%E6%88%90%E9%83%BD&withItinerary=true',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('createCommunityPost 使用 POST 和认证', async () => {
    localStorage.setItem('travel_auth', JSON.stringify({ state: { token: 'token-1' } }))
    const fetchMock = mockFetch({ success: true, data: { id: 'post-1' } })

    await createCommunityPost({ content: '分享一条路线' })

    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/community/posts', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer token-1' }),
      body: JSON.stringify({ content: '分享一条路线' }),
    }))
  })

  it('likeCommunityPost 和 unlikeCommunityPost 使用正确方法', async () => {
    const fetchMock = mockFetch({ success: true, data: { likedByMe: true, likeCount: 1 } })

    await likeCommunityPost('post-1')
    await unlikeCommunityPost('post-1')

    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/community/posts/post-1/like', expect.objectContaining({ method: 'POST' }))
    expect(fetchMock).toHaveBeenNthCalledWith(4, '/api/community/posts/post-1/like', expect.objectContaining({ method: 'DELETE' }))
  })

  it('uploadCommunityImages 使用 FormData 且不设置 JSON Content-Type', async () => {
    const fetchMock = mockFetch({ success: true, data: { images: [] } })
    const file = new File(['image'], 'trip.webp', { type: 'image/webp' })

    await uploadCommunityImages([file])

    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/community/uploads/images', expect.objectContaining({
      method: 'POST',
      body: expect.any(FormData),
      headers: expect.not.objectContaining({ 'Content-Type': 'application/json' }),
    }))
  })
})
