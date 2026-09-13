import type {
  DayBudgetBreakdown,
  DomesticBookingResource,
  PriceTrendPoint,
} from '@/types/booking';

/**
 * 针对国内知名 5A/4A 景区及热门景点的实名预约与携程门票预售规则库
 */
interface KnownSpotPreset {
  bookingNote: string;
  coupon: number;
  discountPrice: number;
  keywords: string[];
  originalPrice: number;
  provider: DomesticBookingResource['provider'];
  rating: number;
  sales: string;
  stock: DomesticBookingResource['stockStatus'];
  tags: string[];
}

const KNOWN_SPOT_PRESETS: KnownSpotPreset[] = [
  {
    keywords: ['西湖', '断桥', '苏堤', '花港观鱼'],
    originalPrice: 0,
    discountPrice: 0,
    coupon: 0,
    provider: '官方直销',
    stock: 'available',
    tags: ['国家5A', '免大门票', '全天开放'],
    bookingNote: '环湖免费开放，部分小景点（如三潭印月游船）需另行购票',
    sales: '近30天热搜 50万+',
    rating: 4.9,
  },
  {
    keywords: ['灵隐寺', '飞来峰'],
    originalPrice: 75,
    discountPrice: 70,
    coupon: 5,
    provider: '携程自营',
    stock: 'booking_required',
    tags: ['祈福胜地', '刷身份证入园', '携程专属通关'],
    bookingNote: '需提前预约灵隐飞来峰景区大门票，寺院香火券现场办理',
    sales: '近30天预订 4.8万+',
    rating: 4.8,
  },
  {
    keywords: ['故宫', '紫禁城'],
    originalPrice: 60,
    discountPrice: 60,
    coupon: 0,
    provider: '官方直销',
    stock: 'tight',
    tags: ['实名制预约', '世界文化遗产', '提前7天20点抢票'],
    bookingNote: '每日限流，需提前7天通过官方实名预约，刷二代身份证原件入园',
    sales: '每日预约爆满',
    rating: 4.9,
  },
  {
    keywords: ['兵马俑', '秦始皇陵'],
    originalPrice: 120,
    discountPrice: 120,
    coupon: 10,
    provider: '携程自营',
    stock: 'booking_required',
    tags: ['人工讲解拼团', '快速出票', '免费语音导览'],
    bookingNote: '包含秦始皇帝陵博物院（兵马俑+丽山园），需按分时段预约入场',
    sales: '近30天预订 3.5万+',
    rating: 4.8,
  },
  {
    keywords: ['大熊猫', '熊猫基地'],
    originalPrice: 55,
    discountPrice: 53,
    coupon: 5,
    provider: '携程自营',
    stock: 'available',
    tags: ['萌宠顶流', '即买即用', '扫码入园'],
    bookingNote: '建议上午早开园入场（大熊猫早晨活跃），可凭电子二维码扫码入园',
    sales: '近30天预订 6.2万+',
    rating: 4.8,
  },
  {
    keywords: ['迪士尼', '上海迪士尼'],
    originalPrice: 475,
    discountPrice: 435,
    coupon: 40,
    provider: '官方直销',
    stock: 'available',
    tags: ['提前1天可退', '尊享卡可选', '携程金钻特惠'],
    bookingNote: '入园需出示购票凭证及购票时登记的有效身份证件原件',
    sales: '月销量 10万+',
    rating: 4.8,
  },
];

/**
 * 根据景点名称、城市与预估价格生成国内 OTA 预订微卡数据
 */
export function resolveSpotBookingResource(
  spotName: string,
  city: string,
  ticketType: 'free' | 'paid' = 'free',
  rawPriceText?: string,
): DomesticBookingResource {
  // 1. 优先从精选 5A/热门景点库匹配
  const matchedPreset = KNOWN_SPOT_PRESETS.find((preset) =>
    preset.keywords.some((kw) => spotName.includes(kw)),
  );

  if (matchedPreset) {
    return {
      id: `booking-${encodeURIComponent(spotName)}`,
      type: 'ticket',
      title: `${spotName}·景区门票/预约`,
      provider: matchedPreset.provider,
      originalPrice: matchedPreset.originalPrice,
      discountPrice: matchedPreset.discountPrice,
      couponAmount: matchedPreset.coupon,
      stockStatus: matchedPreset.stock,
      tags: matchedPreset.tags,
      bookingNote: matchedPreset.bookingNote,
      salesVolume: matchedPreset.sales,
      ratingScore: matchedPreset.rating,
      bookingUrl: `https://m.ctrip.com/webapp/ticket/ticketdetail/search.html?keyword=${encodeURIComponent(
        spotName,
      )}`,
    };
  }

  // 2. 免费景点规则
  if (ticketType === 'free' || rawPriceText?.includes('免费')) {
    return {
      id: `booking-${encodeURIComponent(spotName)}`,
      type: 'ticket',
      title: `${spotName}·预约入园`,
      provider: '官方直销',
      originalPrice: 0,
      discountPrice: 0,
      stockStatus: 'available',
      tags: ['免门票', '开放式游览', '绿色通道'],
      bookingNote: '该景点无需购买门票，建议错开节假日高峰期入园',
      salesVolume: '热门打卡地',
      ratingScore: 4.7,
      bookingUrl: `https://m.ctrip.com/webapp/ticket/ticketdetail/search.html?keyword=${encodeURIComponent(
        spotName,
      )}`,
    };
  }

  // 3. 通用付费景点规则
  // 从原始价格文本尝试解析数字 (如 "¥80" -> 80)
  const numericPriceMatch = rawPriceText?.match(/\d+/);
  const parsedPrice = numericPriceMatch
    ? parseInt(numericPriceMatch[0], 10)
    : 60;
  const discountPrice = Math.max(0, parsedPrice - 5);

  return {
    id: `booking-${encodeURIComponent(spotName)}`,
    type: 'ticket',
    title: `${spotName}·成人全价票`,
    provider: '携程自营',
    originalPrice: parsedPrice,
    discountPrice,
    couponAmount: parsedPrice > 50 ? 5 : 0,
    stockStatus: 'available',
    tags: ['极速出票', '支持退改', '携程保障'],
    bookingNote: '预订成功后凭短信电子码或身份证至景区闸机直接核销',
    salesVolume: '月订 3000+',
    ratingScore: 4.6,
    bookingUrl: `https://m.ctrip.com/webapp/ticket/ticketdetail/search.html?keyword=${encodeURIComponent(
      spotName,
    )}`,
  };
}

