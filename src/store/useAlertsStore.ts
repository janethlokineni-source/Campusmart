import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppNotification, PriceAlertWithProduct } from '@/types';

interface PriceBadgeMeta {
  isLowestIn30Days: boolean;
  hasRecentDrop: boolean;
  dropPercent: number;
}

interface AlertsStoreState {
  alerts: PriceAlertWithProduct[];
  alertsLoaded: boolean;
  loadingAlerts: boolean;
  alertsError: string | null;

  notifications: AppNotification[];
  unreadCount: number;
  loadingNotifications: boolean;
  notificationsError: string | null;

  priceBadges: Record<string, PriceBadgeMeta>;
  badgesLoaded: boolean;

  autoEnableOnWishlist: boolean;
  setAutoEnableOnWishlist: (enabled: boolean) => void;

  fetchAlerts: (force?: boolean) => Promise<void>;
  enableAlert: (productId: string, targetPrice?: number) => Promise<{ ok: boolean; error?: string }>;
  updateAlert: (
    alertId: string,
    updates: { targetPrice?: number | null; active?: boolean }
  ) => Promise<{ ok: boolean; error?: string }>;
  removeAlert: (alertIdOrProductId: string) => Promise<boolean>;

  fetchNotifications: () => Promise<void>;
  markNotificationRead: (notificationId?: string, markAll?: boolean) => Promise<void>;

  fetchPriceBadges: (force?: boolean) => Promise<void>;
  resetSessionData: () => void;
}

let inFlightAlertsPromise: Promise<void> | null = null;
let inFlightBadgesPromise: Promise<void> | null = null;

export const useAlertsStore = create<AlertsStoreState>()(
  persist(
    (set, get) => ({
      alerts: [],
      alertsLoaded: false,
      loadingAlerts: false,
      alertsError: null,

      notifications: [],
      unreadCount: 0,
      loadingNotifications: false,
      notificationsError: null,

      priceBadges: {},
      badgesLoaded: false,

      autoEnableOnWishlist: true,

      setAutoEnableOnWishlist: (enabled) => set({ autoEnableOnWishlist: enabled }),

      fetchAlerts: async (force = false) => {
        if (!force && get().alertsLoaded) return;
        if (inFlightAlertsPromise && !force) return inFlightAlertsPromise;

        const run = async () => {
          set({ loadingAlerts: true, alertsError: null });
          try {
            const res = await fetch('/api/alerts', { method: 'GET' });
            if (res.status === 401) {
              set({ alerts: [], alertsLoaded: true, loadingAlerts: false });
              return;
            }
            const data = (await res.json()) as {
              success?: boolean;
              alerts?: PriceAlertWithProduct[];
              error?: string;
            };
            if (res.ok && data.success && Array.isArray(data.alerts)) {
              set({
                alerts: data.alerts,
                alertsLoaded: true,
                loadingAlerts: false,
              });
            } else {
              set({
                alertsError: data.error || 'Could not load price alerts.',
                loadingAlerts: false,
              });
            }
          } catch {
            set({
              alertsError: 'Network error while loading price alerts.',
              loadingAlerts: false,
            });
          } finally {
            inFlightAlertsPromise = null;
          }
        };

        inFlightAlertsPromise = run();
        return inFlightAlertsPromise;
      },

      enableAlert: async (productId, targetPrice) => {
        try {
          const res = await fetch('/api/alerts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId,
              ...(targetPrice !== undefined ? { targetPrice } : {}),
              active: true,
            }),
          });
          const data = (await res.json()) as { success?: boolean; error?: string };
          if (!res.ok || !data.success) {
            return { ok: false, error: data.error || 'Failed to save alert.' };
          }
          await get().fetchAlerts(true);
          return { ok: true };
        } catch {
          return { ok: false, error: 'Network error while saving price alert.' };
        }
      },

      updateAlert: async (alertId, updates) => {
        try {
          const res = await fetch('/api/alerts', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alertId, ...updates }),
          });
          const data = (await res.json()) as { success?: boolean; error?: string };
          if (!res.ok || !data.success) {
            return { ok: false, error: data.error || 'Failed to update alert.' };
          }
          await get().fetchAlerts(true);
          return { ok: true };
        } catch {
          return { ok: false, error: 'Network error while updating alert.' };
        }
      },

      removeAlert: async (alertIdOrProductId) => {
        try {
          const res = await fetch(
            `/api/alerts?id=${encodeURIComponent(alertIdOrProductId)}`,
            { method: 'DELETE' }
          );
          if (!res.ok) return false;
          set((state) => ({
            alerts: state.alerts.filter(
              (a) => a.id !== alertIdOrProductId && a.productId !== alertIdOrProductId
            ),
          }));
          return true;
        } catch {
          return false;
        }
      },

      fetchNotifications: async () => {
        set({ loadingNotifications: true, notificationsError: null });
        try {
          const res = await fetch('/api/notifications?limit=25', { method: 'GET' });
          if (res.status === 401) {
            set({ notifications: [], unreadCount: 0, loadingNotifications: false });
            return;
          }
          const data = (await res.json()) as {
            success?: boolean;
            notifications?: AppNotification[];
            unreadCount?: number;
            error?: string;
          };
          if (res.ok && data.success) {
            set({
              notifications: data.notifications ?? [],
              unreadCount: data.unreadCount ?? 0,
              loadingNotifications: false,
            });
          } else {
            set({
              notificationsError: data.error || 'Failed to load notifications.',
              loadingNotifications: false,
            });
          }
        } catch {
          set({
            notificationsError: 'Network error while checking notifications.',
            loadingNotifications: false,
          });
        }
      },

      markNotificationRead: async (notificationId, markAll = false) => {
        try {
          const res = await fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notificationId, markAll }),
          });
          const data = (await res.json()) as {
            success?: boolean;
            unreadCount?: number;
          };
          if (res.ok && data.success) {
            set((state) => ({
              notifications: state.notifications.map((n) =>
                markAll || n.id === notificationId ? { ...n, read: true } : n
              ),
              unreadCount: data.unreadCount ?? 0,
            }));
          }
        } catch {
          // Ignore transient read-mark errors cleanly
        }
      },

      fetchPriceBadges: async (force = false) => {
        if (!force && get().badgesLoaded) return;
        if (inFlightBadgesPromise && !force) return inFlightBadgesPromise;

        const run = async () => {
          try {
            const res = await fetch('/api/products/price-badges', { method: 'GET' });
            const data = (await res.json()) as {
              success?: boolean;
              badges?: Record<string, PriceBadgeMeta>;
            };
            if (res.ok && data.success && data.badges) {
              set({ priceBadges: data.badges, badgesLoaded: true });
            }
          } catch {
            // Optional enhancement; never block product UI
          } finally {
            inFlightBadgesPromise = null;
          }
        };

        inFlightBadgesPromise = run();
        return inFlightBadgesPromise;
      },

      resetSessionData: () =>
        set({
          alerts: [],
          alertsLoaded: false,
          notifications: [],
          unreadCount: 0,
        }),
    }),
    {
      name: 'campusmart_alerts_prefs',
      partialize: (state) => ({
        autoEnableOnWishlist: state.autoEnableOnWishlist,
      }),
    }
  )
);

