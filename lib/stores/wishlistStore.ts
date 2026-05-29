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
      // Only show loading spinner on initial load (when wishlist is empty)
      // Avoid flashing spinner on background refreshes
      const { items: currentItems } = get()
      if (currentItems.length === 0) {
        set({ loading: true, error: null })
      } else {
        set({ error: null })
      }
      
      // Try API first
      const response = await fetch('/api/wishlist')
      const data = await response.json()
      
      if (data.success && data.data && !data.isGuest) {
        set({ 
          items: data.data.wishlist || [],
          count: data.data.count || 0,
          loading: false 
        })
      } else {
        // Guest user — load from localStorage and enrich items missing product data
        const guestWishlist = guestStorage.wishlist.get()
        
        // Enrich items that are plain strings or missing product data
        const enrichedItems: any[] = [];
        let needsUpdate = false;
        
        for (const item of guestWishlist) {
          const productId = typeof item === 'string' ? item : item.productId;
          const hasProductData = typeof item !== 'string' && item.product?.images;
          
          if (hasProductData) {
            enrichedItems.push(item);
          } else {
            // Fetch product details
            try {
              const productResponse = await fetch(`/api/products/${productId}`);
              const productData = await productResponse.json();
              
              if (productData.success && productData.data) {
                const p = productData.data;
                enrichedItems.push({
                  productId,
                  addedAt: typeof item !== 'string' ? item.addedAt : new Date().toISOString(),
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
                });
                needsUpdate = true;
              } else {
                // Product not found — skip it
                needsUpdate = true;
              }
            } catch {
              // Keep the item as-is if fetch fails
              enrichedItems.push(typeof item === 'string' ? { productId: item, addedAt: new Date().toISOString() } : item);
            }
          }
        }
        
        // Save enriched data back to localStorage
        if (needsUpdate) {
          guestStorage.wishlist.set(enrichedItems);
        }
        
        set({ 
          items: enrichedItems as any,
          count: enrichedItems.length,
          loading: false 
        })
      }
    } catch (error) {
      // Fallback to guest storage on network error
      const guestWishlist = guestStorage.wishlist.get()
      set({ 
        items: guestWishlist as any,
        count: guestStorage.wishlist.getCount(),
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
      } else if (response.status === 401 || data.isGuest) {
        // Handle guest user - fetch product details first
        try {
          // Fetch product details for guest wishlist
          const productResponse = await fetch(`/api/products/${productId}`);
          const productData = await productResponse.json();
          
          if (productData.success && productData.data) {
            const p = productData.data;
            guestStorage.wishlist.add(productId)
            
            // Update the stored item with product details (including variants)
            const guestWishlist = guestStorage.wishlist.get();
            const updatedWishlist = guestWishlist.map((item: any) => {
              const itemProductId = typeof item === 'string' ? item : item.productId;
              if (itemProductId === productId) {
                return {
                  productId: productId,
                  addedAt: typeof item !== 'string' && item.addedAt ? item.addedAt : new Date().toISOString(),
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
    // Save previous state for rollback on failure
    const { items: prevItems, count: prevCount } = get()
    try {
      // Optimistic removal — immediately remove from UI
      const optimisticItems = prevItems.filter(item => item.productId !== productId)
      set({ updating: productId, items: optimisticItems, count: optimisticItems.length })
      
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
      } else if (response.status === 401 || data.isGuest) {
        // Handle guest user - use localStorage
        guestStorage.wishlist.remove(productId)
        
        const guestWishlist = guestStorage.wishlist.get()
        set({ 
          items: guestWishlist as any,
          count: guestStorage.wishlist.getCount(),
          updating: null 
        })
      } else {
        // Revert optimistic removal on failure
        set({ 
          items: prevItems,
          count: prevCount,
          error: data.error || 'Failed to remove from wishlist',
          updating: null 
        })
      }
    } catch (error) {
      // Revert optimistic removal on network error
      set({ 
        items: prevItems,
        count: prevCount,
        error: 'An error occurred while removing from wishlist',
        updating: null 
      })
    }
  },

  isInWishlist: (productId: string) => {
    const { items } = get()
    // Only check the store items (which are populated by fetchWishlist for both
    // authenticated and guest users). Avoid reading localStorage directly here
    // as it causes SSR hydration mismatches.
    return items.some(item => item.productId === productId)
  },

  setUpdating: (productId: string | null) => {
    set({ updating: productId })
  },

  setError: (error: string | null) => {
    set({ error })
  },

  addToCartFromWishlist: async (productId: string, variantId?: string | null) => {
    try {
      set({ updating: productId, error: null })
      
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
        // Sync cart store so header count updates immediately
        const { useCartStore } = await import('./cartStore')
        useCartStore.getState().fetchCart()
        // Then remove from wishlist
        await get().removeFromWishlist(productId)
      } else if (cartResponse.status === 401 || cartData.isGuest) {
        // Guest user — add to guest cart (same as cartStore.addToCart guest flow)
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
            
            if (currentQty + 1 > stock) {
              set({ error: `Only ${stock} items available in stock.`, updating: null })
              return
            }
            
            guestStorage.cart.add({
              productId,
              quantity: 1,
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
            });
          } else {
            guestStorage.cart.add({ productId, quantity: 1, variantId: variantId || undefined });
          }
        } catch (productError) {
          guestStorage.cart.add({ productId, quantity: 1, variantId: variantId || undefined });
        }
        
        // Remove from guest wishlist and sync cart store
        guestStorage.wishlist.remove(productId);
        const { useCartStore } = await import('./cartStore')
        useCartStore.getState().fetchCart()
        const guestWishlist = guestStorage.wishlist.get();
        set({ 
          items: guestWishlist as any,
          count: guestStorage.wishlist.getCount(),
          updating: null 
        })
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
