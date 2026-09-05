import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      
      addToCart: (product) => set((state) => {
        const existingItem = state.items.find(item => item.product_id === product.id);
        if (existingItem) {
          return {
            items: state.items.map(item => 
              item.product_id === product.id 
                ? { ...item, quantity: item.quantity + 1 } 
                : item
            )
          };
        }
        return { 
          items: [...state.items, { 
            product_id: product.id, 
            name: product.name, 
            price: product.sales_price, 
            quantity: 1,
            image: product.image || 'https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&q=80&w=400' 
          }] 
        };
      }),

      removeFromCart: (productId) => set((state) => ({
        items: state.items.filter(item => item.product_id !== productId)
      })),

      updateQuantity: (productId, quantity) => set((state) => ({
        items: state.items.map(item => 
          item.product_id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
        )
      })),

      clearCart: () => set({ items: [] }),
      
      getTotal: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },
      
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      }
    }),
    {
      name: 'valora-cart',
    }
  )
);
