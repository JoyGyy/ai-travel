import type { ParsedRouteData } from '@/lib/map/route-parser';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import {
  calculateDistanceKm,
  estimateDurationMinutes,
  formatMinutesText,
  getSpotCoordinates,
} from '@/lib/map/amap';
import { lookupAttractionInfo } from '@/lib/map/attraction-lookup';

import { resolveSpotBookingResource } from '@/lib/booking/budget-calculator';
import {
  getIsOnline,
  getLatestOfflineItinerary,
  saveOfflineItinerary,
} from '@/lib/offline/itinerary-cache';
import type { DomesticBookingResource } from '@/types/booking';

export interface WorkspaceSpotNode {
  address: string;
  bookingResource?: DomesticBookingResource;
  city: string;
  coverImage: string;
  id: string;
  lat: number;
  lng: number;
  name: string;
  notes?: string;
  openingHours: string;
  period?: '早晨' | '上午' | '中午' | '下午' | '傍晚' | '夜间' | '全天';
  priceText: string;
  rating: number;
  recommendedDuration: string;
  reviewCount: number;
  summary: string;
  tags: string[];
  ticketType: 'free' | 'paid';
}

export interface WorkspaceLeg {
  distanceKm: number;
  durationMins: number;
  durationText: string;
  fromSpotId: string;
  fromSpotName: string;
  mode: 'driving' | 'transit' | 'walking';
  toSpotId: string;
  toSpotName: string;
}

export interface ItineraryDayPlan {
  day: number;
  legs: WorkspaceLeg[];
  notes?: string;
  spots: WorkspaceSpotNode[];
  theme?: string;
  title: string;
}

export type ResourceCategory =
  | 'attractions'
  | 'hotels'
  | 'restaurants'
  | 'shopping'
  | 'transport';

export interface ItineraryWorkspaceState {
  activeCategory: ResourceCategory;
  activeSpotId: string | null;
  addDay: () => void;
  addFromUnassignedToDay: (unassignedIndex: number, toDay: number) => void;
  addSpotToDay: (
    dayNum: number,
    spot: Partial<WorkspaceSpotNode> & { name: string },
  ) => void;
  city: string;
  clearWorkspace: () => void;
  days: ItineraryDayPlan[];
  hotelNightPrice: number;
  initFromParsedRoute: (data: ParsedRouteData, promptTitle?: string) => void;
  isGenerating: boolean;
  isOffline: boolean;
  moveSpotBetweenDays: (
    fromDay: number,
    fromIndex: number,
    toDay: number,
    toIndex: number,
  ) => void;
  moveSpotInDay: (dayNum: number, fromIndex: number, toIndex: number) => void;
  moveToUnassigned: (dayNum: number, spotIndex: number) => void;
  participantCount: number;
  removeDay: (dayNum: number) => void;
  removeSpotFromDay: (dayNum: number, spotIndex: number) => void;
  restoreFromOfflineCache: () => Promise<boolean>;
  selectedDay: number; // 0 = 总览, 1 = Day 1, 2 = Day 2...
  setActiveCategory: (cat: ResourceCategory) => void;
  setActiveSpotId: (id: string | null) => void;
  setHotelNightPrice: (price: number) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setIsOffline: (isOffline: boolean) => void;
  setParticipantCount: (count: number) => void;
  setSelectedDay: (day: number) => void;
  syncToOfflineCache: () => Promise<void>;
  setStartDate: (date: string) => void;
  setTitle: (title: string) => void;
  setTransportMode: (mode: 'driving' | 'transit' | 'walking') => void;
  setViewMode: (mode: 'cards' | 'list') => void;
  startDate: string;
  title: string;
  transportMode: 'driving' | 'transit' | 'walking';
  unassignedSpots: WorkspaceSpotNode[];
  updateDayNotes: (dayNum: number, notes: string) => void;
  updateDayTitle: (dayNum: number, title: string) => void;
  viewMode: 'cards' | 'list';
}

/**
 * 重新计算指定单日的两两通勤段落 (Legs)
 */
