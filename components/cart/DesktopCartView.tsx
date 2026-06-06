"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatPrice } from "@/lib/formatters";
import { Minus, Plus, Truck, ArrowRight } from "lucide-react";
import Image from "next/image";
import { getProductUrl } from "@/lib/utils/productUrl";
import { CartItemStockStatus } from "@/hooks/useCartQueries";
import { getAvailableStock } from "@/lib/stock-utils";
import { getEffectivePrice } from "@/lib/pricing-utils";
import ProductCard from "../products/ProductCard";
import { useRouter } from "next/navigation";
import { useAuth } from "@/auth";
import { useWishlistQuery, useAddToWishlist, useRemoveFromWishlist, useGuestWishlist } from "@/hooks/useWishlistQueries";
import { ProductWithDetails } from "@/shared";

interface DesktopCartViewProps {
  items: any[];
  updating: string | null;
  updatingAction?: "updating" | "removing" | "clearing" | null;
  stockStatus: Record<string, CartItemStockStatus>;
  hasStockIssues: boolean;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  calculateTotal: () => number;
  isGuest: boolean;
  relatedProducts?: ProductWithDetails[];
  categoryName?: string;
  onCheckout?: () => void;
}

const FREE_SHIPPING_THRESHOLD = 999;

export default function DesktopCartView({
  items,
  updating,
  updatingAction,
  stockStatus,
  hasStockIssues,
  updateQuantity,
  removeFromCart,
  calculateTotal,
  isGuest,
  relatedProducts = [],
  categoryName = "all",
  onCheckout,
}: DesktopCartViewProps) {
  const discountedTotal = calculateTotal();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  
  // Wishlist hooks
  const { data: wishlistData } = useWishlistQuery();
  const addToWishlistMutation = useAddToWishlist();
  const removeFromWishlistMutation = useRemoveFromWishlist();
  const guestWishlist = useGuestWishlist();
  
  const addToWishlist = (productId: string) => {
    if (isAuthenticated) {
      addToWishlistMutation.mutate(productId);
    } else {
      guestWishlist.addToWishlist(productId);
    }
  };
  const removeFromWishlist = (productId: string) => {
    if (isAuthenticated) {
      removeFromWishlistMutation.mutate(productId);
    } else {
      guestWishlist.removeFromWishlist(productId);
    }
  };
  const isInWishlist = (productId: string) => {
    if (isAuthenticated) {
      return (wishlistData?.wishlist ?? []).some(item => item.productId === productId);
    }
    return guestWishlist.isInWishlist(productId);
  };
  const wishlistUpdating = addToWishlistMutation.isPending || removeFromWishlistMutation.isPending
    ? (addToWishlistMutation.variables || removeFromWishlistMutation.variables || null)
    : guestWishlist.updating;

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
    <div className="hidden lg:block">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Cart Items Section */}
        <div className="lg:col-span-2">
          {/* Table Header */}
          <div className="border-b border-gray-200 pb-4 mb-0">
            <div className="grid grid-cols-[1fr_120px_140px_100px] gap-4 items-center">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Product
              </span>
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500 text-center">
                Price
              </span>
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500 text-center">
                Quantity
              </span>
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500 text-right">
                Total
              </span>
            </div>
          </div>

          {/* Cart Items */}
          <div className="divide-y divide-gray-100">
            {items.map((item) => {
              const orig = parseFloat(item.product.price || "0");
              const effectivePrice = getEffectivePrice(item.product);
              const hasDiscount = effectivePrice < orig;
              const firstImage = item.product.images?.[0];
              const variantInfo = item.variantId
                ? item.product.variants?.find(
                    (v: any) => v.id === item.variantId,
                  )
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
                  className={`relative grid grid-cols-[1fr_120px_140px_100px] gap-4 items-center py-6 ${
                    isOutOfStock ? "opacity-60" : ""
                  }`}
                >
                  {/* Removing status overlay — only shown for remove action */}
                  {updating === item.id && updatingAction === "removing" && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 rounded-lg backdrop-blur-[1px]">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 shadow-sm px-3 py-1.5 rounded-full">
                        <span className="inline-block w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                        Removing…
                      </span>
                    </div>
                  )}
                  {/* Product Info */}
                  <div className="flex gap-5">
                    <div className="flex-shrink-0 relative">
                      <Link href={getProductUrl(item.product)} className="block">
                        <div className="w-[80px] h-[100px] bg-gray-50 rounded overflow-hidden relative">
                          {firstImage ? (
                            <Image
                              src={firstImage}
                              alt={item.product.name}
                              fill
                              sizes="80px"
                              className="object-cover hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <span className="text-xs">No image</span>
                            </div>
                          )}
                        </div>
                      </Link>
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-white/70 rounded flex items-center justify-center">
                          <span className="text-[10px] font-semibold text-red-600 bg-white px-2 py-0.5 rounded">
                            Sold out
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-center min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 leading-snug">
                        <Link
                          href={getProductUrl(item.product)}
                          className="hover:underline"
                        >
                          {item.product.name}
                        </Link>
                      </h3>

                      {variantInfo && (
                        <p className="text-sm text-gray-500 mt-1">
                          {variantInfo.size}
                        </p>
                      )}

                      {/* Stock badges */}
                      {isOutOfStock && (
                        <Badge className="mt-2 w-fit text-[10px] bg-red-50 text-red-600 border-red-200 hover:bg-red-50">
                          Out of stock
                        </Badge>
                      )}
                      {isLimitedStock && !isOutOfStock && (
                        <Badge className="mt-2 w-fit text-[10px] bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">
                          Only {effectiveAvailableStock} left
                        </Badge>
                      )}

                      <button
                        onClick={() => removeFromCart(item.id)}
                        disabled={updating === item.id}
                        className="mt-3 text-xs text-gray-500 underline underline-offset-2 hover:text-gray-900 transition-colors w-fit disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-center">
                    {hasDiscount ? (
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-sm font-medium text-gray-900">
                          {formatPrice(effectivePrice)}
                        </span>
                        <span className="text-xs text-gray-400 line-through">
                          {formatPrice(orig)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-gray-900">
                        {formatPrice(effectivePrice)}
                      </span>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="flex justify-center">
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        disabled={
                          item.quantity <= 1 ||
                          isOutOfStock
                        }
                        className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-10 text-center text-sm font-medium text-gray-900 border-x border-gray-300">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        disabled={
                          isOutOfStock ||
                          item.quantity >= effectiveAvailableStock
                        }
                        className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Line Total */}
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">
                      {formatPrice(effectivePrice * item.quantity)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div
            className="sticky"
            style={{
              top: "calc(var(--banner-height, 0px) + var(--header-height, 74px) + 1.5rem)",
            }}
          >
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-5">
                Order Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>
                    Subtotal ({items.length}{" "}
                    {items.length === 1 ? "item" : "items"})
                  </span>
                  <span className="text-gray-900 font-medium">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                {totalSavings > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">
                      -{formatPrice(totalSavings)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
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
                  <p className="text-xs text-gray-500">
                    Free shipping on orders over{" "}
                    {formatPrice(FREE_SHIPPING_THRESHOLD)}
                  </p>
                )}
              </div>

              <div className="border-t border-gray-200 mt-5 pt-5">
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-gray-900">
                    Total
                  </span>
                  <span className="text-lg font-semibold text-gray-900">
                    {formatPrice(total)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Tax included. Shipping calculated at checkout.
                </p>
              </div>

              {/* Stock issue warning */}
              {checkoutDisabled && (
                <p className="text-xs text-red-600 mt-4 text-center">
                  Some items are unavailable. Please update your cart.
                </p>
              )}

              <div className="mt-6 space-y-3">
                {isGuest ? (
                  <Button asChild className="w-full h-10 text-sm font-medium">
                    <Link href="/login?redirect=/cart">
                      Sign in to Checkout
                    </Link>
                  </Button>
                ) : onCheckout ? (
                  <Button
                    onClick={onCheckout}
                    disabled={checkoutDisabled}
                    className="w-full h-10 text-sm font-medium"
                  >
                    Checkout
                  </Button>
                ) : (
                  <Button
                    asChild={!checkoutDisabled}
                    disabled={checkoutDisabled}
                    className="w-full h-10 text-sm font-medium"
                  >
                    {checkoutDisabled ? (
                      <span>Checkout</span>
                    ) : (
                      <Link href="/checkout">Checkout</Link>
                    )}
                  </Button>
                )}

                <Link
                  href="/collections"
                  className="block text-center text-sm text-gray-600 underline underline-offset-4 hover:text-gray-900 transition-colors"
                >
                  Continue shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-20 border-t border-gray-200 pt-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif text-2xl tracking-wide">
              You May Also Like
            </h2>
            <Link
              href={`/collections/${categoryName}`}
              className="inline-flex items-center text-[10px] font-bold uppercase tracking-[0.2em] border-b border-black pb-2 transition-all hover:opacity-70"
            >
              <span>View All</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts
              .slice(0, 4)
              .map((relatedProduct: ProductWithDetails) => (
                <ProductCard
                  key={relatedProduct.id}
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
                      : "hover:scale-[1.02]"
                  }`}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
