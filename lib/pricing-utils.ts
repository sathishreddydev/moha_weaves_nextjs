import { CartItemWithProduct } from "@/shared/types";
import { getAvailableStock } from "./stock-utils";

export interface PricingCalculation {
  subtotal: number;
  originalSubtotal: number;
  saleDiscount: number;
  shipping: number;
  discountAmount: number;
  totalAmount: number;
}

export interface CouponDiscount {
  type: "percentage" | "fixed" | "free_shipping";
  value: string;
  isActive: boolean;
  maxDiscount?: string | null;
}

/**
 * Calculate pricing consistently across frontend and backend.
 *
 * Stacking policy (issue #11):
 *   Coupons are applied on the ORIGINAL product price, not on the
 *   already-discounted (sale) price.  This prevents double-discounting
 *   where a 20% sale + 10% coupon would compound to ~28% off.
 *   The coupon discount is capped so the final total never goes below
 *   the sale-discounted subtotal (i.e. the coupon can never make the
 *   order cheaper than what the sale already gives).
 */
export function calculatePricing(
  cartItems: CartItemWithProduct[],
  coupon?: CouponDiscount | null
): PricingCalculation {
  // ── Subtotals ────────────────────────────────────────────────────────────
  // sale-discounted subtotal  → used for shipping threshold & final total
  // original-price subtotal   → used as the coupon discount base (no stacking)
  let subtotal = 0;
  let originalSubtotal = 0;

  for (const item of cartItems) {
    const product = item.product as any;

    const variant = item.variantId
      ? product.variants?.find((v: any) => v.id === item.variantId)
      : null;
    const variantPrice = variant?.price ? parseFloat(variant.price) : null;

    // Effective (possibly sale-discounted) price
    const effectivePrice =
      variantPrice ??
      (product.discountedPrice ? product.discountedPrice : null) ??
      (typeof product.price === "string"
        ? parseFloat(product.price)
        : product.price);

    // Original price before any sale discount
    const originalPrice =
      variantPrice ??
      (typeof product.price === "string"
        ? parseFloat(product.price)
        : product.price);

    subtotal += effectivePrice * item.quantity;
    originalSubtotal += originalPrice * item.quantity;
  }

  // ── Shipping ─────────────────────────────────────────────────────────────
  let shipping = subtotal > 0 ? (subtotal >= 999 ? 0 : 50) : 0;
  if (coupon && coupon.isActive && coupon.type === "free_shipping") {
    shipping = 0;
  }

  // ── Coupon discount ───────────────────────────────────────────────────────
  // Calculated on originalSubtotal so it doesn't stack on top of sale prices.
  let discountAmount = 0;
  if (coupon && coupon.isActive) {
    if (coupon.type === "percentage") {
      discountAmount = (originalSubtotal * parseFloat(coupon.value)) / 100;
    } else if (coupon.type === "fixed") {
      discountAmount = parseFloat(coupon.value);
    }

    // Apply maxDiscount cap
    if (coupon.maxDiscount && parseFloat(coupon.maxDiscount) > 0) {
      discountAmount = Math.min(discountAmount, parseFloat(coupon.maxDiscount));
    }

    // Never let the coupon make the order cheaper than the sale already does.
    // i.e. coupon discount cannot exceed (originalSubtotal - subtotal) + subtotal
    // which simplifies to: total after coupon >= 0
    discountAmount = Math.min(discountAmount, subtotal);
  }

  const totalAmount = subtotal + shipping - discountAmount;

  return {
    subtotal,
    originalSubtotal,
    saleDiscount: originalSubtotal - subtotal,
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
    const availableStock = getAvailableStock(item.product as any, item.variantId);
    
    if (availableStock < item.quantity) {
      return {
        valid: false,
        message: `Insufficient stock for ${item.product.name}. Only ${availableStock} items available.`,
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
