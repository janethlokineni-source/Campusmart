import { create } from 'zustand';
import { StoreStatus } from '@/types';

interface StoreStatusState {
  status: StoreStatus | null;
  isLoading: boolean;
  error: string | null;
  fetchStatus: () => Promise<void>;
  isOrderingAvailable: () => boolean;
}

export const useStoreStatusStore = create<StoreStatusState>((set, get) => ({
  status: null,
  isLoading: false,
  error: null,

  fetchStatus: async () => {
    try {
      set({ isLoading: true, error: null });
      const res = await fetch('/api/store-status');
      const data = await res.json();
      if (data.success) {
        set({
          status: {
            isOpen: data.isOpen,
            currentDay: data.currentDay,
            currentDayNumber: data.currentDayNumber,
            currentTimeString: data.currentTimeString,
            nextOpenAt: data.nextOpenAt,
            message: data.message,
            timezone: data.timezone,
            openingHours: data.openingHours,
            isOverride: data.isOverride,
          },
          isLoading: false,
        });
      } else {
        set({ error: data.error || 'Failed to check status', isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message || 'Network error', isLoading: false });
    }
  },

  isOrderingAvailable: () => {
    const s = get().status;
    return s ? s.isOpen : true; // optimistic until fetched
  },
}));

