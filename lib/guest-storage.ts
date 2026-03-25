// Guest storage utilities for localStorage operations
// Used only on client-side for unauthenticated users

export interface GuestCartItem {
  id: string;
  productId: string;
  quantity: number;
  variantId?: string;
  addedAt: string;
  product?: {
    id: string;
    name: string;
    description?: string;
    price: string;
    categoryId?: string;
    subcategoryId?: string;
    colorId?: string;
    fabricId?: string;
    imageUrl?: string;
    images?: string[];
    videoUrl?: string;
    sku?: string;
    totalStock?: number;
    onlineStock?: number;
    distributionChannel?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    createdAt?: string;
    updatedAt?: string;
    // Related data
    category?: {
      id: string;
      name: string;
    } | null;
    subcategory?: {
      id: string;
      name: string;
    } | null;
    color?: {
      id: string;
      name: string;
      hexCode?: string;
    } | null;
    fabric?: {
      id: string;
      name: string;
    } | null;
  };
}

export interface GuestWishlistItem {
  productId: string;
  addedAt: string;
  product?: {
    id: string;
    name: string;
    description?: string;
    price: string;
    categoryId?: string;
    subcategoryId?: string;
    colorId?: string;
    fabricId?: string;
    imageUrl?: string;
    images?: string[];
    videoUrl?: string;
    sku?: string;
    totalStock?: number;
    onlineStock?: number;
    distributionChannel?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    createdAt?: string;
    updatedAt?: string;
    // Related data
    category?: {
      id: string;
      name: string;
    } | null;
    subcategory?: {
      id: string;
      name: string;
    } | null;
    color?: {
      id: string;
      name: string;
      hexCode?: string;
    } | null;
    fabric?: {
      id: string;
      name: string;
    } | null;
  };
}

export const guestStorage = {
  cart: {
    get: (): GuestCartItem[] => {
      if (typeof window === 'undefined') return [];
      try {
        const cart = localStorage.getItem('mohaweavs_guest_cart');
        return cart ? JSON.parse(cart) : [];
      } catch (error) {
        console.error('Error parsing guest cart:', error);
        return [];
      }
    },
    
    set: (items: GuestCartItem[]): void => {
      if (typeof window === 'undefined') return;
      try {
        localStorage.setItem('mohaweavs_guest_cart', JSON.stringify(items));
      } catch (error) {
        console.error('Error saving guest cart:', error);
      }
    },
    
    add: (item: Omit<GuestCartItem, 'id' | 'addedAt'>): void => {
      const cart = guestStorage.cart.get();
      const existingItem = cart.find(
        (cartItem) => 
          cartItem.productId === item.productId && 
          cartItem.variantId === item.variantId
      );
      
      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        cart.push({
          ...item,
          id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          addedAt: new Date().toISOString(),
        });
      }
      
      guestStorage.cart.set(cart);
    },
    
    remove: (id: string): void => {
      const cart = guestStorage.cart.get();
      const updatedCart = cart.filter(item => item.id !== id);
      guestStorage.cart.set(updatedCart);
    },
    
    update: (id: string, quantity: number): void => {
      const cart = guestStorage.cart.get();
      const item = cart.find(item => item.id === id);
      if (item) {
        item.quantity = quantity;
        guestStorage.cart.set(cart);
      }
    },
    
    clear: (): void => {
      if (typeof window === 'undefined') return;
      localStorage.removeItem('mohaweavs_guest_cart');
    },
    
    getCount: (): number => {
      const cart = guestStorage.cart.get();
      return cart.reduce((total, item) => total + item.quantity, 0);
    },
  },
  
  wishlist: {
    get: (): (string | GuestWishlistItem)[] => {
      if (typeof window === 'undefined') return [];
      try {
        const wishlist = localStorage.getItem('mohaweavs_guest_wishlist');
        return wishlist ? JSON.parse(wishlist) : [];
      } catch (error) {
        console.error('Error parsing guest wishlist:', error);
        return [];
      }
    },
    
    set: (items: (string | GuestWishlistItem)[]): void => {
      if (typeof window === 'undefined') return;
      try {
        localStorage.setItem('mohaweavs_guest_wishlist', JSON.stringify(items));
      } catch (error) {
        console.error('Error saving guest wishlist:', error);
      }
    },
    
    add: (productId: string): void => {
      const wishlist = guestStorage.wishlist.get();
      const existingItem = wishlist.find(item => 
        typeof item === 'string' ? item === productId : item.productId === productId
      );
      
      if (!existingItem) {
        wishlist.push(productId);
        guestStorage.wishlist.set(wishlist);
      }
    },
    
    remove: (productId: string): void => {
      const wishlist = guestStorage.wishlist.get();
      const updatedWishlist = wishlist.filter(item => {
        if (typeof item === 'string') {
          return item !== productId;
        } else {
          return item.productId !== productId;
        }
      });
      guestStorage.wishlist.set(updatedWishlist);
    },
    
    toggle: (productId: string): boolean => {
      const wishlist = guestStorage.wishlist.get();
      const existingItem = wishlist.find(item => 
        typeof item === 'string' ? item === productId : item.productId === productId
      );
      
      if (existingItem) {
        guestStorage.wishlist.remove(productId);
        return false; // Removed
      } else {
        guestStorage.wishlist.add(productId);
        return true; // Added
      }
    },
    
    has: (productId: string): boolean => {
      const wishlist = guestStorage.wishlist.get();
      return wishlist.some(item => 
        typeof item === 'string' ? item === productId : item.productId === productId
      );
    },
    
    clear: (): void => {
      if (typeof window === 'undefined') return;
      localStorage.removeItem('mohaweavs_guest_wishlist');
    },
    
    getCount: (): number => {
      return guestStorage.wishlist.get().length;
    },
  },
};
