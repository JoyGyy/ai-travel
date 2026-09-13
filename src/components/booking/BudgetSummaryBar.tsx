'use client';

import React, { useMemo, useState } from 'react';
import {
  Banknote,
  ChevronRight,
  HelpCircle,
  Hotel,
  Sparkles,
  Ticket,
  TrendingUp,
  Users,
  Utensils,
} from 'lucide-react';
import {
  calculateDayBudgetBreakdown,
  estimateLegTransitCost,
} from '@/lib/booking/budget-calculator';
import { useItineraryWorkspaceStore } from '@/stores/itineraryWorkspace';
import { PriceTrendModal } from './PriceTrendModal';

interface BudgetSummaryBarProps {
  dayNum: number;
  className?: string;
}

export function BudgetSummaryBar({
  dayNum,
  className = '',
}: BudgetSummaryBarProps) {
  const city = useItineraryWorkspaceStore((s) => s.city);
  const days = useItineraryWorkspaceStore((s) => s.days);
  const participantCount = useItineraryWorkspaceStore(
    (s) => s.participantCount,
  );
  const setParticipantCount = useItineraryWorkspaceStore(
    (s) => s.setParticipantCount,
  );
  const hotelNightPrice = useItineraryWorkspaceStore((s) => s.hotelNightPrice);

  const [isPriceTrendOpen, setIsPriceTrendOpen] = useState(false);

  // 获取当前日行程
  const currentDay = useMemo(() => {
    return days.find((d) => d.day === dayNum) || null;
  }, [days, dayNum]);

  // 计算今日预订资源与总开销
  const breakdown = useMemo(() => {
    if (!currentDay) return null;

    const resources = currentDay.spots
      .map((s) => s.bookingResource)
      .filter((r): r is NonNullable<typeof r> => Boolean(r));

    // 计算今日所有交通段估算成本
    const totalTransit = currentDay.legs.reduce((acc, leg) => {
      return acc + estimateLegTransitCost(leg.mode, leg.distanceKm);
    }, 0);

    return calculateDayBudgetBreakdown({
      bookingResources: resources,
      transitCost: totalTransit,
      hotelNightPrice,
      participantCount,
    });
  }, [currentDay, hotelNightPrice, participantCount]);

  if (!breakdown || !currentDay || currentDay.spots.length === 0) {
    return null;
  }

  return (
    <>
      <div
        className={`rounded-2xl border border-stone-200/90 bg-white p-3 shadow-2xs ${className}`}
      >
        {/* 顶行：标题与人数选择 */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-100">
          <div className="flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-700 text-white">
              <Banknote className="h-3 w-3" />
            </div>
            <span className="text-xs font-bold text-stone-900">
              第 {dayNum} 天 · 出行预算明细
            </span>
            <span className="text-[10px] text-stone-600">
              (含门票/交通/住宿参考)
            </span>
          </div>

          {/* 出行人数切换控制器 */}
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-stone-600" />
            <div className="flex items-center rounded-lg bg-stone-100 p-0.5 text-[11px] font-semibold">
              {[1, 2, 3, 4].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setParticipantCount(count)}
                  className={`rounded-md px-1.5 py-0.5 transition-all cursor-pointer ${
                    participantCount === count
                      ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {count}人
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 中间开销小项网格 */}
        <div className="grid grid-cols-3 gap-2 py-2.5 text-center">
          <div className="rounded-xl bg-stone-50 p-2">
            <div className="flex items-center justify-center gap-1 text-[10px] text-stone-600">
              <Ticket className="h-3 w-3 text-amber-600" />
              <span>景区门票</span>
            </div>
            <div className="mt-0.5 text-xs font-black text-stone-800">
              ¥{breakdown.ticketsCost}
            </div>
          </div>

          <div className="rounded-xl bg-stone-50 p-2">
            <div className="flex items-center justify-center gap-1 text-[10px] text-stone-600">
              <Hotel className="h-3 w-3 text-sky-600" />
              <span>住宿参考</span>
            </div>
            <div className="mt-0.5 text-xs font-black text-stone-800">
              ¥{breakdown.hotelCost}
            </div>
          </div>

          <div className="rounded-xl bg-stone-50 p-2">
            <div className="flex items-center justify-center gap-1 text-[10px] text-stone-600">
              <TrendingUp className="h-3 w-3 text-emerald-600" />
              <span>市内通勤</span>
            </div>
            <div className="mt-0.5 text-xs font-black text-stone-800">
              ¥{breakdown.transitCost}
            </div>
          </div>
        </div>

        {/* 底部结算与价格走势按钮 */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-100">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[11px] text-stone-600">预计总花费:</span>
            <span className="text-sm font-black text-rose-600">
              ¥{breakdown.grandTotal}
            </span>
            {breakdown.couponDiscount > 0 && (
              <span className="rounded bg-rose-100 px-1 py-0.2 text-[10px] font-bold text-rose-700">
                已省¥{breakdown.couponDiscount}
              </span>
            )}
            {participantCount > 1 && (
              <span className="text-[10px] text-stone-600">
                (人均约 ¥{breakdown.subtotal})
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsPriceTrendOpen(true)}
            className="flex items-center gap-0.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
          >
            <span>价格走势</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <PriceTrendModal
        city={city}
        isOpen={isPriceTrendOpen}
        onClose={() => setIsPriceTrendOpen(false)}
      />
    </>
  );
}
