import { useEffect, useRef } from 'react';
import { guestStorage } from '@/lib/guest-storage';

interface CartConsistencyCheckerReturn {
  checkConsistency: () => boolean;
  fixInconsistency: () => void;
  setupSync: () => void;
}

export const useCartConsistencyChecker = (): CartConsistencyCheckerReturn => {
  const lastSyncRef = useRef<string>('');

  const checkConsistency = (): boolean => {
    try {
      const cart = guestStorage.cart.get();
      const cartString = JSON.stringify(cart);
      
      // Check if cart is valid
      if (!Array.isArray(cart)) {
        console.error('Cart is not an array');
        return false;
      }

      // Check for duplicate items
      const productIds = cart.map(item => item.productId);
      const uniqueIds = new Set(productIds);
      if (productIds.length !== uniqueIds.size) {
        console.error('Cart contains duplicate items');
        return false;
      }

      // Check for invalid items
      for (const item of cart) {
        if (!item.productId || !item.quantity || item.quantity <= 0) {
          console.error('Cart contains invalid item:', item);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking cart consistency:', error);
      return false;
    }
  };

  const fixInconsistency = (): void => {
    try {
      let cart = guestStorage.cart.get();
      
      // Ensure cart is an array
      if (!Array.isArray(cart)) {
        cart = [];
      }

      // Remove invalid items
      cart = cart.filter(item => 
        item && 
        item.productId && 
        item.quantity && 
        item.quantity > 0
      );

      // Remove duplicates (keep last occurrence)
      const seen = new Set<string>();
      cart = cart.filter(item => {
        if (seen.has(item.productId)) {
          return false;
        }
        seen.add(item.productId);
        return true;
      });

      // Save fixed cart
      guestStorage.cart.set(cart);
      console.log('Cart inconsistency fixed');
      
      // Dispatch storage event to notify other tabs
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'mohaweavs_guest_cart',
        newValue: JSON.stringify(cart),
      }));
      
    } catch (error) {
      console.error('Error fixing cart inconsistency:', error);
    }
  };

  const setupSync = (): void => {
    // Listen for storage events from other tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'mohaweavs_guest_cart' && event.newValue) {
        const newCart = JSON.parse(event.newValue);
        const currentCart = guestStorage.cart.get();
        
        // Only update if different
        if (JSON.stringify(currentCart) !== JSON.stringify(newCart)) {
          guestStorage.cart.set(newCart);
          lastSyncRef.current = JSON.stringify(newCart);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Check consistency on mount
    if (!checkConsistency()) {
      fixInconsistency();
    }

    // Set up periodic consistency check
    const interval = setInterval(() => {
      if (!checkConsistency()) {
        fixInconsistency();
      }
    }, 30000); // Check every 30 seconds

    // Cleanup function
    const cleanup = () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };

    // Set up cleanup on unmount
    useEffect(() => {
      return cleanup;
    }, []);
  };

  return {
    checkConsistency,
    fixInconsistency,
    setupSync,
  };
};
