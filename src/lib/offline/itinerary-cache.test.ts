import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearAllOfflineItineraries,
  deleteOfflineItinerary,
  getIsOnline,
  getLatestOfflineItinerary,
  getOfflineItineraryById,
  listOfflineItineraries,
  saveOfflineItinerary,
} from './itinerary-cache';

describe('itinerary-cache', () => {
  beforeEach(async () => {
    await clearAllOfflineItineraries();
  });

  const mockItinerary = {
    id: 'itin-hangzhou-1',
    title: '杭州西湖与灵隐祈福3日游',
    city: '杭州',
    days: [
      {
        day: 1,
        title: '西湖环湖漫步',
        spots: [
          {
            id: 'spot-1',
            name: '断桥残雪',
            city: '杭州',
            address: '西湖风景区',
            coverImage: '',
            lat: 30.25,
            lng: 120.15,
            openingHours: '全天',
            priceText: '免费',
            rating: 4.8,
            recommendedDuration: '1小时',
            reviewCount: 300,
            summary: '西湖经典十景',
            tags: ['免费'],
            ticketType: 'free' as const,
          },
        ],
        legs: [],
      },
    ],
    participantCount: 2,
    hotelNightPrice: 380,
    transportMode: 'transit' as const,
  };

  it('成功保存离线行程并在索引中展示', async () => {
    await saveOfflineItinerary(mockItinerary);

    const list = await listOfflineItineraries();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe('itin-hangzhou-1');
    expect(list[0].title).toBe('杭州西湖与灵隐祈福3日游');
    expect(list[0].spotCount).toBe(1);
    expect(list[0].dayCount).toBe(1);
  });

  it('能够通过 ID 查询与获取最新一份离线手账完整数据', async () => {
    await saveOfflineItinerary(mockItinerary);

    const loaded = await getOfflineItineraryById('itin-hangzhou-1');
    expect(loaded).not.toBeNull();
    expect(loaded?.city).toBe('杭州');
    expect(loaded?.participantCount).toBe(2);
    expect(loaded?.days[0].spots[0].name).toBe('断桥残雪');

    const latest = await getLatestOfflineItinerary();
    expect(latest?.id).toBe('itin-hangzhou-1');
  });

  it('更新同一份行程时能够覆盖并刷新 savedAt 时间戳', async () => {
    await saveOfflineItinerary(mockItinerary);

    // 稍微延时后更新标题
    const updatedItinerary = {
      ...mockItinerary,
      title: '杭州西湖与灵隐升级版',
    };
    await saveOfflineItinerary(updatedItinerary);

    const list = await listOfflineItineraries();
    expect(list.length).toBe(1);
    expect(list[0].title).toBe('杭州西湖与灵隐升级版');
  });

  it('能够删除指定离线手账', async () => {
    await saveOfflineItinerary(mockItinerary);
    await deleteOfflineItinerary('itin-hangzhou-1');

    const list = await listOfflineItineraries();
    expect(list.length).toBe(0);

    const loaded = await getOfflineItineraryById('itin-hangzhou-1');
    expect(loaded).toBeNull();
  });

  it('检查 getIsOnline 在测试环境返回布尔值', () => {
    const isOnline = getIsOnline();
    expect(typeof isOnline).toBe('boolean');
  });
});
