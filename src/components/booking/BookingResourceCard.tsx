'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Ticket,
  Zap,
} from 'lucide-react';
import type { DomesticBookingResource } from '@/types/booking';

interface BookingResourceCardProps {
  resource: DomesticBookingResource;
  className?: string;
}

export function BookingResourceCard({
  resource,
  className = '',
}: BookingResourceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const isFree = resource.discountPrice === 0;

  const handleLockBooking = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLocked((prev) => !prev);
  };

  return (
    <div
      className={`mt-2 rounded-xl border border-amber-200/70 bg-linear-to-r from-amber-50/50 via-orange-50/30 to-amber-50/60 p-2.5 text-xs text-stone-800 transition-all duration-200 shadow-2xs hover:border-amber-300 ${className}`}
    >
      {/* 顶部简要信息栏 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-500 text-white shadow-2xs">
            <Ticket className="h-3 w-3" />
          </div>
          <span className="font-bold text-stone-800 truncate">
            {resource.title}
          </span>
          <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-stone-100 text-stone-600 border border-stone-200">
            {resource.provider}
          </span>
        </div>

        {/* 价格展示 */}
        <div className="flex items-baseline gap-1 shrink-0">
          {isFree ? (
            <span className="font-bold text-emerald-700">免费开放</span>
          ) : (
            <>
              {resource.originalPrice > resource.discountPrice && (
                <span className="text-[10px] text-stone-600 line-through">
                  ¥{resource.originalPrice}
                </span>
              )}
              <span className="text-sm font-black text-rose-600">
                ¥{resource.discountPrice}
              </span>
              <span className="text-[10px] text-stone-600">/人</span>
            </>
          )}
        </div>
      </div>

      {/* 标签服务行 */}
      <div className="mt-2 flex items-center justify-between gap-1 flex-wrap">
        <div className="flex items-center gap-1 flex-wrap">
          {resource.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-0.5 rounded-sm bg-amber-100/80 px-1 py-0.5 text-[10px] font-medium text-amber-800"
            >
              <Sparkles className="h-2.5 w-2.5 text-amber-600" />
              {tag}
            </span>
          ))}
          {resource.couponAmount && resource.couponAmount > 0 && (
            <span className="inline-flex items-center gap-0.5 rounded-sm bg-rose-100 px-1 py-0.5 text-[10px] font-bold text-rose-700">
              减¥{resource.couponAmount}券
            </span>
          )}
        </div>

        {/* 展开/收起按钮 */}
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-0.5 text-[11px] font-semibold text-stone-600 hover:text-stone-800 cursor-pointer"
        >
          <span>{isExpanded ? '收起须知' : '预约与退改'}</span>
          {isExpanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>
      </div>

      {/* 展开区域：预订须知与服务承诺 */}
      {isExpanded && (
        <div className="mt-2.5 space-y-1.5 border-t border-amber-200/60 pt-2 text-[11px] text-stone-600">
          {resource.bookingNote && (
            <div className="flex items-start gap-1 text-stone-700">
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" />
              <span>{resource.bookingNote}</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-0.5 text-[10px] text-stone-600">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              官方渠道核销
            </span>
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-amber-600" />
              快速确认出票
            </span>
            {resource.salesVolume && (
              <span className="text-stone-600">热度: {resource.salesVolume}</span>
            )}
          </div>
        </div>
      )}

      {/* 操作按钮栏 */}
      <div className="mt-2.5 flex items-center justify-end gap-1.5 border-t border-amber-200/50 pt-2">
        <button
          type="button"
          onClick={handleLockBooking}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
            isLocked
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
          }`}
        >
          <CheckCircle2
            className={`h-3 w-3 ${isLocked ? 'text-emerald-600' : 'text-stone-600'}`}
          />
          <span>{isLocked ? '已加入清单' : '加入预算清单'}</span>
        </button>

        {resource.bookingUrl && (
          <a
            href={resource.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 rounded-lg bg-linear-to-r from-orange-500 to-amber-600 px-2.5 py-1 text-xs font-bold text-white shadow-2xs transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>携程门票直达</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