function recalculateLegs(
  spots: WorkspaceSpotNode[],
  mode: 'driving' | 'transit' | 'walking',
): WorkspaceLeg[] {
  if (spots.length < 2) return [];

  const legs: WorkspaceLeg[] = [];
  for (let i = 0; i < spots.length - 1; i++) {
    const from = spots[i];
    const to = spots[i + 1];
    const distKm = calculateDistanceKm(from.lat, from.lng, to.lat, to.lng);
    const durationMins = estimateDurationMinutes(distKm, mode);

    legs.push({
      distanceKm: distKm,
      durationMins,
      durationText: formatMinutesText(durationMins),
      fromSpotId: from.id,
      fromSpotName: from.name,
      mode,
      toSpotId: to.id,
      toSpotName: to.name,
    });
  }
  return legs;
}

/**
 * 补全景点节点为标准的 WorkspaceSpotNode
 */
function buildSpotNode(
  rawName: string,
  cityName: string,
  idx = 0,
  overrides: Partial<WorkspaceSpotNode> = {},
): WorkspaceSpotNode {
  const cleanName = rawName.trim();
  const info = lookupAttractionInfo(cleanName, cityName);
  const coord = getSpotCoordinates(cleanName, cityName, idx);

  return {
    address: overrides.address || info.address || `${cityName}市区`,
    bookingResource:
      overrides.bookingResource ||
      resolveSpotBookingResource(
        cleanName,
        cityName,
        (overrides.ticketType || info.ticketType) as 'free' | 'paid',
        overrides.priceText || info.priceText,
      ),
    city: cityName,
    coverImage: overrides.coverImage || info.coverImage,
    id: overrides.id || `${cityName}-${cleanName}-${idx}`,
    lat: overrides.lat || coord.lat,
    lng: overrides.lng || coord.lng,
    name: cleanName,
    notes: overrides.notes || '',
    openingHours: overrides.openingHours || info.openingHours,
    period: overrides.period || '上午',
    priceText: overrides.priceText || info.priceText,
    rating: overrides.rating || info.rating,
    recommendedDuration:
      overrides.recommendedDuration || info.recommendedDuration,
    reviewCount: overrides.reviewCount || info.reviewCount,
    summary: overrides.summary || info.summary,
    tags: overrides.tags || info.tags,
    ticketType: overrides.ticketType || info.ticketType,
  };
}

