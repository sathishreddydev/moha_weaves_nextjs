"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatPrice } from "@/lib/formatters";
import { useState } from "react";
import { ArrowRight, ChevronUp, Minus, Plus, Truck } from "lucide-react";
import Image from "next/image";
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

  const discountedTotal = calculateTotal();

  // Subtotal = sum of original (MRP) prices × quantity
  const subtotal = items.reduce((sum: number, item: any) => {
    const orig = parseFloat(item.product.price || "0");
    return sum + orig * item.quantity;
  }, 0);

  const totalSavings = items.reduce((sum: number, item: any) => {
    const orig = parseFloat(item.product.price || "0");
    const effective = getEffectivePrice(item.product);
    return sum + (orig - effective) * item.quantity;
  }, 0);

  const shipping = discountedTotal >= FREE_SHIPPING_THRESHOLD ? 0 : 50;
  const total = discountedTotal + shipping;

  const checkoutDisabled = hasStockIssues;

  return (
    <div className="lg:hidden">
      {/* Cart Items */}
      <div className="divide-y divide-gray-100 mb-44">
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
          const effectiveAvailableStock =
            itemStock?.availableStock ??
            getAvailableStock(item.product, item.variantId);

          return (
            <div
              key={item.id}
              className={`px-4 py-5 ${isOutOfStock ? "opacity-60" : ""}`}
            >
              <div className="flex gap-4">
                {/* Product Image */}
                <div className="flex-shrink-0 relative">
                  <Link href={getProductUrl(item.product)} className="block">
                    <div className="w-16 h-20 bg-gray-50 rounded overflow-hidden relative">
                      {firstImage ? (
                        <Image
                          src={firstImage}
                          alt={item.product.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <span className="text-[10px]">No image</span>
                        </div>
                      )}
                    </div>
                  </Link>
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-white/70 rounded flex items-center justify-center">
                      <span className="text-[9px] font-semibold text-red-600 bg-white px-1.5 py-0.5 rounded">
                        Sold out
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="text-sm font-medium text-gray-900 leading-snug truncate">
                        <Link
                          href={getProductUrl(item.product)}
                          className="hover:underline"
                        >
                          {item.product.name}
                        </Link>
                      </h3>
                      {variantInfo && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {variantInfo.size}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                      {formatPrice(effectivePrice * item.quantity)}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mt-1">
                    {hasDiscount ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-900">
                          {formatPrice(effectivePrice)}
                        </span>
                        <span className="text-xs text-gray-400 line-through">
                          {formatPrice(orig)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">
                        {formatPrice(effectivePrice)} each
                      </span>
                    )}
                  </div>

                  {/* Stock badges */}
                  {isOutOfStock && (
                    <Badge className="mt-1.5 text-[10px] bg-red-50 text-red-600 border-red-200 hover:bg-red-50">
                      Out of stock
                    </Badge>
                  )}
                  {isLimitedStock && !isOutOfStock && (
                    <Badge className="mt-1.5 text-[10px] bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">
                      Only {effectiveAvailableStock} left
                    </Badge>
                  )}

                  {/* Quantity + Remove */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-gray-300 rounded">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        disabled={
                          updating === item.id ||
                          item.quantity <= 1 ||
                          isOutOfStock
                        }
                        className="w-8 h-8 flex items-center justify-center text-gray-600 disabled:opacity-30 active:bg-gray-100"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-gray-900 border-x border-gray-300 leading-8">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        disabled={
                          updating === item.id ||
                          isOutOfStock ||
                          item.quantity >= effectiveAvailableStock
                        }
                        className="w-8 h-8 flex items-center justify-center text-gray-600 disabled:opacity-30 active:bg-gray-100"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      disabled={updating === item.id}
                      className="text-xs text-gray-500 underline underline-offset-2 hover:text-gray-900 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fixed Bottom Checkout Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] lg:hidden z-40">
        <div className="px-4 py-4">
          {/* Expandable Summary */}
          <button
            onClick={() => setShowSummary(!showSummary)}
            className="w-full flex items-center justify-between mb-3"
          >
            <span className="text-sm text-gray-600 flex items-center gap-1">
              Order Summary
              <ChevronUp
                className={`w-4 h-4 transition-transform ${
                  showSummary ? "" : "rotate-180"
                }`}
              />
            </span>
            {!showSummary && (
              <span className="text-base font-semibold text-gray-900">
                {formatPrice(total)}
              </span>
            )}
          </button>

          {showSummary && (
            <div className="space-y-2 mb-4 pb-3 border-b border-gray-100">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span className="text-gray-900 font-medium">
                  {formatPrice(subtotal)}
                </span>
              </div>
              {totalSavings > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span className="font-medium">
                    -{formatPrice(totalSavings)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Truck className="w-3 h-3" />
                  Shipping
                </span>
                <span
                  className={
                    shipping === 0
                      ? "text-green-600 font-medium"
                      : "text-gray-900 font-medium"
                  }
                >
                  {shipping === 0 ? "Free" : formatPrice(shipping)}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-gray-400">
                  Free shipping on orders over{" "}
                  {formatPrice(FREE_SHIPPING_THRESHOLD)}
                </p>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <span className="text-sm font-semibold text-gray-900">
                  Total
                </span>
                <span className="text-base font-semibold text-gray-900">
                  {formatPrice(total)}
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Tax included. Shipping calculated at checkout.
              </p>
            </div>
          )}

          {/* Stock issue warning */}
          {checkoutDisabled && (
            <p className="text-xs text-red-600 mb-2 text-center">
              Some items are unavailable. Please update your cart.
            </p>
          )}

          {/* Checkout Button */}
          {isGuest ? (
            <Button asChild className="w-full h-12 text-sm font-medium">
              <Link href={items.length > 0 ? "/login?redirect=/checkout" : "/login?redirect=/cart"}>Sign in to Checkout</Link>
            </Button>
          ) : (
            <Button
              asChild={!checkoutDisabled}
              disabled={checkoutDisabled}
              className="w-full h-12 text-sm font-medium"
            >
              {checkoutDisabled ? (
                <span>Checkout</span>
              ) : (
                <Link href="/checkout">Checkout</Link>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-10 mb-4 px-4 border-t border-gray-200 pt-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif tracking-wide text-lg">
              You May Also Like
            </h2>
            <Link
              href={`/collections/${categoryName}`}
              className="inline-flex items-center text-[10px] font-bold uppercase tracking-[0.2em] border-b border-black pb-1 transition-all hover:opacity-70"
            >
              <span>View All</span>
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto scroll-smooth pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
            {relatedProducts
              .slice(0, 4)
              .map((relatedProduct: ProductWithDetails) => (
                <div
                  key={relatedProduct.id}
                  className="flex-none w-[45vw] snap-start"
                >
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
