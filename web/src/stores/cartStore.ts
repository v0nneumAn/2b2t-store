import { create } from 'zustand'

export interface CartItem {
  product_id: string
  name: string
  price_usd: number
  quantity: number
}

interface CartState {
  items: CartItem[]
  addItem: (product: { id: string; name: string; price_usd: number }) => void
  removeItem: (productId: string) => void
  clearCart: () => void
  total: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (product) => {
    const items = get().items
    const existing = items.find((i) => i.product_id === product.id)
    if (existing) {
      set({
        items: items.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      })
    } else {
      set({
        items: [
          ...items,
          { product_id: product.id, name: product.name, price_usd: product.price_usd, quantity: 1 },
        ],
      })
    }
  },
  removeItem: (productId) => {
    set({ items: get().items.filter((i) => i.product_id !== productId) })
  },
  clearCart: () => set({ items: [] }),
  total: () => get().items.reduce((sum, i) => sum + i.price_usd * i.quantity, 0),
}))
