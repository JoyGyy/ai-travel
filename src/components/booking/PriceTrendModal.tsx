'use client';

import React, { useMemo } from 'react';
import {
  Calendar,
  ChevronRight,
  Flame,
  Info,
  Plane,
  Sparkles,
  Train,
  X,
} from 'lucide-react';
import { generateDomesticPriceTrends } from '@/lib/booking/budget-calculator';

interface PriceTrendModalProps {
  city: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PriceTrendModal({
  city,
  isOpen,
  onClose,
}: PriceTrendModalProps) {
  const trends = useMemo(() => {
    return generateDomesticPriceTrends();
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl border border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                {city} · 国内出行价格走势比价
              </h3>
              <p className="text-xs text-stone-600">
                对标携程大数据：高铁 vs 飞机 vs 酒店波动分析
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-600 hover:bg-stone-100 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 关键洞察提示 */}
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50/80 p-3 border border-amber-200/80 text-xs text-amber-900">
          <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">出行窗口期建议：</p>
            <p className="text-amber-800 leading-relaxed">
              周二至周四出发通常为全周价格低谷，高铁二等座票源充裕；周五晚及周六机票、高星酒店溢价约
              30%~45%。
            </p>
          </div>
        </div>

        {/* 7 日价格对比柱状图 */}
        <div className="mt-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-stone-600 px-1 font-semibold">
            <span>出发日期 (周度)</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-sky-600">
                <Train className="h-3 w-3" /> 高铁二等座
              </span>
              <span className="flex items-center gap-1 text-orange-600">
                <Plane className="h-3 w-3" /> 经济舱机票
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {trends.map((pt) => {
              const maxVal = 700;
              const trainPct = Math.round((pt.trainPrice / maxVal) * 100);
              const flightPct = Math.round((pt.flightPrice / maxVal) * 100);

              return (
                <div
                  key={pt.date}
                  className={`rounded-xl border p-2.5 transition-colors ${
                    pt.isPeak
                      ? 'border-orange-200/80 bg-orange-50/30'
                      : 'border-stone-100 bg-stone-50/50 hover:bg-stone-100/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-stone-800">
                        {pt.label}
                      </span>
                      {pt.isPeak && (
                        <span className="flex items-center gap-0.5 rounded px-1 py-0.2 bg-rose-100 text-[10px] font-bold text-rose-700">
                          <Flame className="h-2.5 w-2.5 fill-rose-600" />
                          出行高峰
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold">
                      <span className="text-sky-600">¥{pt.trainPrice}</span>
                      <span className="text-orange-600">¥{pt.flightPrice}</span>
                    </div>
                  </div>

                  {/* 双柱状进度 */}
                  <div className="space-y-1">
                    <div className="h-1.5 w-full rounded-full bg-stone-200/60 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-sky-500 transition-all duration-300"
                        style={{ width: `${trainPct}%` }}
                      />
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-stone-200/60 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-orange-500 transition-all duration-300"
                        style={{ width: `${flightPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[10px] text-stone-600">
                    <span>当地舒适型酒店均价参考</span>
                    <span className="font-semibold text-stone-700">
                      ¥{pt.hotelAvgPrice}/晚
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="mt-4 flex items-center justify-end border-t border-stone-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white hover:bg-stone-800 cursor-pointer"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
}
