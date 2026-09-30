import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  batchSyncAmapCities,
  extractAmapAttractionTags,
  fetchAmapAttractionsByCity,
  inferTicketPrice,
  normalizeCityName,
  transformAmapPoiToAttraction,
} from './amapAttractionSync';

describe('amapAttractionSync 高德地图 POI 景点批量同步引擎', () => {
  const originalEnv = process.env.AMAP_API_KEY;

  beforeEach(() => {
    process.env.AMAP_API_KEY = 'test-amap-key';
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.AMAP_API_KEY = originalEnv;
  });

  it('normalizeCityName 正确去除行政区划后缀', () => {
    expect(normalizeCityName('杭州市')).toBe('杭州');
    expect(normalizeCityName('成都市')).toBe('成都');
    expect(normalizeCityName('锡林郭勒盟')).toBe('锡林郭勒');
    expect(normalizeCityName('延边朝鲜族自治州')).toBe('延边朝鲜族自治州');
  });

  it('extractAmapAttractionTags 正确提炼 5A、世界遗产与文化标签', () => {
    const poi5A = {
      adname: '西湖区',
      id: 'B001',
      keytag: '5A景区',
      name: '西湖风景名胜区',
      type: '风景名胜;风景名胜;国家级景点;世界遗产',
    };
    const tags = extractAmapAttractionTags(poi5A);
    expect(tags).toContain('5A景区');
    expect(tags).toContain('世界遗产');
    expect(tags).toContain('国家名胜');
    expect(tags).toContain('西湖区');
  });

  it('inferTicketPrice 能够智能推断免费景点与付费门票', () => {
    // 免费地标
    const freePoi = {
      id: 'B002',
      keytag: '免费开放',
      name: '杭州西湖白堤',
    };
    expect(inferTicketPrice(freePoi)).toEqual({
      priceText: '免费开放',
      ticketType: 'free',
    });

    // 明确保费景点
    const paidPoi = {
      biz_ext: { cost: '120' },
      id: 'B003',
      name: '千岛湖中心湖区',
    };
    expect(inferTicketPrice(paidPoi)).toEqual({
      priceText: '约¥120/人',
      ticketType: 'paid',
    });
  });

  it('transformAmapPoiToAttraction 正确转换并自动装配携程联盟直达出票链路', () => {
    const rawPoi = {
      adname: '淳安县',
      address: '千岛湖镇阳光路1号',
      biz_ext: {
        cost: '130',
        open_time: '08:00-17:00',
        rating: '4.8',
      },
      cityname: '杭州市',
      id: 'B0FFFYF0GP',
      keytag: '5A景区',
      location: '119.055172,29.545082',
      name: '千岛湖风景区',
      photos: [{ url: 'http://store.is.autonavi.com/test.jpg' }],
    };

    const attraction = transformAmapPoiToAttraction(rawPoi, '杭州');

    expect(attraction.id).toBe('amap_b0fffyf0gp');
    expect(attraction.name).toBe('千岛湖风景区');
    expect(attraction.city).toBe('杭州');
    expect(attraction.address).toBe('千岛湖镇阳光路1号');
    expect(attraction.coverImage).toBe(
      'https://store.is.autonavi.com/test.jpg',
    );
    expect(attraction.ticketType).toBe('paid');
    expect(attraction.tags).toContain('5A景区');

    // 核心断言：自动装配携程开放联盟官方 Tangram 门票直达预订链接
    expect(attraction.bookingLinks.ctrip).toBeDefined();
    const ctripUrl = new URL(attraction.bookingLinks.ctrip!);
    expect(ctripUrl.origin).toBe('https://m.ctrip.com');
    expect(ctripUrl.pathname).toBe('/tangram/ticket');
    expect(ctripUrl.searchParams.get('keyword')).toBe('杭州 千岛湖风景区');
    expect(ctripUrl.searchParams.get('allianceid')).toBe('4897000');
  });

  it('fetchAmapAttractionsByCity 成功请求高德接口并返回格式化景点列表', async () => {
    const mockApiResponse = {
      count: '1',
      infocode: '10000',
      pois: [
        {
          adname: '西湖区',
          address: '南山路15号',
          cityname: '杭州市',
          id: 'B023B0TEST',
          keytag: '5A景区',
          name: '雷峰塔景区',
          photos: [{ url: 'https://store.is.autonavi.com/leifeng.jpg' }],
          type: '风景名胜;风景名胜;国家级景点',
        },
      ],
      status: '1',
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });
    globalThis.fetch = fetchMock;

    const res = await fetchAmapAttractionsByCity({
      city: '杭州',
      limit: 10,
    });

    expect(res.city).toBe('杭州');
    expect(res.count).toBe(1);
    expect(res.items[0]?.name).toBe('雷峰塔景区');
    const ctripUrl = new URL(res.items[0]?.bookingLinks.ctrip || '');
    expect(ctripUrl.searchParams.get('keyword')).toBe('杭州 雷峰塔景区');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = fetchMock.mock.calls[0]![0] as string;
    expect(calledUrl).toContain('https://restapi.amap.com/v3/place/text');
    expect(calledUrl).toContain('city=%E6%9D%AD%E5%B7%9E');
  });

  it('当缺少 AMAP_API_KEY 时应主动抛出明确错误提示', async () => {
    delete process.env.AMAP_API_KEY;

    await expect(fetchAmapAttractionsByCity({ city: '杭州' })).rejects.toThrow(
      '缺少 AMAP_API_KEY 配置',
    );
  });

  it('batchSyncAmapCities 能够批量同步多城市并聚合结果与错误', async () => {
    const fetchMock = vi.fn().mockImplementation((urlStr: string) => {
      if (urlStr.includes('city=%E6%88%90%E9%83%BD')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            count: '1',
            infocode: '10000',
            pois: [{ id: 'CD01', name: '宽窄巷子', cityname: '成都市' }],
            status: '1',
          }),
        });
      }
      return Promise.reject(new Error('网络连接超时'));
    });
    globalThis.fetch = fetchMock;

    const batchRes = await batchSyncAmapCities({
      cities: ['成都', '故障城市'],
      limitPerCity: 5,
    });

    expect(batchRes.results['成都']).toBeDefined();
    expect(batchRes.results['成都']?.[0]?.name).toBe('宽窄巷子');
    expect(batchRes.errors.length).toBe(1);
    expect(batchRes.errors[0]?.city).toBe('故障城市');
  });
});
