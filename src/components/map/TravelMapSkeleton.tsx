'use client';

import React from 'react';
import { Compass, Layers, MapPin, Navigation } from 'lucide-react';

interface TravelMapSkeletonProps {
  className?: string;
  cityName?: string;
}

export function TravelMapSkeleton({
  className = '',
  cityName = '城市',
}: TravelMapSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="地图加载中"
      className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-stone-100 ${className}`}
    >
      {/* 网格底纹纹理模拟地图底图 */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'radial-gradient(#a8a29e 1px, transparent 1px), radial-gradient(#d6d3d1 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 12px 12px',
        }}
      />

      {/* 脉冲光波 */}
      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />

      {/* 模拟地图控制浮窗 (Zero CLS 占位) */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
        <div className="h-8 w-8 rounded-xl bg-white/80 shadow-xs border border-stone-200/80 animate-pulse flex items-center justify-center text-stone-400">
          <Layers className="h-4 w-4" />
        </div>
      </div>

      <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
        <div className="h-8 w-8 rounded-xl bg-white/80 shadow-xs border border-stone-200/80 animate-pulse flex items-center justify-center text-stone-400">
          <Compass className="h-4 w-4" />
        </div>
      </div>

      {/* 中心加载微状态 */}
      <div className="relative z-10 flex flex-col items-center gap-2 rounded-2xl bg-white/90 px-4 py-3 shadow-md border border-stone-200/80 backdrop-blur-xs">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 animate-bounce">
          <MapPin className="h-5 w-5" />
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-stone-800">
            高德路网与打卡点加载中...
          </p>
          <p className="text-[10px] text-stone-500 mt-0.5">
            正在就绪【{cityName}】实景与拓扑动线
          </p>
        </div>
      </div>

      {/* 模拟右下角比例尺 */}
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded bg-white/80 px-2 py-0.5 text-[9px] text-stone-500 shadow-2xs border border-stone-200/60">
        <span>高德地图 (GS(2021)6375号)</span>
      </div>
    </div>
  );
}
