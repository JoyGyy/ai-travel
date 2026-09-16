import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface AttractionCardData {
  city: string;
  coverImage: string;
  id: string;
  isFavorite?: boolean;
  name: string;
  priceText?: string;
  rating?: number;
  summary: string;
  tags: string[];
  ticketType: 'free' | 'paid';
}

export interface AttractionCardProps<
  T extends AttractionCardData = AttractionCardData,
> {
  attraction: T;
  className?: string;
  isFavoritePending?: boolean;
  onRemoveFavorite?: (id: string) => void;
  onToggleFavorite?: (attraction: T) => void;
  showRemoveFavorite?: boolean;
  size?: 'default' | 'compact';
}

export interface FormattedTicketPrice {
  isFree: boolean;
  label: string;
  subNote?: string;
}

/**
 * 将可能过于冗长的门票长文本规范化提取为紧凑美观的展示格式，杜绝卡片排版挤压
 */
export function formatTicketPrice(
  ticketType?: 'free' | 'paid',
  priceText?: string,
): FormattedTicketPrice {
  if (ticketType === 'free') {
    return { isFree: true, label: '免费开放' };
  }

  if (!priceText) {
    return { isFree: false, label: '以景区为准' };
  }

  // 1. 优先提取数字价格，如 "参考价 ¥108，以平台实际为准" 或 "60元"
  const yenMatch = priceText.match(/¥\s*(\d+(?:\.\d+)?)/);
  if (yenMatch) {
    const hasPlatformNote =
      priceText.includes('平台实际') || priceText.includes('以平台');
    return {
      isFree: false,
      label: `¥${yenMatch[1]} 起`,
      subNote: hasPlatformNote ? '以平台为准' : undefined,
    };
  }

  const yuanMatch = priceText.match(/(\d+(?:\.\d+)?)\s*元/);
  if (yuanMatch) {
    return {
      isFree: false,
      label: `¥${yuanMatch[1]} 起`,
      subNote: priceText.includes('平台') ? '以平台为准' : undefined,
    };
  }

  // 2. 船票或套票浮动定价说明
  if (
    priceText.includes('船票') ||
    priceText.includes('套票') ||
    priceText.includes('浮动')
  ) {
    return {
      isFree: false,
      label: '套票 / 浮动价',
      subNote: '以平台为准',
    };
  }

  // 3. 兜底处理过长文本
  if (priceText.length > 8) {
    return {
      isFree: false,
      label: '收费项目',
      subNote: '以景区为准',
    };
  }

  return { isFree: false, label: priceText };
}

export function AttractionCard<
  T extends AttractionCardData = AttractionCardData,
>({
  attraction,
  className = '',
  isFavoritePending = false,
  onRemoveFavorite,
  onToggleFavorite,
  showRemoveFavorite = false,
  size = 'default',
}: AttractionCardProps<T>) {
  const isCompact = size === 'compact';
  const priceInfo = formatTicketPrice(
    attraction.ticketType,
    attraction.priceText,
  );

  return (
    <Link
      className={`group block h-full ${className}`}
      href={`/attractions/${attraction.id}`}
    >
      <article className="h-full overflow-hidden rounded-3xl border border-stone-200/90 bg-[#FDFBF7] shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-700/60 hover:shadow-xl flex flex-col justify-between">
        {/* 顶部封面图与悬浮操作栏 */}
        <div
          className={`relative w-full overflow-hidden shrink-0 ${isCompact ? 'h-36 sm:h-40' : 'h-[190px] sm:h-[200px]'}`}
        >
          <Image
            alt={`${attraction.name}，${attraction.city}景点封面`}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            fill
            loading="lazy"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            src={attraction.coverImage}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/50 via-transparent to-transparent opacity-60" />

          {/* 城市位置徽章 */}
          <Badge className="absolute left-3 top-3 bg-white/95 text-[11px] font-bold text-emerald-800 shadow-sm backdrop-blur-md rounded-full border border-stone-200/80">
            📍 {attraction.city}
          </Badge>

          {/* 收藏 / 取消收藏按钮 */}
          {showRemoveFavorite ? (
            <button
              aria-label="取消收藏"
              className="absolute right-3 top-3 rounded-full p-2 bg-white/90 backdrop-blur-md text-stone-400 shadow-sm transition-all hover:scale-110 hover:text-red-500 cursor-pointer"
              disabled={isFavoritePending}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemoveFavorite?.(attraction.id);
              }}
              title="取消收藏"
              type="button"
            >
              <Heart className="w-4 h-4 fill-red-500 text-red-500" />
            </button>
          ) : (
            <button
              aria-label={attraction.isFavorite ? '取消心愿收藏' : '添加至心愿收藏'}
              className="absolute right-3 top-3 rounded-full p-2 bg-white/90 backdrop-blur-md text-stone-400 shadow-sm transition-all hover:scale-110 hover:text-red-500 cursor-pointer"
              disabled={isFavoritePending}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite?.(attraction);
              }}
              title={attraction.isFavorite ? '已收藏' : '收藏'}
              type="button"
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  attraction.isFavorite
                    ? 'fill-red-500 text-red-500'
                    : 'text-stone-500 hover:text-red-500'
                }`}
              />
            </button>
          )}
        </div>

        {/* 卡片详情主体：垂直独占行排版，彻底解决文字挤压 */}
        <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
          <div>
            {/* 行 1: 景点标题独占全宽，绝不与任何价格标签并排争夺宽度 */}
            <h3
              className="font-serif text-sm sm:text-base font-bold text-stone-900 group-hover:text-emerald-800 transition-colors leading-snug line-clamp-1 w-full block"
              title={attraction.name}
            >
              {attraction.name}
            </h3>

            {/* 行 2: 独立价格与预约状态栏目 */}
            <div className="mt-2 flex items-center justify-between gap-2 min-h-[1.5rem]">
              {priceInfo.isFree ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 inline-block" />
                  免费开放
                </span>
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className="font-serif text-sm sm:text-base font-extrabold text-amber-700">
                    {priceInfo.label}
                  </span>
                  {priceInfo.subNote && (
                    <span className="text-[10px] text-stone-400">
                      ({priceInfo.subNote})
                    </span>
                  )}
                </div>
              )}

              {attraction.rating ? (
                <span className="text-xs font-bold text-amber-600 flex items-center gap-0.5">
                  ★ {attraction.rating.toFixed(1)}
                </span>
              ) : (
                <span className="text-[11px] text-stone-400 font-medium">
                  {priceInfo.isFree ? '预约入园' : '以平台为准'}
                </span>
              )}
            </div>

            {/* 行 3: 景点摘要手账 */}
            <p
              className={`mt-2.5 text-xs leading-relaxed text-stone-500 ${isCompact ? 'line-clamp-1' : 'line-clamp-2'}`}
            >
              {attraction.summary}
            </p>
          </div>

          {/* 行 4: 标签与查看详情直达底栏 */}
          <div className="mt-3.5 pt-3 border-t border-stone-200/70 flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1 min-w-0">
              {attraction.tags.slice(0, 3).map((tag) => (
                <span
                  className="bg-stone-100/90 text-stone-600 text-[10px] font-medium rounded-md px-2 py-0.5 shrink-0"
                  key={tag}
                >
                  #{tag}
                </span>
              ))}
            </div>
            <span className="text-xs font-bold text-emerald-800 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 shrink-0">
              详情 →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
