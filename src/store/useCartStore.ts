import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, CartItem, Coupon } from '@/types';

interface CartStore {
  items: CartItem[];
  savedForLater: CartItem[];
  appliedCoupon: Coupon | null;
  couponDiscount: number;
  
  // Actions
  addItem: (product: Product, quantity?: number, selectedOption?: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  
  moveToSavedForLater: (productId: string) => void;
  moveToCart: (productId: string) => void;
  removeFromSavedForLater: (productId: string) => void;
  
  applyCoupon: (coupon: Coupon, discount: number) => void;
  removeCoupon: () => void;
  
  // Computed helpers
  getCartCount: () => number;
  getSubtotal: () => number;
  getMrpTotal: () => number;
  getTotalDiscount: () => number;
  getDeliveryFee: () => number;
  getPlatformFee: () => number;
  getFinalTotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      savedForLater: [],
      appliedCoupon: null,
      couponDiscount: 0,

      addItem: (product, quantity = 1, selectedOption) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => i.product.id === product.id && i.selectedOption === selectedOption
          );

          if (existingIndex > -1) {
            const updated = [...state.items];
            const newQty = Math.min(product.stock, updated[existingIndex].quantity + quantity);
            updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
            return { items: updated };
          } else {
            return {
              items: [...state.items, { product, quantity: Math.min(product.stock, quantity), selectedOption }],
            };
          }
        });
      },

      updateQuantity: (productId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((i) => i.product.id !== productId) };
          }
          const updated = state.items.map((i) => {
            if (i.product.id === productId) {
              return { ...i, quantity: Math.min(i.product.stock, quantity) };
            }
            return i;
          });
          return { items: updated };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.product.id !== productId),
        }));
      },

      clearCart: () => {
        set({ items: [], appliedCoupon: null, couponDiscount: 0 });
      },

      moveToSavedForLater: (productId) => {
        set((state) => {
          const target = state.items.find((i) => i.product.id === productId);
          if (!target) return state;
          return {
            items: state.items.filter((i) => i.product.id !== productId),
            savedForLater: [...state.savedForLater.filter((i) => i.product.id !== productId), target],
          };
        });
      },

      moveToCart: (productId) => {
        set((state) => {
          const target = state.savedForLater.find((i) => i.product.id === productId);
          if (!target) return state;
          return {
            savedForLater: state.savedForLater.filter((i) => i.product.id !== productId),
            items: [...state.items.filter((i) => i.product.id !== productId), target],
          };
        });
      },

      removeFromSavedForLater: (productId) => {
        set((state) => ({
          savedForLater: state.savedForLater.filter((i) => i.product.id !== productId),
        }));
      },

      applyCoupon: (coupon, discount) => {
        set({ appliedCoupon: coupon, couponDiscount: discount });
      },

      removeCoupon: () => {
        set({ appliedCoupon: null, couponDiscount: 0 });
      },

      getCartCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      },

      getMrpTotal: () => {
        return get().items.reduce((sum, item) => sum + item.product.mrp * item.quantity, 0);
      },

      getTotalDiscount: () => {
        const mrp = get().getMrpTotal();
        const subtotal = get().getSubtotal();
        return Math.max(0, mrp - subtotal);
      },

      getDeliveryFee: () => {
        const subtotal = get().getSubtotal();
        if (subtotal === 0) return 0;
        return subtotal >= 99 ? 0 : 15;
      },

      getPlatformFee: () => {
        return get().items.length > 0 ? 5 : 0;
      },

      getFinalTotal: () => {
        const subtotal = get().getSubtotal();
        if (subtotal === 0) return 0;
        const discount = get().couponDiscount;
        const delivery = get().getDeliveryFee();
        const platform = get().getPlatformFee();
        return Math.max(0, subtotal - discount + delivery + platform);
      },
    }),
    {
      name: 'campusmart_cart_storage',
    }
  )
);

