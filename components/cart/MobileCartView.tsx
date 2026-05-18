"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatPrice } from "@/lib/formatters";
import { useState } from "react";
import { ArrowRight, Truck, X } from "lucide-react";
import { getProductUrl } from "@/lib/utils/productUrl";
import { CartItemStockStatus } from "@/lib/stores/cartStore";
import { getAvailableStock } from "@/lib/stock-utils";
import { getEffectivePrice } from "@/lib/pricing-utils";
import ProductCard from "../products/ProductCard";
import { useRouter } from "next/navigation";
import { useWishlistStore } from "@/lib/stores";
import { ProductWithDetails } from "@/shared";

interface MobileCartViewProps {
  items: any[];
  updating: string | null;
  stockStatus: Record<string, CartItemStockStatus>;
  hasStockIssues: boolean;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  calculateTotal: () => number;
  isGuest: boolean;
  relatedProducts?: ProductWithDetails[];
  categoryName?: string;
}

const FREE_SHIPPING_THRESHOLD = 999;

export default function MobileCartView({
  items,
  updating,
  stockStatus,
  hasStockIssues,
  updateQuantity,
  removeFromCart,
  clearCart,
  calculateTotal,
  isGuest,
  relatedProducts = [],
  categoryName = "all",
}: MobileCartViewProps) {
  const [showSummary, setShowSummary] = useState(false);
  const router = useRouter();
  const {
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    updating: wishlistUpdating,
  } = useWishlistStore();

  const subtotal = calculateTotal();
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 50;
  const total = subtotal + shipping;

  const totalSavings = items.reduce((sum: number, item: any) => {
    const orig = parseFloat(item.product.price || "0");
    const effective = getEffectivePrice(item.product);
    return sum + (orig - effective) * item.quantity;
  }, 0);

  const checkoutDisabled = hasStockIssues;

  return (
    <div className="lg:hidden">
      {/* Header */}
      <div className="mb-4 p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Cart ({items.length})
          </h2>
          {items.length > 0 && (
            <Button
              onClick={clearCart}
              disabled={updating === "all"}
              variant="outline"
              size="sm"
              className="active:scale-95 transition-transform"
            >
              {updating === "all" ? "Clearing..." : "Clear"}
            </Button>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="space-y-4 mb-20">
        {items.map((item) => {
          const orig = parseFloat(item.product.price || "0");
          const effectivePrice = getEffectivePrice(item.product);
          const hasDiscount = effectivePrice < orig;
          const firstImage = item.product.images?.[0];
          const variantInfo = item.variantId
            ? item.product.variants?.find((v: any) => v.id === item.variantId)
            : null;
          const itemStock = stockStatus[item.id];
          const isOutOfStock = itemStock?.outOfStock ?? false;
          const isLimitedStock = itemStock?.limitedStock ?? false;
          const effectiveAvailableStock = itemStock?.availableStock
            ?? getAvailableStock(item.product, item.variantId);

          return (
            <div
              key={item.id}
              className={`bg-white rounded-lg shadow p-4 relative ${
                isOutOfStock ? "opacity-70 border border-red-200" : ""
              }`}
            >
              {/* Remove Button - Top Right */}
              <Button
                variant="link"
                size="icon"
                onClick={() => removeFromCart(item.id)}
                disabled={updating === item.id}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                aria-label="Remove item"
              >
                <X className="w-4 h-4 text-gray-500 hover:text-red-600" />
              </Button>

              <div className="flex space-x-4">
                {/* Product Image */}
                <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden relative">
                  {firstImage ? (
                    <img
                      src={firstImage}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-xs text-gray-500">No image</span>
                    </div>
                  )}
                  {/* Out of Stock overlay on image */}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <span className="text-[10px] font-semibold text-red-600 bg-white/90 px-1 py-0.5 rounded text-center leading-tight">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0 pr-8">
                  <h3 className="font-medium text-gray-900 mb-1">
                    <Link
                      href={getProductUrl(item.product)}
                      className="hover:text-blue-600"
                    >
                      {item.product.name}
                    </Link>
                  </h3>

                  <div className="space-y-1 mb-2">
                    {variantInfo && (
                      <p className="text-xs text-gray-600">
                        Size: {variantInfo.size}
                      </p>
                    )}
                    {item.product.category && (
                      <p className="text-xs text-gray-600">
                        {item.product.category.name}
                      </p>
                    )}
                  </div>

                  {/* Stock badges */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {isOutOfStock && (
                      <Badge className="text-xs bg-red-100 text-red-700 border-red-300 hover:bg-red-100">
                        Out of Stock
                      </Badge>
                    )}
                    {isLimitedStock && !isOutOfStock && (
                      <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-100">
                        Only {effectiveAvailableStock} left
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    {hasDiscount ? (
                      <>
                        <span className="font-medium text-red-600">
                          {formatPrice(effectivePrice)}
                        </span>
                        <span className="text-xs text-gray-500 line-through">
                          {formatPrice(orig)}
                        </span>
                      </>
                    ) : (
                      <span className="font-medium text-gray-900">
                        {formatPrice(effectivePrice)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quantity and Total Controls */}
              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Qty:</span>
                  <div className="flex items-center space-x-1">
                    <Button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={
                        updating === item.id ||
                        item.quantity <= 1 ||
                        isOutOfStock
                      }
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 active:scale-95 transition-transform"
                    >
                      -
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={
                        updating === item.id ||
                        isOutOfStock ||
                        item.quantity >= effectiveAvailableStock
                      }
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 active:scale-95 transition-transform"
                    >
                      +
                    </Button>
                  </div>
                </div>
                <div className="font-medium text-gray-900">
                  {formatPrice(effectivePrice * item.quantity)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Order Summary - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg lg:hidden z-40">
        <div className="p-4">
          {/* Toggle Summary */}
          <button
            onClick={() => setShowSummary(!showSummary)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-3 touch-manipulation active:scale-[0.98] transition-transform"
          >
            <span className="font-medium text-gray-900">Order Summary</span>
            <div className="flex items-center space-x-2">
              {!showSummary && (
                <span className="font-semibold text-lg">
                  {formatPrice(total)}
                </span>
              )}
              <svg
                className={`w-5 h-5 text-gray-600 transform transition-transform ${
                  showSummary ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </button>

          {/* Expanded Summary */}
          {showSummary && (
            <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
              {totalSavings > 0 && (
                <Badge className="mb-1 bg-green-100 text-green-700 border-green-200 hover:bg-green-100 font-medium">
                  You save {formatPrice(totalSavings)}
                </Badge>
              )}
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900">
                  {formatPrice(subtotal)}
                </span>
              </div>
              {totalSavings > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Item savings</span>
                  <span>-{formatPrice(totalSavings)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" />
                  Shipping
                </span>
                <span
                  className={
                    shipping === 0
                      ? "font-medium text-green-600"
                      : "font-medium text-gray-900"
                  }
                >
                  {shipping === 0 ? "FREE" : formatPrice(shipping)}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-green-600">
                  Add {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} more for
                  free shipping
                </p>
              )}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Stock issue warning */}
          {checkoutDisabled && (
            <p className="text-xs text-red-600 mb-2 text-center">
              Some items are unavailable. Please review your cart.
            </p>
          )}

          {/* Checkout Button */}
          {isGuest ? (
            <Button
              asChild
              className="w-full h-12 active:scale-95 transition-transform"
              size="lg"
            >
              <Link href="/login?redirect=/checkout">Sign In to Checkout</Link>
            </Button>
          ) : (
            <Button
              asChild={!checkoutDisabled}
              disabled={checkoutDisabled}
              className="w-full h-12 active:scale-95 transition-transform"
              size="lg"
            >
              {checkoutDisabled ? (
                <span>Proceed to Checkout</span>
              ) : (
                <Link href="/checkout">Proceed to Checkout</Link>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-10 mb-4 px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif tracking-wide text-lg">
              You May Also Like
            </h2>
            <Link
              href={`/collections/${categoryName}`}
              className="inline-flex items-center text-[10px] font-bold uppercase tracking-[0.2em] border-b border-black pb-1 transition-all"
            >
              <span>View All</span>
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto scroll-smooth pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
            {relatedProducts.slice(0, 4).map((relatedProduct: ProductWithDetails) => (
              <div key={relatedProduct.id} className="flex-none w-[45vw] snap-start">
                <ProductCard
                  product={relatedProduct}
                  showNewBadge={true}
                  showFeaturedBadge={true}
                  onQuickView={() => {
                    router.push(
                      `/collections/${categoryName}/${relatedProduct.urlSlug || relatedProduct.id}`,
                    );
                  }}
                  onWishlistToggle={() => {
                    if (isInWishlist(relatedProduct.id)) {
                      removeFromWishlist(relatedProduct.id);
                    } else {
                      addToWishlist(relatedProduct.id);
                    }
                  }}
                  isWishlisted={isInWishlist(relatedProduct.id)}
                  disabled={wishlistUpdating === relatedProduct.id}
                  className={`transition-all duration-200 ${
                    wishlistUpdating === relatedProduct.id
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

     </div>
  );
}
