import { CartItem, CartItemWithProduct, User } from '@/shared';

interface GuestCart {
  items: CartItem[];
}

interface UserCart {
  items: CartItem[];
}

// Guest cart storage key
const GUEST_CART_KEY = 'mohaweavs_guest_cart';

// Guest cart operations
export const guestCart = {
  get: (): GuestCart => {
    if (typeof window === 'undefined') return { items: [] };
    
    try {
      const cartData = localStorage.getItem(GUEST_CART_KEY);
      return cartData ? JSON.parse(cartData) : { items: [] };
    } catch (error) {
      console.error('Error reading guest cart:', error);
      return { items: [] };
    }
  },

  set: (cart: GuestCart): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving guest cart:', error);
    }
  },

  addItem: (item: CartItem): void => {
    const cart = guestCart.get();
    const existingItemIndex = cart.items.findIndex(
      (cartItem) => 
        cartItem.productId === item.productId && 
        cartItem.variantId === item.variantId
    );

    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += item.quantity;
    } else {
      cart.items.push(item);
    }

    guestCart.set(cart);
  },

  removeItem: (productId: string, variantId?: string): void => {
    const cart = guestCart.get();
    cart.items = cart.items.filter(
      (item) => 
        item.productId !== productId || 
        (variantId && item.variantId !== variantId)
    );
    guestCart.set(cart);
  },

  clear: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(GUEST_CART_KEY);
  },
};

// User cart API operations
export const userCart = {
  get: async (): Promise<UserCart> => {
    try {
      const response = await fetch('/api/cart');
      if (!response.ok) throw new Error('Failed to fetch cart');
      return await response.json();
    } catch (error) {
      console.error('Error fetching user cart:', error);
      return { items: [] };
    }
  },

  addItem: async (item: CartItem): Promise<void> => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      
      if (!response.ok) throw new Error('Failed to add item to cart');
    } catch (error) {
      console.error('Error adding item to user cart:', error);
      throw error;
    }
  },

  updateQuantity: async (itemId: string, quantity: number): Promise<void> => {
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      
      if (!response.ok) throw new Error('Failed to update cart quantity');
    } catch (error) {
      console.error('Error updating cart quantity:', error);
      throw error;
    }
  },

  removeItem: async (itemId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to remove item from cart');
    } catch (error) {
      console.error('Error removing item from cart:', error);
      throw error;
    }
  },

  clear: async (): Promise<void> => {
    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to clear cart');
    } catch (error) {
      console.error('Error clearing user cart:', error);
      throw error;
    }
  },
};

// Cart merge logic for guest to user transition
export const mergeGuestCartToUser = async (user: User, guestCartItems?: any[]): Promise<void> => {
  try {
    // Use provided guest cart items or try to get from localStorage (fallback)
    let guestCartData: { items: any[] };
    
    if (guestCartItems && Array.isArray(guestCartItems)) {
      guestCartData = { items: guestCartItems };
    } else {
      // Fallback to localStorage (only works on client-side)
      guestCartData = guestCart.get();
    }
    
    if (guestCartData.items.length === 0) {
      return; // No items to merge
    }

    // Get current user cart
    const userCartData = await userCart.get();

    // Merge carts: user cart takes precedence, but quantities add up
    const mergedItems = [...userCartData.items];

    guestCartData.items.forEach((guestItem) => {
      const existingItemIndex = mergedItems.findIndex(
        (userItem) => 
          userItem.productId === guestItem.productId && 
          userItem.variantId === guestItem.variantId
      );

      if (existingItemIndex >= 0) {
        // Add quantities if item exists in user cart
        mergedItems[existingItemIndex].quantity += guestItem.quantity;
      } else {
        // Add new item from guest cart
        mergedItems.push(guestItem);
      }
    });

    // Update user cart with merged items
    for (const item of mergedItems) {
      await userCart.addItem(item);
    }

    // Clear guest cart after successful merge
    guestCart.clear();

    console.log(`Successfully merged ${guestCartData.items.length} guest cart items for user ${user.id}`);
  } catch (error) {
    console.error('Error merging guest cart to user cart:', error);
    throw error;
  }
};

// Cart utilities
export const cartUtils = {
  calculateSubtotal: (items: CartItemWithProduct[]): number => {
    return items.reduce((total, item) => {
      const price = Number(item.product?.discountedPrice || item.product?.price || 0);
      return total + (price * item.quantity);
    }, 0);
  },

  calculateTotal: (items: CartItemWithProduct[], shippingCost = 0): number => {
    const subtotal = cartUtils.calculateSubtotal(items);
    return subtotal + shippingCost;
  },

  getItemCount: (items: CartItem[]): number => {
    return items.reduce((count, item) => count + item.quantity, 0);
  },

  isInCart: (items: CartItem[], productId: string, variantId?: string): boolean => {
    return items.some(
      (item) => 
        item.productId === productId && 
        (!variantId || item.variantId === variantId)
    );
  },
};
