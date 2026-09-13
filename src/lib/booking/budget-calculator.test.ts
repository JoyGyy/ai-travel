import { describe, expect, it } from 'vitest';
import {
  calculateDayBudgetBreakdown,
  estimateLegTransitCost,
  generateDomesticPriceTrends,
  resolveSpotBookingResource,
} from './budget-calculator';

describe('budget-calculator', () => {
  describe('resolveSpotBookingResource', () => {
    it('应精准匹配西湖等 5A 免费景区并标明预约须知', () => {
      const res = resolveSpotBookingResource('杭州西湖断桥残雪', '杭州', 'free');
      expect(res.discountPrice).toBe(0);
      expect(res.originalPrice).toBe(0);
      expect(res.tags).toContain('国家5A');
      expect(res.bookingNote).toContain('环湖免费开放');
      expect(res.provider).toBe('官方直销');
    });

    it('应精准匹配灵隐寺飞来峰专属预售规则', () => {
      const res = resolveSpotBookingResource('灵隐寺飞来峰', '杭州', 'paid');
      expect(res.originalPrice).toBe(75);
      expect(res.discountPrice).toBe(70);
      expect(res.couponAmount).toBe(5);
      expect(res.stockStatus).toBe('booking_required');
      expect(res.tags).toContain('刷身份证入园');
    });

    it('应精准匹配故宫并提示提前7天实名预约', () => {
      const res = resolveSpotBookingResource('北京故宫博物院', '北京', 'paid');
      expect(res.originalPrice).toBe(60);
      expect(res.stockStatus).toBe('tight');
      expect(res.bookingNote).toContain('提前7天');
    });

    it('对于未在预设库的通用付费景点能解析文本价格', () => {
      const res = resolveSpotBookingResource('某特色古镇', '嘉兴', 'paid', '¥85/人');
      expect(res.originalPrice).toBe(85);
      expect(res.discountPrice).toBe(80);
      expect(res.provider).toBe('携程自营');
      expect(res.bookingUrl).toContain('m.ctrip.com');
    });
  });

  describe('estimateLegTransitCost', () => {
    it('步行通勤开销应为 0', () => {
      expect(estimateLegTransitCost('walking', 3.5)).toBe(0);
    });

    it('公交地铁通勤应根据里程阶梯计价', () => {
      expect(estimateLegTransitCost('transit', 4)).toBe(3);
      expect(estimateLegTransitCost('transit', 12)).toBe(5);
      expect(estimateLegTransitCost('transit', 25)).toBe(7);
    });

    it('自驾/网约车打车起步价与里程费估算', () => {
      expect(estimateLegTransitCost('driving', 2.5)).toBe(14);
      expect(estimateLegTransitCost('driving', 10)).toBe(Math.round(14 + 7 * 2.6));
    });
  });

  describe('calculateDayBudgetBreakdown', () => {
    it('单人出行应正确汇总门票、酒店、交通及优惠券', () => {
      const spot1 = resolveSpotBookingResource('灵隐寺', '杭州', 'paid');
      const breakdown = calculateDayBudgetBreakdown({
        bookingResources: [spot1],
        transitCost: 20,
        hotelNightPrice: 300,
        participantCount: 1,
      });

      // 门票 70，酒店 300，交通 20，优惠券 5
      expect(breakdown.ticketsCost).toBe(70);
      expect(breakdown.hotelCost).toBe(300);
      expect(breakdown.transitCost).toBe(20);
      expect(breakdown.couponDiscount).toBe(5);
      expect(breakdown.participantCount).toBe(1);
      // 实付总计 = 70 + 300 + 20 - 5 = 385
      expect(breakdown.grandTotal).toBe(385);
    });

    it('2人情侣/双人出行时，门票双倍但酒店只需 1 间房', () => {
      const spot1 = resolveSpotBookingResource('灵隐寺', '杭州', 'paid');
      const breakdown = calculateDayBudgetBreakdown({
        bookingResources: [spot1],
        transitCost: 30,
        hotelNightPrice: 300,
        participantCount: 2,
      });

      // 门票 70 * 2 = 140，酒店 1 间 = 300，交通 30，优惠 5
      expect(breakdown.ticketsCost).toBe(140);
      expect(breakdown.hotelCost).toBe(300);
      expect(breakdown.grandTotal).toBe(140 + 300 + 30 - 5);
    });
  });

  describe('generateDomesticPriceTrends', () => {
    it('应生成未来 7 天的走势，周末点位标记为 isPeak 并上浮机票酒店价格', () => {
      const trends = generateDomesticPriceTrends(new Date('2026-05-01T00:00:00Z'));
      expect(trends).toHaveLength(7);
      const friday = trends[0]; // 2026-05-01 is Friday
      expect(friday.isPeak).toBe(true);
      expect(friday.flightPrice).toBeGreaterThan(450);
      expect(friday.hotelAvgPrice).toBeGreaterThan(350);
    });
  });
});
