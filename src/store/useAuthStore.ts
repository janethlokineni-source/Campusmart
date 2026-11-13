import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Address } from '@/types';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null, token?: string | null) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  addAddress: (address: Address) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user, token) => {
        if (user) {
          if (user.email?.toLowerCase().includes('janethlokineni')) {
            user.name = user.name || 'Janeth Lokineni';
          } else if (
            !user.name ||
            user.name.toLowerCase().includes('google account') ||
            user.name.toLowerCase().includes('google user')
          ) {
            const prefix = user.email ? user.email.split('@')[0] : '';
            user.name = prefix ? prefix.charAt(0).toUpperCase() + prefix.slice(1) : 'Campus Member';
          }
          if (user.studentId && user.studentId.includes('SSO')) {
            delete (user as any).studentId;
          }
        }
        set({
          user,
          token: token !== undefined ? token : get().token,
          isAuthenticated: !!user,
        });
      },

      logout: async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {
          // ignore
        }
        set({ user: null, token: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        try {
          set({ isLoading: true });
          const res = await fetch('/api/auth/me');
          const data = await res.json();
          if (data.success && data.user) {
            set({ user: data.user, isAuthenticated: true, isLoading: false });
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        } catch (e) {
          set({ isLoading: false });
        }
      },

      addAddress: (address) => {
        const u = get().user;
        if (!u) return;
        const addresses = [...(u.addresses || []), address];
        set({ user: { ...u, addresses } });
      },
    }),
    {
      name: 'campusmart_auth_storage',
      onRehydrateStorage: () => (state) => {
        if (state && state.user) {
          if (state.user.email?.toLowerCase().includes('janethlokineni')) {
            state.user.name = state.user.name || 'Janeth Lokineni';
          } else if (
            !state.user.name ||
            state.user.name.toLowerCase().includes('google account') ||
            state.user.name.toLowerCase().includes('google user')
          ) {
            const prefix = state.user.email ? state.user.email.split('@')[0] : '';
            state.user.name = prefix ? prefix.charAt(0).toUpperCase() + prefix.slice(1) : 'Campus Member';
          }
          if (state.user.studentId && state.user.studentId.includes('SSO')) {
            delete (state.user as any).studentId;
          }
        }
      },
    }
  )
);

