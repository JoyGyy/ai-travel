'use client';

/**
 * 景点详情页面
 *
 * 根据 URL 参数加载景点详情，展示封面、介绍、实用信息、
 * 游玩亮点和注意事项，支持收藏和 AI 行程规划跳转。
 */
import type { Attraction } from '@/types/attraction';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Heart,
  Hotel,
  MapPin,
  Sparkles,
  Ticket,
  Train,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { useCallback, useEffect, useState } from 'react';

import { fetchAttractionDetail } from '@/api/attractions';
import { AttractionAiSummaryCard } from '@/components/attractions/AttractionAiSummaryCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAttractionFavorite } from '@/hooks/useAttractionFavorite';
import {
  attachCtripAllianceParams,
  buildCtripHotelLink,
  buildCtripTicketLink,
  buildCtripTrainLink,
  useCtripDevice,
} from '@/lib/ctrip/alliance';

export default function AttractionDetail() {
  // ---- 设备自适应监听与路由参数状态 ----
  const device = useCtripDevice();
  const params = useParams();
  const id = (params?.id as string) || '';
  const router = useRouter();
  const [attraction, setAttraction] = useState<Attraction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favoritePending, setFavoritePending] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const { toggleFavorite } = useAttractionFavorite({
    onFavoriteSuccess: (_attractionId, isFavorite) => {
      if (attraction) {
        setAttraction({ ...attraction, isFavorite });
      }
    },
  });

  // ---- 加载景点数据 ----
  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchAttractionDetail(id);
        if (!cancelled)
          setAttraction({ ...data.attraction, isFavorite: data.isFavorite });
      } catch (err: unknown) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : '景点加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  /** 切换收藏状态 */
  async function handleToggleFavorite() {
    if (!attraction) return;
    setFavoritePending(true);
    try {
      await toggleFavorite(attraction.id, attraction.isFavorite ?? false);
    } finally {
      setFavoritePending(false);
    }
  }

  /** 处理返回逻辑：优先回退上一页（保留筛选/滚动历史），兜底直接跳转到景点列表页 */
  const handleBack = useCallback(() => {
    if (
      typeof window !== 'undefined' &&
      window.history.length > 1 &&
      document.referrer &&
      document.referrer.includes('/attractions')
    ) {
      router.back();
    } else {
      router.push('/attractions');
    }
  }, [router]);

  // 快捷键支持：按 ESC 键也可快速返回景点列表
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleBack();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBack]);

  // ---- 加载中状态 ----
  if (loading) {
    return (
      <main className="travel-page-shell">
        <div className="flex flex-col items-center gap-3 rounded-xl p-6">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
          <h1
            className="text-xl font-bold text-travel-ink"
            id="attraction-loading-title"
          >
            加载景点详情中...
          </h1>
          <p className="text-travel-muted">正在取出这张目的地票根。</p>
        </div>
      </main>
    );
  }
  // ---- 错误/空数据状态 ----
  if (error || !attraction) {
    return (
      <main className="travel-page-shell">
        <div className="flex flex-col items-center gap-3 rounded-xl p-6">
          <h1
            className="text-xl font-bold text-travel-ink"
            id="attraction-error-title"
          >
            景点暂时无法打开
          </h1>
          <p className="text-travel-muted">{error || '景点不存在或已下架'}</p>
          <div className="flex gap-3">
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setReloadKey((prev) => prev + 1)}
            >
              重试
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => router.push('/attractions')}
            >
              返回景点列表
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // ---- 防御性规范化数组属性（杜绝 string/null 导致的 .map is not a function 异常） ----
  const safeTips = Array.isArray(attraction.tips)
    ? attraction.tips
    : typeof attraction.tips === 'string' && (attraction.tips as string).trim()
      ? [(attraction.tips as string).trim()]
      : [];

  const safeHighlights = Array.isArray(attraction.highlights)
    ? attraction.highlights
    : typeof attraction.highlights === 'string' && (attraction.highlights as string).trim()
      ? [(attraction.highlights as string).trim()]
      : [];

  const safeTags = Array.isArray(attraction.tags)
    ? attraction.tags
    : typeof attraction.tags === 'string' && (attraction.tags as string).trim()
      ? [(attraction.tags as string).trim()]
      : [];

  const safeSuitableFor = Array.isArray(attraction.suitableFor)
    ? attraction.suitableFor
    : typeof attraction.suitableFor === 'string' && (attraction.suitableFor as string).trim()
      ? [(attraction.suitableFor as string).trim()]
      : [];

  // ---- 构建 AI 规划跳转参数 ----
  const prompt = encodeURIComponent(
    `帮我规划一个包含${attraction.city}${attraction.name}的旅行行程`,
  );
  const ticketTypeClass =
    attraction.ticketType === 'free' ? 'travel-tag--free' : 'travel-tag--paid';

  // ---- 携程开放联盟推广跳转参数 (根据用户设备自适应 PC 宽屏官网 vs 手机端 H5/App 唤起) ----
  const ctripTicketUrl = attraction.bookingLinks?.ctrip
    ? attachCtripAllianceParams(attraction.bookingLinks.ctrip, {
        device,
        sid: 'attraction_detail_ticket',
      })
    : attraction.ticketType === 'paid'
      ? buildCtripTicketLink({
          city: attraction.city,
          device,
          sid: 'attraction_detail_ticket',
          spotName: attraction.name,
        })
      : null;

  const ctripHotelUrl = buildCtripHotelLink({
    city: attraction.city,
    device,
    keyword: `${attraction.name}周边`,
    sid: 'attraction_detail_hotel',
  });

  const ctripTrainUrl = buildCtripTrainLink({
    arrival: attraction.city,
    departure: '全国出发',
    device,
    sid: 'attraction_detail_train',
  });


  return (
    <main className="travel-page-shell">
      {/* 固定状态返回按钮：方便用户在翻到某个景点的底部时也可以随时直接返回到景点列表页面 */}
      <button
        aria-label="返回景点列表"

        className="fixed top-[74px] left-4 sm:left-6 lg:left-8 z-40 inline-flex items-center gap-2 rounded-full border border-stone-200/90 bg-white/92 px-4 py-2 text-xs md:text-sm font-semibold text-stone-700 shadow-md backdrop-blur-md transition-all hover:bg-white hover:text-primary hover:border-primary/30 hover:shadow-lg active:scale-95 cursor-pointer"
        onClick={handleBack}
        title="返回景点列表 (Esc)"
        type="button"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">返回景点列表</span>
        <span className="sm:hidden">返回列表</span>
      </button>

      {/* 顶部占位符：防止 fixed 返回按钮在页面首屏与封面卡片产生重叠冲突 */}
      <div aria-hidden="true" className="h-11 mb-2" />

      {/* ---- 封面与操作区 ---- */}
      <section className="travel-surface-card travel-ticket-edge travel-route-line overflow-hidden">
        <Image
          alt={`${attraction.name}，${attraction.city}景点封面`}
          className="h-[clamp(280px,50vw,500px)] w-full object-cover"
          height={500}
          loading="eager"
          sizes="100vw"
          src={attraction.coverImage}
          width={800}
        />
        <div className="p-6">
          <p className="mb-2 text-sm font-medium text-primary">
            {attraction.city}
          </p>
          <h1
            className="mb-3 text-2xl font-bold text-travel-ink md:text-3xl"
            id="attraction-detail-title"
          >
            {attraction.name}
          </h1>
          <p className="mb-4 text-travel-muted">{attraction.summary}</p>
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge className={`travel-tag ${ticketTypeClass}`}>
              {attraction.ticketType === 'free' ? '免费' : '收费'}
            </Badge>
            <Badge className="travel-tag travel-tag--warning">
              {attraction.priceText}
            </Badge>
            {safeTags.map((tag) => (
              <Badge className="travel-tag travel-tag--info" key={tag}>
                {tag}
              </Badge>
            ))}
          </div>

          {safeSuitableFor.length > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
              <span className="text-[11px] font-medium text-stone-400">
                出行人群：
              </span>
              {safeSuitableFor.map((item) => (
                <span
                  className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600 border border-stone-200/60"
                  key={item}
                >
                  {item}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              className="border-primary/25 bg-white text-primary hover:bg-primary/5 hover:text-primary"
              disabled={favoritePending}
              onClick={handleToggleFavorite}
              variant="outline"
            >
              <Heart
                className={`mr-2 h-4 w-4 ${attraction.isFavorite ? 'fill-current' : ''}`}
              />
              {favoritePending
                ? '处理中...'
                : attraction.isFavorite
                  ? '已收藏'
                  : '收藏'}
            </Button>

            <Link
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              href={`/chat?prompt=${prompt}`}
            >
              让 AI 规划这站
            </Link>

            {ctripTicketUrl && (
              <a
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-amber-400/80 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 shadow-2xs transition-all hover:bg-amber-100 hover:border-amber-500"
                href={ctripTicketUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Ticket className="h-4 w-4 text-amber-700" />
                <span>在携程特惠购票</span>
                <ExternalLink className="h-3.5 w-3.5 text-amber-700/80" />
              </a>
            )}

            {attraction.ticketType === 'free' && (
              <div className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 border border-emerald-200/80">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                <span>免门票 · 凭身份证或官方预约入园</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---- AI 导游速览与避坑手账 ---- */}
      <AttractionAiSummaryCard
        highlights={safeHighlights}
        recommendedDuration={attraction.recommendedDuration}
        suitableFor={safeSuitableFor}
        tips={safeTips}
      />

      {/* ---- 景点介绍 ---- */}
      <section className="travel-surface-card p-6">
        <h2 className="mb-4 text-xl font-bold text-travel-ink">景点介绍</h2>
        <p className="leading-relaxed text-travel-muted">
          {attraction.description}
        </p>
      </section>

      {/* ---- 实用信息 ---- */}
      <section className="travel-surface-card p-6">
        <h2 className="mb-4 text-xl font-bold text-travel-ink">实用信息</h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-travel-muted">地址</dt>
            <dd className="mt-1 flex items-center justify-between gap-2 text-travel-ink">
              <span>{attraction.address}</span>
              {attraction.address && (
                <a
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline shrink-0"
                  href={`https://uri.amap.com/marker?name=${encodeURIComponent(attraction.name)}&address=${encodeURIComponent(attraction.address)}`}
                  rel="noopener noreferrer"
                  target="_blank"
                  title="在高德地图中查看位置"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  <span>高德导航</span>
                </a>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-travel-muted">开放时间</dt>
            <dd className="mt-1 text-travel-ink">{attraction.openingHours}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-travel-muted">建议游玩</dt>
            <dd className="mt-1 text-travel-ink">
              {attraction.recommendedDuration}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-travel-muted">票价</dt>
            <dd className="mt-1 text-travel-ink">{attraction.priceText}</dd>
          </div>
        </dl>
      </section>

      {/* ---- 游玩亮点 ---- */}
      {safeHighlights.length > 0 && (
        <section className="travel-surface-card p-6">
          <h2 className="mb-4 text-xl font-bold text-travel-ink">游玩亮点</h2>
          <ul className="list-inside list-disc space-y-2 text-travel-muted">
            {safeHighlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {/* ---- 注意事项 ---- */}
      {safeTips.length > 0 && (
        <section className="travel-surface-card p-6">
          <h2 className="mb-4 text-xl font-bold text-travel-ink">注意事项</h2>
          <ul className="list-inside list-disc space-y-2 text-travel-muted">
            {safeTips.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}


      {/* ---- 携程开放联盟精选出行配套 ---- */}
      <section className="travel-surface-card p-6">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-600 text-white shadow-2xs">
              <Sparkles className="h-4 w-4 text-amber-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-travel-ink leading-tight">
                携程旅行特惠与周边出行配套
              </h2>
              <p className="text-xs text-travel-muted">
                携程开放联盟官方直通 · 享专属底价保障与极速出票
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/80">
            携程官方合作
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* 酒店推荐卡片 */}
          <div className="flex flex-col justify-between rounded-xl border border-stone-200/90 bg-stone-50/60 p-4 transition-all hover:border-orange-300 hover:bg-orange-50/30">
            <div>
              <div className="flex items-center gap-1.5 text-sm font-bold text-stone-900 mb-1.5">
                <Hotel className="h-4 w-4 text-orange-600" />
                <span>{attraction.name}周边精选酒店</span>
              </div>
              <p className="text-xs text-stone-500 leading-relaxed mb-3">
                一键检索核心景区周边的携程高分酒店与特色民宿，支持连住特惠与免费取消。
              </p>
            </div>
            <a
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white border border-stone-200 px-3.5 py-1.5 text-xs font-bold text-stone-800 shadow-2xs transition-all hover:bg-orange-600 hover:text-white hover:border-orange-600"
              href={ctripHotelUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span>查看周边酒店</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* 高铁车票卡片 */}
          <div className="flex flex-col justify-between rounded-xl border border-stone-200/90 bg-stone-50/60 p-4 transition-all hover:border-orange-300 hover:bg-orange-50/30">
            <div>
              <div className="flex items-center gap-1.5 text-sm font-bold text-stone-900 mb-1.5">
                <Train className="h-4 w-4 text-orange-600" />
                <span>直达{attraction.city}高铁车票查询</span>
              </div>
              <p className="text-xs text-stone-500 leading-relaxed mb-3">
                全国各站直达{attraction.city}的高铁动车时刻表与余票监控，支持智能候补代订。
              </p>
            </div>
            <a
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white border border-stone-200 px-3.5 py-1.5 text-xs font-bold text-stone-800 shadow-2xs transition-all hover:bg-orange-600 hover:text-white hover:border-orange-600"
              href={ctripTrainUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span>查询携程车票</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
