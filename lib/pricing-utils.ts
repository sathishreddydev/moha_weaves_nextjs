import { CartItemWithProduct } from "@/shared/types";

export interface PricingCalculation {
  subtotal: number;
  shipping: number;
  discountAmount: number;
  totalAmount: number;
}

export interface CouponDiscount {
  type: "percentage" | "fixed" | "free_shipping";
  value: string;
  isActive: boolean;
}

/**
 * Calculate pricing consistently across frontend and backend
 */
export function calculatePricing(
  cartItems: CartItemWithProduct[],
  coupon?: CouponDiscount | null
): PricingCalculation {
  // Calculate subtotal using discounted prices when available
  const subtotal = cartItems.reduce((sum, item) => {
    const price = (item.product as any).discountedPrice 
      ? (item.product as any).discountedPrice
      : typeof item.product.price === "string"
          ? parseFloat(item.product.price)
          : item.product.price;

    return sum + price * item.quantity;
  }, 0);

  // Calculate shipping (FREE for orders >= 999, otherwise 50, or with free_shipping coupon)
  let shipping = subtotal > 0 ? (subtotal >= 999 ? 0 : 50) : 0;
  
  // Apply free shipping coupon if active
  if (coupon && coupon.isActive && coupon.type === "free_shipping") {
    shipping = 0;
  }

  // Calculate coupon discount
  let discountAmount = 0;
  if (coupon && coupon.isActive) {
    if (coupon.type === "percentage") {
      discountAmount = (subtotal * parseFloat(coupon.value)) / 100;
    } else if (coupon.type === "fixed") {
      discountAmount = parseFloat(coupon.value);
    }
    // free_shipping type doesn't add to discountAmount, but affects shipping calculation
  }

  const totalAmount = subtotal + shipping - discountAmount;

  return {
    subtotal,
    shipping,
    discountAmount,
    totalAmount,
  };
}


export async function validateStockAvailability(
  cartItems: CartItemWithProduct[]
): Promise<{ valid: boolean; message?: string; productId?: string }> {
  // Basic client-side validation - check cached stock values
  for (const item of cartItems) {
    if (item.product.onlineStock < item.quantity) {
      return {
        valid: false,
        message: `Insufficient stock for ${item.product.name}. Only ${item.product.onlineStock} items available.`,
        productId: item.productId,
      };
    }
  }
  return { valid: true };
}

/**
 * Get the effective price for a product (discounted or original)
 */
export function getEffectivePrice(product: any): number {
  return (product as any).discountedPrice 
    ? (product as any).discountedPrice
    : typeof product.price === "string"
        ? parseFloat(product.price)
        : product.price;
}