export const useItineraryWorkspaceStore = create<ItineraryWorkspaceState>()(
  devtools(
    immer((set) => ({
      activeCategory: 'attractions',
      activeSpotId: null,
      city: '杭州',
      days: [],
      hotelNightPrice: 320,
      isGenerating: false,
      isOffline: !getIsOnline(),
      participantCount: 1,
      selectedDay: 1,
      startDate: '',
      title: '旅行行程规划手账',
      transportMode: 'driving',
      unassignedSpots: [],
      viewMode: 'cards',

      addDay: () =>
        set((state) => {
          const nextDayNum = state.days.length + 1;
          state.days.push({
            day: nextDayNum,
            legs: [],
            spots: [],
            title: `第 ${nextDayNum} 天行程探索`,
          });
          state.selectedDay = nextDayNum;
        }),

      addFromUnassignedToDay: (unassignedIndex, toDay) =>
        set((state) => {
          if (state.unassignedSpots[unassignedIndex] === undefined) return;
          const targetDay = state.days.find((d) => d.day === toDay);
          if (!targetDay) return;

          const [movedSpot] = state.unassignedSpots.splice(unassignedIndex, 1);
          targetDay.spots.push(movedSpot);
          targetDay.legs = recalculateLegs(
            targetDay.spots,
            state.transportMode,
          );
        }),

      addSpotToDay: (dayNum, spot) =>
        set((state) => {
          const targetDay = state.days.find((d) => d.day === dayNum);
          if (!targetDay) return;

          const newSpot = buildSpotNode(
            spot.name,
            state.city,
            targetDay.spots.length,
            spot,
          );
          targetDay.spots.push(newSpot);
          targetDay.legs = recalculateLegs(
            targetDay.spots,
            state.transportMode,
          );
        }),

      clearWorkspace: () =>
        set((state) => {
          state.days = [];
          state.unassignedSpots = [];
          state.selectedDay = 1;
          state.activeSpotId = null;
          state.title = '新建行程';
        }),

      initFromParsedRoute: (data, promptTitle) =>
        set((state) => {
          // 路线指纹比对：如果打卡点列表与城市无变动，避免覆盖已有数据和触发级联重绘
          const incomingSpotsSig =
            data.days && data.days.length > 0
              ? data.days.flatMap((d) => d.spots.map((s) => s.name)).join('|')
              : (data.spots || []).map((s) => s.name).join('|');
          const currentSpotsSig = state.days
            .flatMap((d) => d.spots.map((s) => s.name))
            .join('|');

          const isSameContent =
            incomingSpotsSig &&
            incomingSpotsSig === currentSpotsSig &&
            state.city === (data.city || state.city);

          if (isSameContent) {
            if (promptTitle && state.title !== promptTitle) {
              state.title = promptTitle;
            }
            return;
          }

          state.city = data.city || state.city;
          state.transportMode = data.transportMode || 'driving';
          if (promptTitle) {
            state.title = promptTitle;
          } else if (data.city) {
            const dayCount = data.days.length || 1;
            state.title = `${data.city}${dayCount}天${Math.max(1, dayCount - 1)}晚专属行程规划`;
          }

          const newDays: ItineraryDayPlan[] = [];

          if (data.days && data.days.length > 0) {
            data.days.forEach((d, dayIdx) => {
              const daySpots: WorkspaceSpotNode[] = d.spots.map((s, spotIdx) =>
                buildSpotNode(s.name, data.city, spotIdx, {
                  address: s.address,
                  coverImage: s.coverImage,
                  id: s.id
                    ? `${s.id}-d${d.day}-${spotIdx}`
                    : `spot-${d.day}-${spotIdx}`,
                  openingHours: s.openHours,
                  period: s.period,
                  priceText: s.priceText,
                  rating: s.rating,
                  recommendedDuration: s.durationText,
                  reviewCount: s.reviewCount,
                  ticketType: s.ticketType,
                }),
              );

              newDays.push({
                day: d.day || dayIdx + 1,
                legs: recalculateLegs(daySpots, data.transportMode),
                spots: daySpots,
                theme: d.theme || '',
                title: d.title || `第 ${d.day || dayIdx + 1} 天行程`,
              });
            });
          } else if (data.spots && data.spots.length > 0) {
            const daySpots: WorkspaceSpotNode[] = data.spots.map((s, spotIdx) =>
              buildSpotNode(s.name, data.city, spotIdx, {
                address: s.address,
                coverImage: s.coverImage,
                id: `spot-1-${spotIdx}`,
                openingHours: s.openHours,
                period: s.period,
                priceText: s.priceText,
                rating: s.rating,
                recommendedDuration: s.durationText,
                reviewCount: s.reviewCount,
                ticketType: s.ticketType,
              }),
            );

            newDays.push({
              day: 1,
              legs: recalculateLegs(daySpots, data.transportMode),
              spots: daySpots,
              title: `${data.city}经典精选路线`,
            });
          }

          state.days = newDays;
          state.selectedDay = 1;
          const stillExists = newDays.some((d) =>
            d.spots.some((s) => s.id === state.activeSpotId),
          );
          if (!stillExists) {
            state.activeSpotId = newDays[0]?.spots[0]?.id || null;
          }

          setTimeout(() => {
            void useItineraryWorkspaceStore.getState().syncToOfflineCache();
          }, 0);
        }),

      moveSpotBetweenDays: (fromDay, fromIndex, toDay, toIndex) =>
        set((state) => {
          const srcDay = state.days.find((d) => d.day === fromDay);
          const destDay = state.days.find((d) => d.day === toDay);
          if (!srcDay || !destDay) return;
          if (srcDay.spots[fromIndex] === undefined) return;

          const [moved] = srcDay.spots.splice(fromIndex, 1);
          const insertIdx = Math.min(toIndex, destDay.spots.length);
          destDay.spots.splice(insertIdx, 0, moved);

          srcDay.legs = recalculateLegs(srcDay.spots, state.transportMode);
          destDay.legs = recalculateLegs(destDay.spots, state.transportMode);
        }),

      moveSpotInDay: (dayNum, fromIndex, toIndex) =>
        set((state) => {
          const day = state.days.find((d) => d.day === dayNum);
          if (!day || day.spots[fromIndex] === undefined) return;
          const [moved] = day.spots.splice(fromIndex, 1);
          const insertIdx = Math.min(toIndex, day.spots.length);
          day.spots.splice(insertIdx, 0, moved);
          day.legs = recalculateLegs(day.spots, state.transportMode);
        }),

      moveToUnassigned: (dayNum, spotIndex) =>
        set((state) => {
          const day = state.days.find((d) => d.day === dayNum);
          if (!day || day.spots[spotIndex] === undefined) return;
          const [moved] = day.spots.splice(spotIndex, 1);
          state.unassignedSpots.push(moved);
          day.legs = recalculateLegs(day.spots, state.transportMode);
        }),

      removeDay: (dayNum) =>
        set((state) => {
          const targetDay = state.days.find((d) => d.day === dayNum);
          if (targetDay && targetDay.spots.length > 0) {
            state.unassignedSpots.push(...targetDay.spots);
          }
          state.days = state.days.filter((d) => d.day !== dayNum);
          // 重新排序天数
          state.days.forEach((d, idx) => {
            d.day = idx + 1;
          });
          state.selectedDay = Math.min(
            state.selectedDay,
            Math.max(1, state.days.length),
          );
        }),

      removeSpotFromDay: (dayNum, spotIndex) =>
        set((state) => {
          const day = state.days.find((d) => d.day === dayNum);
          if (!day || day.spots[spotIndex] === undefined) return;
          day.spots.splice(spotIndex, 1);
          day.legs = recalculateLegs(day.spots, state.transportMode);
        }),

      setActiveCategory: (cat) =>
        set((state) => {
          state.activeCategory = cat;
        }),

      setActiveSpotId: (id) =>
        set((state) => {
          state.activeSpotId = id;
        }),

      setIsGenerating: (isGenerating) =>
        set((state) => {
          state.isGenerating = isGenerating;
        }),

      setHotelNightPrice: (price) =>
        set((state) => {
          state.hotelNightPrice = Math.max(0, price);
        }),

      setParticipantCount: (count) =>
        set((state) => {
          state.participantCount = Math.max(1, count);
        }),

      setIsOffline: (isOffline) =>
        set((state) => {
          state.isOffline = isOffline;
        }),

      setSelectedDay: (day) =>
        set((state) => {
          state.selectedDay = day;
        }),

      syncToOfflineCache: async () => {
        const current = useItineraryWorkspaceStore.getState();
        if (current.days.length === 0) return;
        await saveOfflineItinerary({
          id: `${current.city}-${current.title || '行程'}`,
          title: current.title,
          city: current.city,
          days: current.days,
          participantCount: current.participantCount,
          hotelNightPrice: current.hotelNightPrice,
          transportMode: current.transportMode,
        });
      },

      restoreFromOfflineCache: async () => {
        const latest = await getLatestOfflineItinerary();
        if (!latest || !latest.days || latest.days.length === 0) return false;
        set((state) => {
          state.city = latest.city;
          state.title = latest.title;
          state.days = latest.days;
          state.participantCount = latest.participantCount || 1;
          state.hotelNightPrice = latest.hotelNightPrice || 320;
          state.transportMode = latest.transportMode || 'driving';
          state.selectedDay = 1;
        });
        return true;
      },

      setStartDate: (date) =>
        set((state) => {
          state.startDate = date;
        }),

      setTitle: (title) =>
        set((state) => {
          state.title = title;
        }),

      setTransportMode: (mode) =>
        set((state) => {
          state.transportMode = mode;
          state.days.forEach((d) => {
            d.legs = recalculateLegs(d.spots, mode);
          });
        }),

      setViewMode: (mode) =>
        set((state) => {
          state.viewMode = mode;
        }),

      updateDayNotes: (dayNum, notes) =>
        set((state) => {
          const day = state.days.find((d) => d.day === dayNum);
          if (day) day.notes = notes;
        }),

      updateDayTitle: (dayNum, title) =>
        set((state) => {
          const day = state.days.find((d) => d.day === dayNum);
          if (day) day.title = title;
        }),
    })),
    { name: 'itinerary-workspace' },
  ),
);
