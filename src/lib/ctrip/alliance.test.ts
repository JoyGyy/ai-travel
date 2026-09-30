import { beforeEach, describe, expect, it } from 'vitest';

import {
  attachCtripAllianceParams,
  buildCtripCarLink,
  buildCtripFlightLink,
  buildCtripHotelLink,
  buildCtripTicketLink,
  buildCtripTrainLink,
  DEFAULT_CTRIP_ALLIANCE_ID,
  DEFAULT_CTRIP_SID,
  getCtripAllianceConfig,
} from './alliance';

describe('Ctrip Alliance (携程开放联盟) 引擎', () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_CTRIP_ALLIANCE_ID;
    delete process.env.NEXT_PUBLIC_CTRIP_SID;
  });

  it('默认情况下应返回兜底 allianceid 与 sid', () => {
    const config = getCtripAllianceConfig();
    expect(config.allianceid).toBe(DEFAULT_CTRIP_ALLIANCE_ID);
    expect(config.sid).toBe(DEFAULT_CTRIP_SID);
  });

  it('读取环境变量中的自定义联盟参数', () => {
    process.env.NEXT_PUBLIC_CTRIP_ALLIANCE_ID = '999888';
    process.env.NEXT_PUBLIC_CTRIP_SID = 'my_custom_channel';

    const config = getCtripAllianceConfig();
    expect(config.allianceid).toBe('999888');
    expect(config.sid).toBe('my_custom_channel');
  });

  it('buildCtripTicketLink 应生成合法的门票直达链接与追踪参数', () => {
    const link = buildCtripTicketLink({
      city: '成都',
      spotName: '大熊猫繁育研究基地',
    });

    const url = new URL(link);
    expect(url.origin).toBe('https://m.ctrip.com');
    expect(url.pathname).toBe('/webapp/ticket/ticketdetail/search.html');
    expect(url.searchParams.get('keyword')).toBe('成都 大熊猫繁育研究基地');
    expect(url.searchParams.get('allianceid')).toBe(DEFAULT_CTRIP_ALLIANCE_ID);
    expect(url.searchParams.get('sid')).toBe('attraction_ticket');
  });

  it('buildCtripHotelLink 应生成合法的酒店直达与入住离店参数', () => {
    const link = buildCtripHotelLink({
      checkInDate: '2026-10-01',
      checkOutDate: '2026-10-03',
      city: '杭州',
      keyword: '西湖景区周边',
      sid: 'itinerary_hotel_card',
    });

    const url = new URL(link);
    expect(url.origin).toBe('https://m.ctrip.com');
    expect(url.pathname).toBe('/webapp/hotel/hotellist');
    expect(url.searchParams.get('cityName')).toBe('杭州');
    expect(url.searchParams.get('keywords')).toBe('西湖景区周边');
    expect(url.searchParams.get('checkInDate')).toBe('2026-10-01');
    expect(url.searchParams.get('checkOutDate')).toBe('2026-10-03');
    expect(url.searchParams.get('sid')).toBe('itinerary_hotel_card');
  });

  it('buildCtripTrainLink 应生成合法的出发与到达站查询链接', () => {
    const link = buildCtripTrainLink({
      arrival: '成都东',
      date: '2026-10-01',
      departure: '西安北',
    });

    const url = new URL(link);
    expect(url.origin).toBe('https://m.ctrip.com');
    expect(url.pathname).toBe('/webapp/train/');
    expect(url.searchParams.get('dStation')).toBe('西安北');
    expect(url.searchParams.get('aStation')).toBe('成都东');
    expect(url.searchParams.get('date')).toBe('2026-10-01');
    expect(url.searchParams.get('sid')).toBe('train_ticket');
  });

  it('buildCtripFlightLink 应生成机票查询链接', () => {
    const link = buildCtripFlightLink({
      arrival: '三亚',
      date: '2026-10-01',
      departure: '北京',
    });

    const url = new URL(link);
    expect(url.searchParams.get('dcity')).toBe('北京');
    expect(url.searchParams.get('acity')).toBe('三亚');
    expect(url.searchParams.get('ddate')).toBe('2026-10-01');
  });

  it('buildCtripCarLink 应生成用车租车直达链接', () => {
    const link = buildCtripCarLink({ city: '大理' });
    const url = new URL(link);
    expect(url.searchParams.get('city')).toBe('大理');
    expect(url.searchParams.get('sid')).toBe('car_rental');
  });

  it('attachCtripAllianceParams 应为已有 URL 追加联盟追踪参数且不重复覆盖', () => {
    const base = 'https://m.ctrip.com/webapp/ticket/dest/t230.html?foo=bar';
    const enriched = attachCtripAllianceParams(base, {
      ouid: 'user_hash_123',
      sid: 'custom_banner',
    });

    const url = new URL(enriched);
    expect(url.searchParams.get('foo')).toBe('bar');
    expect(url.searchParams.get('allianceid')).toBe(DEFAULT_CTRIP_ALLIANCE_ID);
    expect(url.searchParams.get('sid')).toBe('custom_banner');
    expect(url.searchParams.get('ouid')).toBe('user_hash_123');
  });
});
