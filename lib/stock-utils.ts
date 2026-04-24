/**
 * Common stock utility functions to eliminate code duplication
 * Handles both products with variants and products without variants
 */

export interface ProductWithStock {
  id: string;
  name?: string;
  onlineStock: number;
  totalStock: number;
  variants?: Array<{
    id: string;
    onlineStock: number;
    isActive?: boolean;
  }>;
}

export interface CartItemWithStock {
  productId: string;
  variantId?: string | null;
  quantity: number;
  product: ProductWithStock;
}

/**
 * Calculate available stock for a product (with or without variants)
 * @param product - Product object with stock information
 * @param variantId - Optional variant ID
 * @returns Available stock quantity
 */
export function getAvailableStock(product: ProductWithStock, variantId?: string | null): number {
  if (variantId) {
    // Get variant stock from product variants
    const variant = product.variants?.find(v => v.id === variantId);
    return variant?.onlineStock || 0;
  } else {
    // Calculate total stock from all variants, or use product-level stock if no variants
    return product.variants?.length 
      ? product.variants?.reduce((sum, variant) => sum + (variant.onlineStock || 0), 0) || 0
      : product.onlineStock || 0;
  }
}

/**
 * Check if a product is in stock
 * @param product - Product object with stock information
 * @param variantId - Optional variant ID
 * @returns True if product has stock available
 */
export function isInStock(product: ProductWithStock, variantId?: string | null): boolean {
  return getAvailableStock(product, variantId) > 0;
}

/**
 * Get stock status text for display
 * @param product - Product object with stock information
 * @param variantId - Optional variant ID
 * @returns Stock status string
 */
export function getStockStatus(product: ProductWithStock, variantId?: string | null): string {
  const availableStock = getAvailableStock(product, variantId);
  
  if (availableStock <= 0) {
    return "Out of Stock";
  } else if (availableStock <= 10) {
    return `Only ${availableStock} left`;
  } else {
    return "In Stock";
  }
}

/**
 * Validate if requested quantity is available
 * @param product - Product object with stock information
 * @param quantity - Requested quantity
 * @param variantId - Optional variant ID
 * @returns Validation result
 */
export function validateStockQuantity(
  product: ProductWithStock, 
  quantity: number, 
  variantId?: string | null
): { valid: boolean; availableStock: number; message?: string } {
  const availableStock = getAvailableStock(product, variantId);
  
  if (quantity > availableStock) {
    return {
      valid: false,
      availableStock,
      message: `Only ${availableStock} items available in stock.`
    };
  }
  
  return {
    valid: true,
    availableStock
  };
}

/**
 * Validate stock for multiple cart items
 * @param cartItems - Array of cart items
 * @returns Validation result for the first invalid item, or success
 */
export function validateCartStock(
  cartItems: CartItemWithStock[]
): { valid: boolean; message?: string; productId?: string } {
  for (const item of cartItems) {
    const validation = validateStockQuantity(
      item.product, 
      item.quantity, 
      item.variantId
    );
    
    if (!validation.valid) {
      return {
        valid: false,
        message: `Insufficient stock for ${item.product.name || item.productId}. ${validation.message}`,
        productId: item.productId
      };
    }
  }
  
  return { valid: true };
}

/**
 * Get stock status color class for UI
 * @param product - Product object with stock information
 * @param variantId - Optional variant ID
 * @returns CSS class name for stock status color
 */
export function getStockStatusColor(product: ProductWithStock, variantId?: string | null): string {
  return isInStock(product, variantId) ? "text-green-600" : "text-red-600";
}

/**
 * Check if product has low stock (10 or fewer items)
 * @param product - Product object with stock information
 * @param variantId - Optional variant ID
 * @returns True if stock is low
 */
export function isLowStock(product: ProductWithStock, variantId?: string | null): boolean {
  const availableStock = getAvailableStock(product, variantId);
  return availableStock > 0 && availableStock <= 10;
}

/**
 * Generate quantity options for dropdown (1-10 or available stock, whichever is less)
 * @param product - Product object with stock information
 * @param variantId - Optional variant ID
 * @returns Array of quantity options
 */
export function getQuantityOptions(product: ProductWithStock, variantId?: string | null): number[] {
  const availableStock = getAvailableStock(product, variantId);
  const maxOptions = Math.min(10, availableStock || 1);
  
  return Array.from({ length: maxOptions }, (_, i) => i + 1);
}

/**
 * Check if a product is considered "new" (created within last 30 days)
 * @param createdAt - Product creation date
 * @returns True if product is new
 */
export function isNewProduct(createdAt: Date | string): boolean {
  const createdDate = new Date(createdAt);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return createdDate >= thirtyDaysAgo;
}
