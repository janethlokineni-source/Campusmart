import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types';

interface WishlistStore {
  items: Product[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  toggleItem: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        set((state) => {
          if (state.items.some((p) => p.id === product.id)) return state;
          return { items: [...state.items, product] };
        });
      },
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((p) => p.id !== productId),
        }));
      },
      toggleItem: (product) => {
        set((state) => {
          const exists = state.items.some((p) => p.id === product.id);
          if (exists) {
            return { items: state.items.filter((p) => p.id !== product.id) };
          } else {
            return { items: [...state.items, product] };
          }
        });
      },
      isInWishlist: (productId) => {
        return get().items.some((p) => p.id === productId);
      },
      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'campusmart_wishlist_storage',
    }
  )
);

