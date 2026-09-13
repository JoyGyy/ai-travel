/**
 * 国内 OTA 商业预订与预算相关类型定义 (对标携程 Ctrip 业务大盘)
 */

export type DomesticResourceType =
  | 'ticket'
  | 'hotel'
  | 'train'
  | 'flight'
  | 'taxi';

export type StockStatusType =
  | 'available'
  | 'tight'
  | 'booking_required'
  | 'sold_out';

export interface DomesticBookingResource {
  id: string;
  type: DomesticResourceType;
  title: string;
  provider: '携程自营' | '官方直销' | '铁路12306官方' | '高德打车' | '携程优选';
  originalPrice: number; // 原门市价 / 全价票 (RMB 元)
  discountPrice: number; // 携程特惠 / 提前预订价 (RMB 元)
  couponAmount?: number; // 可叠加优惠券金额 (RMB 元)
  stockStatus: StockStatusType; // 库存状态
  tags: string[]; // 营销与服务保障标签，如 ["极速出票", "支持随时退", "实名制"]
  bookingNote?: string; // 预订须知，如 "需提前1天预约 / 凭身份证直接入园"
  salesVolume?: string; // 销量/热度，如 "近30天预订 1.2万+"
  ratingScore?: number; // 评分，如 4.8
  bookingUrl?: string; // 预订跳转链接
}

export interface DayBudgetBreakdown {
  ticketsCost: number; // 门票总计 (按人头计算)
  hotelCost: number; // 住宿总计 (默认按间夜折算)
  transitCost: number; // 高铁/打车/公交通勤总计
  couponDiscount: number; // 优惠券及满减节省
  subtotal: number; // 单人基础花费
  participantCount: number; // 出行人数 (1人/2人情侣/3-4人家庭)
  grandTotal: number; // 实付总计
}

export interface PriceTrendPoint {
  date: string; // 日期 YYYY-MM-DD
  dayOfWeek: string; // 周几
  label: string; // 简短标签，如 "05-01 (劳动节)"
  trainPrice: number; // 高铁二等座基准价
  flightPrice: number; // 经济舱预估价
  hotelAvgPrice: number; // 舒适型酒店均价
  isPeak: boolean; // 是否为周末或节假日高峰
}