/**
 * 估算市内行程段（打车/公交/步行）开销
 */
export function estimateLegTransitCost(
  mode: 'driving' | 'transit' | 'walking',
  distanceKm: number,
): number {
  if (mode === 'walking') {
    return 0;
  }
  if (mode === 'transit') {
    // 市内地铁/公交通常 2~8 元
    if (distanceKm <= 6) return 3;
    if (distanceKm <= 15) return 5;
    return 7;
  }
  // driving: 国内网约车/出租车计费估算（起步价约13元含3km，之后约2.6元/km）
  if (distanceKm <= 3) return 14;
  return Math.round(14 + (distanceKm - 3) * 2.6);
}

/**
 * 计算单日出行开销与优惠明细
 * @param spotsDay 包含当前日景点的预订资源列表
 * @param totalTransitCost 今日交通估算开销
 * @param hotelNightPrice 今日住宿参考估算 (默认 320 元)
 * @param participantCount 出行人数 (默认为 1)
 */
export function calculateDayBudgetBreakdown({
  bookingResources,
  transitCost = 0,
  hotelNightPrice = 320,
  participantCount = 1,
}: {
  bookingResources: DomesticBookingResource[];
  hotelNightPrice?: number;
  participantCount?: number;
  transitCost?: number;
}): DayBudgetBreakdown {
  const safeParticipants = Math.max(1, participantCount);

  // 1. 门票按人头累加
  let singlePersonTicketCost = 0;
  let totalCouponSavings = 0;

  bookingResources.forEach((res) => {
    singlePersonTicketCost += res.discountPrice;
    if (res.couponAmount) {
      totalCouponSavings += res.couponAmount;
    }
  });

  const totalTicketsCost = singlePersonTicketCost * safeParticipants;

  // 2. 交通：打车若有多人，一辆车平摊或直接按车次算；公交按人头算
  // 这里简化模型：市内打车按 1 次计算，公交/高铁视作已按人头累计，此处直接使用传入值
  const totalTransit = transitCost;

  // 3. 酒店：情侣/双人出行通常共住一间（1-2人=1间房，3-4人=2间房）
  const roomCount = Math.ceil(safeParticipants / 2);
  const totalHotel = hotelNightPrice * roomCount;

  // 单人基础参考总花费 (单人票 + 酒店平摊 + 交通平摊)
  const subtotal = Math.round(
    singlePersonTicketCost +
      totalHotel / safeParticipants +
      totalTransit / safeParticipants,
  );

  // 实付总计 (所有总和减去单次优惠券抵扣)
  const grandTotal = Math.max(
    0,
    totalTicketsCost + totalHotel + totalTransit - totalCouponSavings,
  );

  return {
    ticketsCost: totalTicketsCost,
    hotelCost: totalHotel,
    transitCost: totalTransit,
    couponDiscount: totalCouponSavings,
    subtotal,
    participantCount: safeParticipants,
    grandTotal,
  };
}

/**
 * 生成未来 7 天内的高铁 vs 机票 vs 酒店价格走势（周末与节假日波峰）
 */
export function generateDomesticPriceTrends(
  baseDate: Date = new Date(),
): PriceTrendPoint[] {
  const points: PriceTrendPoint[] = [];
  const daysOfWeek = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  for (let i = 0; i < 7; i++) {
    const current = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dayIndex = current.getDay();
    const isWeekend = dayIndex === 0 || dayIndex === 5 || dayIndex === 6; // 周五、周六、周日为出行波峰

    const month = String(current.getMonth() + 1).padStart(2, '0');
    const date = String(current.getDate()).padStart(2, '0');
    const dateStr = `${current.getFullYear()}-${month}-${date}`;
    const dayName = daysOfWeek[dayIndex];

    // 高铁二等座票价基本固定，但周末可能有热门车次售罄溢价
    const trainPrice = isWeekend ? 315 : 295;
    // 飞机票价在周末上浮 30%~50%
    const flightPrice = isWeekend ? 680 : 420;
    // 酒店价格周末上浮 20%~40%
    const hotelAvgPrice = isWeekend ? 460 : 320;

    points.push({
      date: dateStr,
      dayOfWeek: dayName,
      label: `${month}-${date} (${dayName})`,
      trainPrice,
      flightPrice,
      hotelAvgPrice,
      isPeak: isWeekend,
    });
  }

  return points;
}
