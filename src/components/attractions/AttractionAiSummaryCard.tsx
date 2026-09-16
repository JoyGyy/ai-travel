import type { FC } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';

export interface AttractionAiSummaryCardProps {
  className?: string;
  highlights?: string[];
  recommendedDuration?: string;
  suitableFor?: string[];
  tips?: string[];
}

/**
 * AI 导游速览与避坑卡片
 *
 * 区别于 OTA 散乱的几十万条点评，利用 AI 将全网游客的核心口碑、
 * 避坑警示与出行画像进行浓缩呈现，提升行前决策效率。
 */
export const AttractionAiSummaryCard: FC<AttractionAiSummaryCardProps> = ({
  className = '',
  highlights = [],
  recommendedDuration,
  suitableFor = [],
  tips = [],
}) => {
  if (
    highlights.length === 0 &&
    tips.length === 0 &&
    suitableFor.length === 0
  ) {
    return null;
  }

  return (
    <section
      aria-label="AI 导游速览与避坑手账"
      className={`travel-surface-card overflow-hidden p-6 border border-emerald-900/15 bg-linear-to-br from-emerald-50/40 via-stone-50/60 to-amber-50/30 shadow-sm ${className}`}
    >
      {/* 头部标题区域 */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-xs">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-serif text-base font-bold text-stone-900">
                AI 导游速览 · 口碑与避坑手账
              </h2>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300/80">
                <Sparkles className="h-3 w-3 text-amber-600" />
                <span>智能精要</span>
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              全网真实游客口碑与避坑指南提炼，无需翻看冗长点评
            </p>
          </div>
        </div>

        {/* 建议时长浮标 */}
        {recommendedDuration && (
          <div className="flex items-center gap-1.5 rounded-full bg-white/90 border border-stone-200 px-3 py-1 text-xs font-semibold text-stone-700 shadow-2xs">
            <Clock className="h-3.5 w-3.5 text-emerald-700" />
            <span>建议游玩 {recommendedDuration}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* 模块 1: 核心好评与打卡看点 */}
        {highlights.length > 0 && (
          <div className="rounded-2xl border border-emerald-200/70 bg-white/80 p-4 shadow-2xs">
            <div className="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
              <span>游客高赞看点 Top {highlights.length}</span>
            </div>
            <ul className="space-y-2 text-xs leading-relaxed text-stone-600">
              {highlights.map((item, idx) => (
                <li className="flex items-start gap-2" key={idx}>
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-800">
                    {idx + 1}
                  </span>
                  <span className="flex-1">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 模块 2: 行前避坑与预警 */}
        {tips.length > 0 && (
          <div className="rounded-2xl border border-amber-200/80 bg-white/80 p-4 shadow-2xs">
            <div className="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>行前避坑与必知提醒</span>
            </div>
            <ul className="space-y-2 text-xs leading-relaxed text-stone-600">
              {tips.map((item, idx) => (
                <li className="flex items-start gap-2" key={idx}>
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-800">
                    !
                  </span>
                  <span className="flex-1 font-medium text-stone-700">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 模块 3: 人群画像与适宜场景 */}
      {suitableFor.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-stone-200/60">
          <div className="flex items-center gap-1 text-xs font-bold text-stone-500">
            <Users className="h-3.5 w-3.5 text-stone-400" />
            <span>出行适宜：</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suitableFor.map((target) => (
              <Badge
                className="bg-emerald-100/70 text-emerald-900 border-emerald-200 text-[11px] font-medium px-2.5 py-0.5 rounded-md"
                key={target}
              >
                ✓ {target}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
