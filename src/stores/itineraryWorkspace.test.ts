import type { ParsedRouteData } from '@/lib/map/route-parser';
import { beforeEach, describe, expect, it } from 'vitest';
import { useItineraryWorkspaceStore } from './itineraryWorkspace';

describe('itineraryWorkspaceStore', () => {
  beforeEach(() => {
    useItineraryWorkspaceStore.getState().clearWorkspace();
  });

  const mockParsedRoute: ParsedRouteData = {
    city: '杭州',
    days: [
      {
        day: 1,
        spots: [{ name: '断桥残雪' }, { name: '白堤' }, { name: '平湖秋月' }],
        title: '西湖环湖经典',
      },
      {
        day: 2,
        spots: [{ name: '灵隐寺' }, { name: '龙井村' }],
        title: '灵隐祈福与茶香',
      },
    ],
    food: ['西湖醋鱼', '东坡肉'],
    routeString: '断桥残雪 ➔ 白堤 ➔ 平湖秋月 ➔ 灵隐寺 ➔ 龙井村',
    spots: [
      { name: '断桥残雪' },
      { name: '白堤' },
      { name: '平湖秋月' },
      { name: '灵隐寺' },
      { name: '龙井村' },
    ],
    summary: '3天2晚慢游',
    tips: ['提前预约灵隐寺'],
    transportMode: 'walking',
  };

  it('能够从 ParsedRouteData 正确初始化多日工作台结构并计算通勤段', () => {
    const store = useItineraryWorkspaceStore.getState();
    store.initFromParsedRoute(mockParsedRoute, '独自一人游杭州3天2晚');

    const state = useItineraryWorkspaceStore.getState();
    expect(state.city).toBe('杭州');
    expect(state.title).toBe('独自一人游杭州3天2晚');
    expect(state.days.length).toBe(2);

    // 检查第 1 天
    const day1 = state.days[0];
    expect(day1.day).toBe(1);
    expect(day1.title).toBe('西湖环湖经典');
    expect(day1.spots.map((s) => s.name)).toEqual([
      '断桥残雪',
      '白堤',
      '平湖秋月',
    ]);
    expect(day1.legs.length).toBe(2);
    expect(day1.legs[0].fromSpotName).toBe('断桥残雪');
    expect(day1.legs[0].toSpotName).toBe('白堤');
    expect(day1.legs[0].distanceKm).toBeGreaterThan(0);
    expect(day1.legs[0].durationText).toBeTruthy();

    // 检查第 2 天
    const day2 = state.days[1];
    expect(day2.day).toBe(2);
    expect(day2.spots.map((s) => s.name)).toEqual(['灵隐寺', '龙井村']);
    expect(day2.legs.length).toBe(1);
  });

  it('支持在当天内调整景点顺序并自动重算通勤', () => {
    const store = useItineraryWorkspaceStore.getState();
    store.initFromParsedRoute(mockParsedRoute);

    // 将第 1 天的索引 0 (断桥残雪) 移动到索引 2
    store.moveSpotInDay(1, 0, 2);

    const day1 = useItineraryWorkspaceStore.getState().days[0];
    expect(day1.spots.map((s) => s.name)).toEqual([
      '白堤',
      '平湖秋月',
      '断桥残雪',
    ]);
    expect(day1.legs[0].fromSpotName).toBe('白堤');
    expect(day1.legs[0].toSpotName).toBe('平湖秋月');
  });

  it('支持删除景点并重算通勤段落', () => {
    const store = useItineraryWorkspaceStore.getState();
    store.initFromParsedRoute(mockParsedRoute);

    // 删除第 1 天的中间景点（白堤）
    store.removeSpotFromDay(1, 1);

    const day1 = useItineraryWorkspaceStore.getState().days[0];
    expect(day1.spots.map((s) => s.name)).toEqual(['断桥残雪', '平湖秋月']);
    expect(day1.legs.length).toBe(1);
    expect(day1.legs[0].fromSpotName).toBe('断桥残雪');
    expect(day1.legs[0].toSpotName).toBe('平湖秋月');
  });

  it('支持添加景点到指定天', () => {
    const store = useItineraryWorkspaceStore.getState();
    store.initFromParsedRoute(mockParsedRoute);

    store.addSpotToDay(1, { name: '雷峰塔' });

    const day1 = useItineraryWorkspaceStore.getState().days[0];
    expect(day1.spots.map((s) => s.name)).toEqual([
      '断桥残雪',
      '白堤',
      '平湖秋月',
      '雷峰塔',
    ]);
    expect(day1.legs.length).toBe(3);
  });

  it('支持将景点移入待安排池并移回', () => {
    const store = useItineraryWorkspaceStore.getState();
    store.initFromParsedRoute(mockParsedRoute);

    // 移入待安排池
    store.moveToUnassigned(1, 0);
    expect(useItineraryWorkspaceStore.getState().unassignedSpots.length).toBe(
      1,
    );
    expect(useItineraryWorkspaceStore.getState().unassignedSpots[0].name).toBe(
      '断桥残雪',
    );
    expect(useItineraryWorkspaceStore.getState().days[0].spots.length).toBe(2);

    // 从待安排池移入第 2 天
    store.addFromUnassignedToDay(0, 2);
    expect(useItineraryWorkspaceStore.getState().unassignedSpots.length).toBe(
      0,
    );
    expect(
      useItineraryWorkspaceStore.getState().days[1].spots.map((s) => s.name),
    ).toContain('断桥残雪');
  });

  it('支持动态增删天数与修改备注', () => {
    const store = useItineraryWorkspaceStore.getState();
    store.initFromParsedRoute(mockParsedRoute);

    store.addDay();
    expect(useItineraryWorkspaceStore.getState().days.length).toBe(3);
    expect(useItineraryWorkspaceStore.getState().selectedDay).toBe(3);

    store.updateDayNotes(1, '注意带防晒霜和雨伞');
    expect(useItineraryWorkspaceStore.getState().days[0].notes).toBe(
      '注意带防晒霜和雨伞',
    );

    store.removeDay(3);
    expect(useItineraryWorkspaceStore.getState().days.length).toBe(2);
  });

  it('生成确定性打卡点 ID 并在重复初始化相同内容时去重防抖', () => {
    const store = useItineraryWorkspaceStore.getState();
    store.initFromParsedRoute(mockParsedRoute, '测试行程');

    const initialDay1Spots =
      useItineraryWorkspaceStore.getState().days[0].spots;
    const id1 = initialDay1Spots[0].id;
    expect(id1).toBeTruthy();

    // 再次以相同路线初始化，应当命中去重防抖，保持引用和 ID 稳定
    store.initFromParsedRoute(mockParsedRoute, '测试行程更新');
    const updatedState = useItineraryWorkspaceStore.getState();
    expect(updatedState.title).toBe('测试行程更新');
    expect(updatedState.days[0].spots[0].id).toBe(id1);
  });

  it('节点应自动关联国内 OTA 预订资源，并支持响应式更新出行人数与酒店预算', () => {
    const store = useItineraryWorkspaceStore.getState();
    store.initFromParsedRoute(mockParsedRoute);

    const state = useItineraryWorkspaceStore.getState();
    const lingyinSpot = state.days[1].spots.find((s) => s.name === '灵隐寺');
    expect(lingyinSpot?.bookingResource).toBeDefined();
    expect(lingyinSpot?.bookingResource?.title).toContain('灵隐寺');
    expect(lingyinSpot?.bookingResource?.tags).toContain('刷身份证入园');

    // 默认出行人数为 1，酒店单价为 320
    expect(state.participantCount).toBe(1);
    expect(state.hotelNightPrice).toBe(320);

    // 修改人数为 2 人情侣出游
    store.setParticipantCount(2);
    store.setHotelNightPrice(450);

    const updated = useItineraryWorkspaceStore.getState();
    expect(updated.participantCount).toBe(2);
    expect(updated.hotelNightPrice).toBe(450);
  });

  it('支持同步与从离线缓存中恢复行程手账', async () => {
    const store = useItineraryWorkspaceStore.getState();
    store.initFromParsedRoute(mockParsedRoute, '高铁离线测试');

    // 手动调用 syncToOfflineCache
    await store.syncToOfflineCache();

    // 清空当前工作台模拟重新加载或无网进入
    store.clearWorkspace();
    expect(useItineraryWorkspaceStore.getState().days.length).toBe(0);

    // 从离线手账恢复
    const restored = await store.restoreFromOfflineCache();
    expect(restored).toBe(true);

    const after = useItineraryWorkspaceStore.getState();
    expect(after.city).toBe('杭州');
    expect(after.title).toBe('高铁离线测试');
    expect(after.days.length).toBe(2);
  });
});
