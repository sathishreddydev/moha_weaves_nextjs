import { GuestCartItem, guestStorage } from './guest-storage';
import { getAvailableStock } from './stock-utils';

interface GuestCartSyncOptions {
  validateStock?: boolean;
  updatePrices?: boolean;
  removeOutOfStock?: boolean;
}

/**
 * Synchronizes guest cart with current product data
 * Validates stock, updates prices, and removes unavailable items
 */
export async function syncGuestCart(
  options: GuestCartSyncOptions = {
    validateStock: true,
    updatePrices: true,
    removeOutOfStock: true
  }
): Promise<{
  cart: GuestCartItem[];
  updated: number;
  removed: number;
  errors: string[];
}> {
  const guestCart = guestStorage.cart.get();
  const updatedCart: GuestCartItem[] = [];
  const errors: string[] = [];
  let updated = 0;
  let removed = 0;

  for (const item of guestCart) {
    try {
      // Fetch current product data
      const response = await fetch(`/api/products/${item.productId}`);
      const productData = await response.json();

      if (!productData.success) {
        errors.push(`Failed to fetch product ${item.productId}`);
        if (options.removeOutOfStock) {
          removed++;
          continue;
        }
        updatedCart.push(item);
        continue;
      }

      const product = productData.data;

      // Check if product is still active and available
      if (!product.isActive || product.totalStock <= 0) {
        if (options.removeOutOfStock) {
          errors.push(`Product ${product.name} is no longer available`);
          removed++;
          continue;
        }
      }

      // Validate variant stock if variant is selected
      if (item.variantId && product.variants) {
        const variant = product.variants.find((v: any) => v.id === item.variantId);
        if (!variant || !variant.isActive || variant.onlineStock <= 0) {
          if (options.removeOutOfStock) {
            errors.push(`Variant for ${product.name} is no longer available`);
            removed++;
            continue;
          }
        }
      }

      // Update item with current product data
      const updatedItem: GuestCartItem = {
        ...item,
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          categoryId: product.categoryId,
          subcategoryId: product.subcategoryId,
          colorId: product.colorId,
          fabricId: product.fabricId,
          imageUrl: product.imageUrl,
          images: product.images || [],
          videoUrl: product.videoUrl,
          sku: product.sku,
          totalStock: product.totalStock,
          onlineStock: product.onlineStock,
          distributionChannel: product.distributionChannel,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          category: product.category,
          subcategory: product.subcategory,
          color: product.color,
          fabric: product.fabric,
        }
      };

      // Adjust quantity if stock is insufficient
      const availableStock = getAvailableStock(product as any, item.variantId);

      if (options.validateStock && item.quantity > availableStock) {
        updatedItem.quantity = Math.max(1, availableStock);
        updated++;
        errors.push(`Adjusted quantity for ${product.name} due to stock limitations`);
      }

      updatedCart.push(updatedItem);

    } catch (error) {
      console.error(`Error syncing guest cart item ${item.productId}:`, error);
      errors.push(`Failed to sync ${item.product?.name || item.productId}`);
      
      if (options.removeOutOfStock) {
        removed++;
        continue;
      }
      updatedCart.push(item);
    }
  }

  // Save updated cart
  guestStorage.cart.set(updatedCart);

  return {
    cart: updatedCart,
    updated,
    removed,
    errors
  };
}

/**
 * Validates guest cart before checkout
 * Ensures all items are valid and available
 */
export async function validateGuestCartForCheckout(): Promise<{
  isValid: boolean;
  cart: GuestCartItem[];
  issues: string[];
}> {
  const syncResult = await syncGuestCart({
    validateStock: true,
    updatePrices: true,
    removeOutOfStock: false // Don't remove, just report issues
  });

  const issues = syncResult.errors;
  let isValid = true;

  // Check for critical issues that would prevent checkout
  for (const item of syncResult.cart) {
    if (!item.product?.isActive) {
      issues.push(`${item.product?.name || item.productId} is no longer available`);
      isValid = false;
    }

    const availableStock = getAvailableStock(item.product as any, item.variantId);

    if (item.quantity > availableStock) {
      issues.push(`Insufficient stock for ${item.product?.name || item.productId}`);
      isValid = false;
    }
  }

  return {
    isValid,
    cart: syncResult.cart,
    issues
  };
}

/**
 * Merges guest cart with user cart on login
 * This is handled by the API endpoint, but this is the client-side helper
 */
export function prepareGuestCartForMerge(): GuestCartItem[] {
  return guestStorage.cart.get().map((item: any) => ({
    ...item,
    // Ensure product data is complete for merge
    product: item.product || {
      id: item.productId,
      name: 'Unknown Product',
      price: '0',
    }
  }));
}
