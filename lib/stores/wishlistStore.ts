import { create } from 'zustand'
import { WishlistItemWithProduct } from '@/shared'
import { guestStorage } from '@/lib/guest-storage'

interface WishlistState {
  items: WishlistItemWithProduct[]
  loading: boolean
  error: string | null
  updating: string | null
  count: number
}

interface WishlistActions {
  fetchWishlist: () => Promise<void>
  addToWishlist: (productId: string) => Promise<void>
  removeFromWishlist: (productId: string) => Promise<void>
  isInWishlist: (productId: string) => boolean
  setUpdating: (productId: string | null) => void
  setError: (error: string | null) => void
  addToCartFromWishlist: (productId: string, variantId?: string | null) => Promise<void>
}

type WishlistStore = WishlistState & WishlistActions

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  updating: null,
  count: 0,

  fetchWishlist: async () => {
    try {
      set({ loading: true, error: null })
      
      // Try API first
      const response = await fetch('/api/wishlist')
      const data = await response.json()
      
      if (data.success && data.data) {
        set({ 
          items: data.data.wishlist || [],
          count: data.data.count || 0,
          loading: false 
        })
      } else if (data.isGuest) {
        // Handle guest user - use localStorage
        const guestWishlist = guestStorage.wishlist.get()
        set({ 
          items: guestWishlist as any, // Type assertion for compatibility
          count: guestStorage.wishlist.getCount(),
          loading: false 
        })
      } else {
        set({ 
          error: data.error || 'Failed to fetch wishlist',
          loading: false 
        })
      }
    } catch (error) {
      set({ 
        error: 'An error occurred while fetching your wishlist',
        loading: false 
      })
    }
  },

  addToWishlist: async (productId: string) => {
    try {
      set({ updating: productId })
      
      // Try API first
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId
        })
      })
      const data = await response.json()
      
      if (data.success && data.data) {
        set({ 
          items: data.data.wishlist || [],
          count: data.data.count || 0,
          updating: null 
        })
      } else if (data.isGuest) {
        // Handle guest user - fetch product details first
        try {
          // Fetch product details for guest wishlist
          const productResponse = await fetch(`/api/products/${productId}`);
          const productData = await productResponse.json();
          
          if (productData.success && productData.data) {
            guestStorage.wishlist.add(productId)
            
            // Update the stored item with product details
            const guestWishlist = guestStorage.wishlist.get();
            const updatedWishlist = guestWishlist.map((item: any) => {
              if (item === productId) {
                return {
                  productId: item,
                  addedAt: new Date().toISOString(),
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
                };
              }
              return item;
            });
            
            guestStorage.wishlist.set(updatedWishlist);
          } else {
            // Fallback without product details
            guestStorage.wishlist.add(productId)
          }
        } catch (productError) {
          // Fallback without product details
          guestStorage.wishlist.add(productId)
        }
        
        const guestWishlist = guestStorage.wishlist.get()
        set({ 
          items: guestWishlist as any,
          count: guestStorage.wishlist.getCount(),
          updating: null 
        })
      } else {
        set({ 
          error: data.error || 'Failed to add to wishlist',
          updating: null 
        })
      }
    } catch (error) {
      set({ 
        error: 'An error occurred while adding to wishlist',
        updating: null 
      })
    }
  },

  removeFromWishlist: async (productId: string) => {
    try {
      set({ updating: productId })
      
      // Try API first
      const response = await fetch(`/api/wishlist?productId=${productId}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      
      if (data.success) {
        set({ 
          items: data.data.wishlist || [],
          count: data.data.count || 0,
          updating: null 
        })
      } else if (data.isGuest) {
        // Handle guest user - use localStorage
        guestStorage.wishlist.remove(productId)
        
        const guestWishlist = guestStorage.wishlist.get()
        set({ 
          items: guestWishlist as any,
          count: guestStorage.wishlist.getCount(),
          updating: null 
        })
      } else {
        set({ 
          error: data.error || 'Failed to remove from wishlist',
          updating: null 
        })
      }
    } catch (error) {
      set({ 
        error: 'An error occurred while removing from wishlist',
        updating: null 
      })
    }
  },

  isInWishlist: (productId: string) => {
    const { items } = get()
    // Check both store items and guest storage
    const inStore = items.some(item => item.productId === productId)
    const inGuestStorage = guestStorage.wishlist.has(productId)
    return inStore || inGuestStorage
  },

  setUpdating: (productId: string | null) => {
    set({ updating: productId })
  },

  setError: (error: string | null) => {
    set({ error })
  },

  addToCartFromWishlist: async (productId: string, variantId?: string | null) => {
    try {
      set({ updating: productId })
      
      // First add to cart
      const cartResponse = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId,
          quantity: 1,
          variantId
        })
      })
      
      const cartData = await cartResponse.json()
      
      if (cartData.success) {
        // Then remove from wishlist
        await get().removeFromWishlist(productId)
      } else {
        set({ 
          error: cartData.error || 'Failed to add to cart',
          updating: null 
        })
      }
    } catch (error) {
      set({ 
        error: 'An error occurred while adding to cart',
        updating: null 
      })
    }
  }
}))
