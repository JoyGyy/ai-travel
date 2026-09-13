'use client';

import { GripVertical } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface ResizeHandleProps {
  ariaLabel?: string;
  className?: string;
  direction?: 'left' | 'right';
  maxWidth?: number;
  minWidth?: number;
  onResize: (newWidth: number) => void;
  onResizeEnd?: (finalWidth: number) => void;
  width: number;
}

export function ResizeHandle({
  ariaLabel = '调节栏目宽度',
  className = '',
  direction = 'right',
  maxWidth = 700,
  minWidth = 300,
  onResize,
  onResizeEnd,
  width,
}: ResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(width);
  const latestWidthRef = useRef(width);

  useEffect(() => {
    latestWidthRef.current = width;
  }, [width]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      startXRef.current = e.clientX;
      startWidthRef.current = latestWidthRef.current;
      setIsDragging(true);

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const deltaX = moveEvent.clientX - startXRef.current;
        const adjustedDelta = direction === 'right' ? deltaX : -deltaX;
        const rawNewWidth = startWidthRef.current + adjustedDelta;
        const clampedWidth = Math.max(minWidth, Math.min(maxWidth, rawNewWidth));

        latestWidthRef.current = clampedWidth;
        onResize(clampedWidth);

        // 触发全局 resize 事件以通知 Leaflet 地图立即更新
        window.dispatchEvent(new Event('resize'));
      };

      const handlePointerUp = () => {
        setIsDragging(false);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';

        if (onResizeEnd) {
          onResizeEnd(latestWidthRef.current);
        }
        window.dispatchEvent(new Event('resize'));
      };

      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
    },
    [direction, minWidth, maxWidth, onResize, onResizeEnd],
  );

  return (
    <div
      aria-label={ariaLabel}
      aria-orientation="vertical"
      aria-valuenow={width}
      className={`
        relative group z-20 hidden lg:flex items-center justify-center
        w-2.5 -mx-1 hover:w-3 hover:-mx-1.5 transition-all duration-150 cursor-col-resize select-none shrink-0
        ${className}
      `}
      onPointerDown={handlePointerDown}
      role="separator"
      tabIndex={0}
      title="按住左右拖拽可调整栏目宽度"
    >
      {/* 拖拽线条 */}
      <div
        className={`
          h-full w-[2px] transition-colors duration-150
          ${
            isDragging
              ? 'bg-emerald-600 ring-2 ring-emerald-400/40'
              : 'bg-stone-300/80 group-hover:bg-emerald-500'
          }
        `}
      />

      {/* 居中把手图标 */}
      <div
        className={`
          absolute top-1/2 -translate-y-1/2 flex items-center justify-center
          h-8 w-4 rounded-md border border-stone-200 bg-white shadow-xs
          transition-all duration-150
          ${
            isDragging
              ? 'scale-110 border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md ring-2 ring-emerald-500/20'
              : 'text-stone-400 opacity-0 group-hover:opacity-100 group-hover:scale-100 hover:text-emerald-700'
          }
        `}
      >
        <GripVertical className="h-3 w-3" />
      </div>
    </div>
  );
}
