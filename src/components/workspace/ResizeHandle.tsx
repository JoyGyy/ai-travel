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
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      startXRef.current = e.clientX;
      startWidthRef.current = latestWidthRef.current;
      setIsDragging(true);

      const handlePointerMove = (moveEvent: PointerEvent | MouseEvent) => {
        const deltaX = moveEvent.clientX - startXRef.current;
        const adjustedDelta = direction === 'right' ? deltaX : -deltaX;
        const rawNewWidth = startWidthRef.current + adjustedDelta;
        const clampedWidth = Math.max(
          minWidth,
          Math.min(maxWidth, rawNewWidth),
        );

        latestWidthRef.current = clampedWidth;
        onResize(clampedWidth);
      };

      const handlePointerUp = () => {
        setIsDragging(false);

        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);
        window.removeEventListener('mousemove', handlePointerMove);
        window.removeEventListener('mouseup', handlePointerUp);
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
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
    },
    [direction, minWidth, maxWidth, onResize, onResizeEnd],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const step = 20;
      let newWidth = latestWidthRef.current;
      if (e.key === 'ArrowLeft') {
        newWidth = Math.max(minWidth, latestWidthRef.current - step);
      } else if (e.key === 'ArrowRight') {
        newWidth = Math.min(maxWidth, latestWidthRef.current + step);
      } else {
        return;
      }

      e.preventDefault();
      latestWidthRef.current = newWidth;
      onResize(newWidth);
      if (onResizeEnd) {
        onResizeEnd(newWidth);
      }
      window.dispatchEvent(new Event('resize'));
    },
    [minWidth, maxWidth, onResize, onResizeEnd],
  );

  return (
    <>
      {/* 拖拽中的全屏防穿透遮罩（防止底层 Leaflet 地图或 iframe 劫持鼠标移动事件） */}
      {isDragging && (
        <div className="fixed inset-0 z-50 cursor-col-resize select-none bg-transparent" />
      )}

      <div
        aria-label={ariaLabel}
        aria-orientation="vertical"
        aria-valuemax={maxWidth}
        aria-valuemin={minWidth}
        aria-valuenow={width}
        className={`
          relative group z-30 hidden lg:flex items-center justify-center
          w-3.5 -mx-1.5 hover:w-4 hover:-mx-2 transition-all duration-150
          cursor-col-resize select-none shrink-0 touch-none
          before:absolute before:inset-y-0 before:-inset-x-2 before:z-10 before:cursor-col-resize
          outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 rounded-sm
          ${className}
        `}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        role="separator"
        tabIndex={0}
        title="按住左右拖拽可调整栏目宽度（支持键盘方向键微调）"
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
            transition-all duration-150 z-20 pointer-events-none
            ${
              isDragging
                ? 'scale-110 border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md ring-2 ring-emerald-500/20 opacity-100'
                : 'text-stone-400 opacity-80 group-hover:opacity-100 group-hover:scale-105 hover:text-emerald-700'
            }
          `}
        >
          <GripVertical className="h-3 w-3" />
        </div>
      </div>
    </>
  );
}
