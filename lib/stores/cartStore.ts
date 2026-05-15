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

// Helper function to get valid auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    // Basic validation: check if token looks like a JWT (3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length === 3) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      // Remove invalid token
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }
  
  return headers;
};

// Helper function to handle auth errors
const handleAuthError = (error: any) => {
  if (error?.error === 'Unauthorized' || error?.message?.includes('invalid signature')) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    // Redirect to login page
    window.location.href = '/login';
  }
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
      
      const headers = getAuthHeaders();
      
      // For now, always try API first - it will handle guest users appropriately
      const response = await fetch('/api/cart', { headers })
      const data = await response.json()
      
      if (data.success && data.data) {
        set({ 
          items: data.data.cart || [],
          count: data.data.count || 0,
          loading: false 
        })
      } else {
        // If API fails for guest users, try localStorage
        if (data.isGuest) {
          const guestCart = guestStorage.cart.get()
          set({ 
            items: guestCart as any, // Type assertion for compatibility
            count: guestStorage.cart.getCount(),
            loading: false 
          })
        } else {
          handleAuthError(data);
          set({ 
            error: data.error || 'Failed to fetch cart',
            loading: false 
          })
        }
      }
    } catch (error) {
      handleAuthError(error);
      set({ 
        error: 'An error occurred while fetching your cart',
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
      
      // Show sync notifications if there were changes
      if (result.updated > 0 || result.removed > 0) {
      }
      
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
      
      const headers = getAuthHeaders();
      
      // Try API first
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          productId,
          quantity,
          variantId
        })
      })
      const data = await response.json()
      
      if (data.success && data.data) {
        set({ 
          items: data.data.cart || [],
          count: data.data.count || 0,
          updating: null 
        })
        get().validateCartStock()
      } else if (data.isGuest) {
        // Handle guest user - fetch product details first
        try {
          // Fetch product details for guest cart
          const productResponse = await fetch(`/api/products/${productId}`);
          const productData = await productResponse.json();
          
          if (productData.success && productData.data) {
            guestStorage.cart.add({
              productId,
              quantity,
              variantId: variantId || undefined,
              product: {
                id: productData.data.id,
                name: productData.data.name,
                description: productData.data.description,
                price: productData.data.price,
                categoryId: productData.data.categoryId,
                subcategoryId: productData.data.subcategoryId,
                colorId: productData.data.colorId,
                fabricId: productData.data.fabricId,
                imageUrl: productData.data.imageUrl,
                images: productData.data.images || [],
                videoUrl: productData.data.videoUrl,
                sku: productData.data.sku,
                totalStock: productData.data.totalStock,
                onlineStock: productData.data.onlineStock,
                distributionChannel: productData.data.distributionChannel,
                isActive: productData.data.isActive,
                isFeatured: productData.data.isFeatured,
                createdAt: productData.data.createdAt,
                updatedAt: productData.data.updatedAt,
                // Related data
                category: productData.data.category,
                subcategory: productData.data.subcategory,
                color: productData.data.color,
                fabric: productData.data.fabric,
              }
            })
          } else {
            // Fallback without product details
            guestStorage.cart.add({
              productId,
              quantity,
              variantId: variantId || undefined
            })
          }
        } catch (productError) {
          // Fallback without product details
          guestStorage.cart.add({
            productId,
            quantity,
            variantId: variantId || undefined
          })
        }
        
        const guestCart = guestStorage.cart.get()
        set({ 
          items: guestCart as any,
          count: guestStorage.cart.getCount(),
          updating: null 
        })
        get().validateCartStock()
      } else {
        handleAuthError(data);
        set({ 
          error: data.error || 'Failed to add to cart',
          updating: null 
        })
      }
    } catch (error) {
      set({ 
        error: 'An error occurred while adding to cart',
        updating: null 
      })
    }
  },

  updateQuantity: async (itemId: string, quantity: number) => {
    if (quantity < 1) return

    try {
      set({ updating: itemId })
      
      const headers = getAuthHeaders();
      
      // Try API first
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          id: itemId,
          quantity
        })
      })
      const data = await response.json()
      
      if (data.success && data.data) {
        set({ 
          items: data.data.cart || [],
          count: data.data.count || 0,
          updating: null 
        })
        get().validateCartStock()
      } else if (data.isGuest) {
        // Handle guest user - use localStorage
        guestStorage.cart.update(itemId, quantity)
        
        const guestCart = guestStorage.cart.get()
        set({ 
          items: guestCart as any,
          count: guestStorage.cart.getCount(),
          updating: null 
        })
        get().validateCartStock()
      } else {
        handleAuthError(data);
        set({ 
          error: data.error || 'Failed to update quantity',
          updating: null 
        })
      }
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
      
      const headers = getAuthHeaders();
      
      // Try API first
      const response = await fetch(`/api/cart?id=${itemId}`, {
        method: 'DELETE',
        headers
      })
      const data = await response.json()
      
      if (data.success) {
        // Remove stale stock status entry for this item
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
      } else if (data.isGuest) {
        // Handle guest user - use localStorage
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
      } else {
        handleAuthError(data);
        set({ 
          error: data.error || 'Failed to remove from cart',
          updating: null 
        })
      }
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
      
      const headers = getAuthHeaders();
      
      // Try API first
      const response = await fetch('/api/cart?clear=true', {
        method: 'DELETE',
        headers
      })
      const data = await response.json()
      
      if (data.success) {
        set({ 
          items: [],
          count: 0,
          stockStatus: {},
          hasStockIssues: false,
          updating: null 
        })
      } else if (data.isGuest) {
        // Handle guest user - use localStorage
        guestStorage.cart.clear()
        
        set({ 
          items: [],
          count: 0,
          stockStatus: {},
          hasStockIssues: false,
          updating: null 
        })
      } else {
        handleAuthError(data);
        set({ 
          error: data.error || 'Failed to clear cart',
          updating: null 
        })
      }
    } catch (error) {
      set({ 
        error: 'An error occurred while clearing cart',
        updating: null 
      })
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
      const price = getEffectivePrice(item.product);
      return total + (price * item.quantity);
    }, 0);
  },
}))

