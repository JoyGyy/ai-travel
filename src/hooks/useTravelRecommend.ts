'use client';

import { useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

import { getCsrfHeaders } from '@/api/client';

interface TravelRecommendParams {
  city: string;
  budget: number;
  days: number;
}

export function useTravelRecommend(params: TravelRecommendParams) {
  const { budget, city, days } = params;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/travel/recommend',
        body: { budget, city, days },
        credentials: 'include',
        headers: getCsrfHeaders,
      }),
    [budget, city, days],
  );

  return useChat({
    id: 'travel-recommend',
    transport,
  });
}
