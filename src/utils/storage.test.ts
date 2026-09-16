import { beforeEach, describe, expect, it } from 'vitest';

import type { ItineraryCache } from './storage';
import { loadItineraryCache, saveItineraryCache } from './storage';

describe('storage loadItineraryCache / saveItineraryCache', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('读取不存在的缓存返回 null', () => {
    const result = loadItineraryCache('北京', 3000, 3);
    expect(result).toBeNull();
  });

  it('写入并读取合法的缓存数据', () => {
    const cacheData: ItineraryCache = {
      accommodation: [],
      attractionRefs: [],
      budgetBreakdown: null,
      itinerary: [
        {
          day: 1,
          morning: {
            description: '参观故宫博物院',
            duration: '3小时',
            spot: '故宫',
          },
          spots: [
            { description: '参观故宫博物院', duration: '3小时', name: '故宫' },
          ],
          title: '故宫深度一日游',
        },
      ],
      nightlife: ['三里屯'],
      tips: ['提前预约故宫门票'],
      weather: null,
    };

    saveItineraryCache('北京', 3000, 3, cacheData);
    const loaded = loadItineraryCache('北京', 3000, 3);

    expect(loaded).toEqual(cacheData);
  });

  it('当缓存格式损坏（非 JSON）时安全返回 null 并清理损坏缓存', () => {
    const key = 'detail_上海_2000_2';
    localStorage.setItem(key, '{ invalid json ...');

    const loaded = loadItineraryCache('上海', 2000, 2);
    expect(loaded).toBeNull();
    expect(localStorage.getItem(key)).toBeNull();
  });

  it('当缓存结构不符合 Schema（缺少必需字段 itinerary）时安全返回 null 并清理旧缓存', () => {
    const key = 'detail_成都_1500_2';
    // 旧格式/缺少 itinerary 字段的脏数据
    localStorage.setItem(
      key,
      JSON.stringify({ city: '成都', tips: ['吃火锅'] }),
    );

    const loaded = loadItineraryCache('成都', 1500, 2);
    expect(loaded).toBeNull();
    expect(localStorage.getItem(key)).toBeNull();
  });
});
