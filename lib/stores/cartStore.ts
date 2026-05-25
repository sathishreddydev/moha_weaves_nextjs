import { syncGuestCart } from '@/lib/guest-cart-sync'
import { guestStorage } from '@/lib/guest-storage'
import { getEffectivePrice } from '@/lib/pricing-utils'
import { getAvailableStock } from '@/lib/stock-utils'
import { CartItemWithProduct } from '@/shared/types'
import { create } from 'zustand'

export interface CartItemStockStatus {
  itemId: string
  outOfStock: boolean
  limitedStock: boolean
  availableStock: number
}

interface CartState {
  items: CartItemWithProduct[]
  loading: boolean
  error: string | null
  updating: string | null
  count: number
  /** Per-item stock validation results, keyed by itemId */
  stockStatus: Record<string, CartItemStockStatus>
  /** True when any item is out of stock or has limited stock below requested qty */
  hasStockIssues: boolean
}

interface CartActions {
  fetchCart: () => Promise<void>
  syncGuestCart: () => Promise<void>
  addToCart: (productId: string, quantity?: number, variantId?: string | null) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeFromCart: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>
  setUpdating: (itemId: string | null) => void
  setError: (error: string | null) => void
  calculateTotal: () => number
  /** Validate all cart items against current stock. Runs synchronously against store data. */
  validateCartStock: () => void
}

type CartStore = CartState & CartActions

