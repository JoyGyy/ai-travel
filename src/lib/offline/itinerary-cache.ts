/**
 * Local-First 高铁/弱网离线日程手账缓存引擎
 * 针对国内旅行中高铁穿越隧道、山区景区无信号痛点，提供离线持久化与秒级访问
 */

import type { ItineraryDayPlan } from '@/stores/itineraryWorkspace';

export interface OfflineItineraryData {
  city: string;
  days: ItineraryDayPlan[];
  hotelNightPrice?: number;
  id: string;
  notes?: string;
  participantCount?: number;
  savedAt: number; // 保存时间戳
  title: string;
  transportMode?: 'driving' | 'transit' | 'walking';
}

export interface OfflineItinerarySummary {
  city: string;
  dayCount: number;
  id: string;
  savedAt: number;
  spotCount: number;
  title: string;
}

const STORAGE_KEY_PREFIX = 'offline_itinerary_';
const INDEX_KEY = 'offline_itineraries_index';

/**
 * 获取环境安全的 LocalStorage 对象
 */
function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

// 内存兜底存储 (用于 SSR / 无持久化环境)
const memoryStore = new Map<string, string>();

function safeGetItem(key: string): string | null {
  const storage = getStorage();
  if (storage) {
    try {
      return storage.getItem(key);
    } catch {
      // 存储超额或私密模式下受限
    }
  }
  return memoryStore.get(key) || null;
}

function safeSetItem(key: string, value: string): void {
  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(key, value);
      return;
    } catch {
      // 存储受限时使用内存
    }
  }
  memoryStore.set(key, value);
}

function safeRemoveItem(key: string): void {
  const storage = getStorage();
  if (storage) {
    try {
      storage.removeItem(key);
    } catch {}
  }
  memoryStore.delete(key);
}

/**
 * 保存行程至本地离线手账
 */
export async function saveOfflineItinerary(
  data: Omit<OfflineItineraryData, 'savedAt'> & { savedAt?: number },
): Promise<void> {
  const finalData: OfflineItineraryData = {
    ...data,
    savedAt: data.savedAt || Date.now(),
  };

  const payload = JSON.stringify(finalData);
  safeSetItem(`${STORAGE_KEY_PREFIX}${finalData.id}`, payload);

  // 更新离线手账索引列表
  const rawIndex = safeGetItem(INDEX_KEY);
  let indexList: OfflineItinerarySummary[] = [];
  if (rawIndex) {
    try {
      indexList = JSON.parse(rawIndex);
    } catch {
      indexList = [];
    }
  }

  const spotCount = finalData.days.reduce(
    (acc, d) => acc + (d.spots ? d.spots.length : 0),
    0,
  );

  const newSummary: OfflineItinerarySummary = {
    id: finalData.id,
    title: finalData.title,
    city: finalData.city,
    dayCount: finalData.days.length,
    spotCount,
    savedAt: finalData.savedAt,
  };

  // 移出旧的同名或同 ID 记录，插入到队首
  indexList = indexList.filter((item) => item.id !== finalData.id);
  indexList.unshift(newSummary);

  // 最多保留 20 份历史离线手账，防止占用过大存储
  if (indexList.length > 20) {
    const evicted = indexList.pop();
    if (evicted) {
      safeRemoveItem(`${STORAGE_KEY_PREFIX}${evicted.id}`);
    }
  }

  safeSetItem(INDEX_KEY, JSON.stringify(indexList));
}

/**
 * 获取最新保存的一份离线手账
 */
export async function getLatestOfflineItinerary(): Promise<OfflineItineraryData | null> {
  const rawIndex = safeGetItem(INDEX_KEY);
  if (!rawIndex) return null;

  try {
    const indexList: OfflineItinerarySummary[] = JSON.parse(rawIndex);
    if (!indexList || indexList.length === 0) return null;

    const latest = indexList[0];
    return getOfflineItineraryById(latest.id);
  } catch {
    return null;
  }
}

/**
 * 根据 ID 获取特定的离线手账
 */
export async function getOfflineItineraryById(
  id: string,
): Promise<OfflineItineraryData | null> {
  const raw = safeGetItem(`${STORAGE_KEY_PREFIX}${id}`);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as OfflineItineraryData;
  } catch {
    return null;
  }
}

/**
 * 列出所有已离线缓存的行程概要
 */
export async function listOfflineItineraries(): Promise<
  OfflineItinerarySummary[]
> {
  const rawIndex = safeGetItem(INDEX_KEY);
  if (!rawIndex) return [];

  try {
    return JSON.parse(rawIndex) as OfflineItinerarySummary[];
  } catch {
    return [];
  }
}

/**
 * 删除指定离线手账
 */
export async function deleteOfflineItinerary(id: string): Promise<void> {
  safeRemoveItem(`${STORAGE_KEY_PREFIX}${id}`);
  const rawIndex = safeGetItem(INDEX_KEY);
  if (rawIndex) {
    try {
      const indexList: OfflineItinerarySummary[] = JSON.parse(rawIndex);
      const filtered = indexList.filter((item) => item.id !== id);
      safeSetItem(INDEX_KEY, JSON.stringify(filtered));
    } catch {}
  }
}

/**
 * 清空所有离线手账
 */
export async function clearAllOfflineItineraries(): Promise<void> {
  const rawIndex = safeGetItem(INDEX_KEY);
  if (rawIndex) {
    try {
      const indexList: OfflineItinerarySummary[] = JSON.parse(rawIndex);
      indexList.forEach((item) => {
        safeRemoveItem(`${STORAGE_KEY_PREFIX}${item.id}`);
      });
    } catch {}
  }
  safeRemoveItem(INDEX_KEY);
  memoryStore.clear();
}

/**
 * 监听客户端网络在线/离线状态
 */
export function subscribeNetworkStatus(
  onChange: (isOnline: boolean) => void,
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleOnline = () => onChange(true);
  const handleOffline = () => onChange(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * 获取当前网络在线状态
 */
export function getIsOnline(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return true;
  }
  return navigator.onLine;
}
