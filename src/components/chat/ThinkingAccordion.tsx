'use client';

import { Brain, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface ThinkingAccordionProps {
  content?: string;
  durationMs?: number;
  isGenerating?: boolean;
}

export function ThinkingAccordion({
  content,
  durationMs = 2100,
  isGenerating = false,
}: ThinkingAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const displayContent = content || 'AI 正在基于您的出行需求推演最佳策略...';
  const durationText = (Math.max(durationMs, 800) / 1000).toFixed(1);

  // 解析是否包含分步列表
  const steps = displayContent
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="my-2.5 overflow-hidden rounded-2xl border border-emerald-200/90 bg-emerald-50/40 text-xs transition-all shadow-2xs">
      <button
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between px-3.5 py-2 text-left text-emerald-950 hover:bg-emerald-100/50 transition-colors cursor-pointer select-none"
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
      >
        <div className="flex items-center gap-2 font-bold">
          <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-xs">
            <Brain className="h-3 w-3" />
          </div>
          <span className="flex items-center gap-1.5 text-xs text-emerald-900">
            {isGenerating ? (
              <>
                <Sparkles className="h-3.5 w-3.5 animate-spin text-emerald-700" />
                <span className="font-semibold">AI 正在深度思考推导逻辑...</span>
              </>
            ) : (
              <>
                <span className="font-semibold text-emerald-900">深度思考已完成</span>
                <span className="text-[10px] text-emerald-700/80 font-normal">
                  (耗时约 {durationText}s)
                </span>
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800">
          <span>{isOpen ? '收起思考' : '展开推导'}</span>
          {isOpen ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-emerald-200/60 bg-white/90 px-4 py-3 text-stone-700 leading-relaxed font-sans text-xs space-y-2">
          {steps.map((step, idx) => {
            const isNumbered = /^\d+[.、]/.test(step);
            return (
              <div
                className="flex items-start gap-2 text-stone-700 leading-relaxed"
                key={idx}
              >
                {!isNumbered && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                )}
                <span className="flex-1 whitespace-pre-line">{step}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