// Helper function to get request headers
const getHeaders = () => {
  return { 'Content-Type': 'application/json' };
};

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  updating: null,
  count: 0,
  stockStatus: {},
  hasStockIssues: false,

  fetchCart: async () => {
    try {
      set({ loading: true, error: null })
      
      const response = await fetch('/api/cart', { headers: getHeaders() })
      const data = await response.json()
      
      if (data.success && data.data && !data.isGuest) {
        set({ 
          items: data.data.cart || [],
          count: data.data.count || 0,
          loading: false 
        })
      } else {
        // Guest user — load from localStorage
        const guestCart = guestStorage.cart.get()
        set({ 
          items: guestCart as any,
          count: guestStorage.cart.getCount(),
          loading: false 
        })
      }
    } catch (error) {
      const guestCart = guestStorage.cart.get()
      set({ 
        items: guestCart as any,
        count: guestStorage.cart.getCount(),
        loading: false 
      })
    }
  },

  syncGuestCart: async () => {
    try {
      set({ loading: true, error: null })
      
      const result = await syncGuestCart({
        validateStock: true,
        updatePrices: true,
        removeOutOfStock: false
      })
      
      // Update store with synced cart
      set({ 
        items: result.cart as any,
        count: result.cart.reduce((total, item) => total + item.quantity, 0),
        loading: false 
      })
      
    } catch (error) {
      set({ 
        error: 'Failed to sync cart',
        loading: false 
      })
    }
  },

  addToCart: async (productId: string, quantity = 1, variantId = null) => {
    try {
      set({ updating: productId })
      
      // Try API first (cookies handle auth)
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ productId, quantity, variantId })
      })
      const data = await response.json()
      
      if (data.success && data.data) {
        set({ 
          items: data.data.cart || [],
          count: data.data.count || 0,
          updating: null 
        })
        get().validateCartStock()
        return
      }
      
      // If not a guest/401 error, show the error
      if (response.status !== 401 && !data.isGuest) {
        set({ error: data.error || 'Failed to add to cart', updating: null })
        return
      }
      
      // Guest user — add to localStorage with product details
      try {
        const productResponse = await fetch(`/api/products/${productId}`);
        const productData = await productResponse.json();
        
        if (productData.success && productData.data) {
          const p = productData.data;
          const variant = variantId ? p.variants?.find((v: any) => v.id === variantId) : null;
          const stock = variant ? (variant.onlineStock || 0) : (p.variants?.length 
            ? p.variants.reduce((sum: number, v: any) => sum + (v.onlineStock || 0), 0)
            : p.onlineStock || 0);
          
          const existingCart = guestStorage.cart.get();
          const existingItem = existingCart.find(
            (item) => item.productId === productId && item.variantId === (variantId || undefined)
          );
          const currentQty = existingItem?.quantity || 0;
          
          if (currentQty + quantity > stock) {
            set({ error: `Only ${stock} items available in stock.`, updating: null })
            return
          }
          
          guestStorage.cart.add({
            productId,
            quantity,
            variantId: variantId || undefined,
            product: {
              id: p.id,
              name: p.name,
              description: p.description,
              price: p.price,
              discountedPrice: p.discountedPrice,
              activeSale: p.activeSale || null,
              variants: p.variants || [],
              categoryId: p.categoryId,
              subcategoryId: p.subcategoryId,
              colorId: p.colorId,
              fabricId: p.fabricId,
              imageUrl: p.imageUrl,
              images: p.images || [],
              videoUrl: p.videoUrl,
              sku: p.sku,
              totalStock: p.totalStock,
              onlineStock: p.onlineStock,
              distributionChannel: p.distributionChannel,
              isActive: p.isActive,
              isFeatured: p.isFeatured,
              createdAt: p.createdAt,
              updatedAt: p.updatedAt,
              category: p.category,
              subcategory: p.subcategory,
              color: p.color,
              fabric: p.fabric,
            }
          })
        } else {
          guestStorage.cart.add({ productId, quantity, variantId: variantId || undefined })
        }
      } catch (productError) {
        guestStorage.cart.add({ productId, quantity, variantId: variantId || undefined })
      }
      
      const guestCart = guestStorage.cart.get()
      set({ 
        items: guestCart as any,
        count: guestStorage.cart.getCount(),
        updating: null 
      })
      get().validateCartStock()
    } catch (error) {
      set({ error: 'An error occurred while adding to cart', updating: null })
    }
  },

  updateQuantity: async (itemId: string, quantity: number) => {
    if (quantity < 1) return

    try {
      set({ updating: itemId })
      
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ id: itemId, quantity })
      })
      const data = await response.json()
      
      if (data.success && data.data) {
        set({ 
          items: data.data.cart || [],
          count: data.data.count || 0,
          updating: null 
        })
        get().validateCartStock()
        return
      }
      
      // If unauthorized (guest), update localStorage
      if (response.status === 401 || data.isGuest) {
        guestStorage.cart.update(itemId, quantity)
        const guestCart = guestStorage.cart.get()
        set({ 
          items: guestCart as any,
          count: guestStorage.cart.getCount(),
          updating: null 
        })
        get().validateCartStock()
        return
      }
      
      set({ 
        error: data.error || 'Failed to update quantity',
        updating: null 
      })
    } catch (error) {
      set({ 
        error: 'An error occurred while updating quantity',
        updating: null 
      })
    }
  },

  removeFromCart: async (itemId: string) => {
    try {
      set({ updating: itemId })
      
      const response = await fetch(`/api/cart?id=${itemId}`, {
        method: 'DELETE',
        headers: getHeaders()
      })
      const data = await response.json()
      
      if (data.success) {
        const { stockStatus } = get()
        const newStockStatus = { ...stockStatus }
        delete newStockStatus[itemId]
        const hasStockIssues = Object.values(newStockStatus).some((s) => s.outOfStock || s.limitedStock)
        set({ 
          items: data.data.cart || [],
          count: data.data.count || 0,
          stockStatus: newStockStatus,
          hasStockIssues,
          updating: null 
        })
        return
      }
      
      // If unauthorized (guest), remove from localStorage
      if (response.status === 401 || data.isGuest) {
        guestStorage.cart.remove(itemId)
        const guestCart = guestStorage.cart.get()
        const { stockStatus } = get()
        const newStockStatus = { ...stockStatus }
        delete newStockStatus[itemId]
        const hasStockIssues = Object.values(newStockStatus).some((s) => s.outOfStock || s.limitedStock)
        set({ 
          items: guestCart as any,
          count: guestStorage.cart.getCount(),
          stockStatus: newStockStatus,
          hasStockIssues,
          updating: null 
        })
        return
      }
      
      set({ 
        error: data.error || 'Failed to remove from cart',
        updating: null 
      })
    } catch (error) {
      set({ 
        error: 'An error occurred while removing from cart',
        updating: null 
      })
    }
  },

  clearCart: async () => {
    try {
      set({ updating: 'all' })
      
      const response = await fetch('/api/cart?clear=true', {
        method: 'DELETE',
        headers: getHeaders()
      })
      const data = await response.json()
      
      if (data.success) {
        set({ items: [], count: 0, stockStatus: {}, hasStockIssues: false, updating: null })
        return
      }
      
      // If unauthorized (guest), clear localStorage
      if (response.status === 401 || data.isGuest) {
        guestStorage.cart.clear()
        set({ items: [], count: 0, stockStatus: {}, hasStockIssues: false, updating: null })
        return
      }
      
      set({ error: data.error || 'Failed to clear cart', updating: null })
    } catch (error) {
      set({ error: 'An error occurred while clearing cart', updating: null })
    }
  },

  validateCartStock: () => {
    const { items } = get()
    if (items.length === 0) {
      set({ stockStatus: {}, hasStockIssues: false })
      return
    }

    // Cart items already carry fresh product/variant stock data from the last
    // fetchCart / addToCart / updateQuantity call — no extra API round-trip needed.
    const newStatus: Record<string, CartItemStockStatus> = {}
    for (const item of items) {
      const availableStock = getAvailableStock(item.product, item.variantId)
      const outOfStock = availableStock === 0
      const limitedStock = !outOfStock && availableStock < item.quantity
      newStatus[item.id] = { itemId: item.id, outOfStock, limitedStock, availableStock }
    }
    const hasStockIssues = Object.values(newStatus).some((s) => s.outOfStock || s.limitedStock)
    set({ stockStatus: newStatus, hasStockIssues })
  },

  setUpdating: (itemId: string | null) => {
    set({ updating: itemId })
  },

  setError: (error: string | null) => {
    set({ error })
  },

  calculateTotal: () => {
    const { items } = get()
    return items.reduce((total, item) => {
      const product = item.product as any;
      const variant = item.variantId
        ? product.variants?.find((v: any) => v.id === item.variantId)
        : null;
      const variantPrice = variant?.price ? parseFloat(variant.price) : null;
      const price = variantPrice ?? getEffectivePrice(product);
      return total + (price * item.quantity);
    }, 0);
  },
}))

