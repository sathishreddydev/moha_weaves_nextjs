"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatPrice } from "@/lib/formatters";
import { Minus, Plus, X, Truck } from "lucide-react";
import { getProductUrl } from "@/lib/utils/productUrl";
import { CartItemStockStatus } from "@/lib/stores/cartStore";
import { getAvailableStock } from "@/lib/stock-utils";
import { getEffectivePrice } from "@/lib/pricing-utils";

interface DesktopCartViewProps {
  items: any[];
  updating: string | null;
  stockStatus: Record<string, CartItemStockStatus>;
  hasStockIssues: boolean;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  calculateTotal: () => number;
  isGuest: boolean;
}

const FREE_SHIPPING_THRESHOLD = 999;

export default function DesktopCartView({
  items,
  updating,
  stockStatus,
  hasStockIssues,
  updateQuantity,
  removeFromCart,
  clearCart,
  calculateTotal,
  isGuest,
}: DesktopCartViewProps) {
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
    <div className="hidden lg:block">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items Section */}
        <div className="lg:col-span-2">
          <div className="">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Your Cart ({items.length} items)
                </h2>
                {items.length > 0 && (
                  <Button
                    onClick={clearCart}
                    disabled={updating === "all"}
                    variant="outline"
                    size="sm"
                  >
                    {updating === "all" ? "Clearing..." : "Clear Cart"}
                  </Button>
                )}
              </div>

              <div className="space-y-6">
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
                  const effectiveAvailableStock = itemStock?.availableStock
                    ?? getAvailableStock(item.product, item.variantId);

                  return (
                    <div
                      key={item.id}
                      className={`bg-white border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${
                        isOutOfStock ? "opacity-70 border-red-200" : ""
                      }`}
                    >
                      <div className="p-6">
                        <div className="flex gap-6">
                          {/* Product Image */}
                          <div className="flex-shrink-0 relative">
                            <div className="w-20 h-28 bg-gray-100 rounded-lg overflow-hidden group">
                              {firstImage ? (
                                <img
                                  src={firstImage}
                                  alt={item.product.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-sm text-gray-500">
                                    No image
                                  </span>
                                </div>
                              )}
                            </div>
                            {/* Out of Stock overlay on image */}
                            {isOutOfStock && (
                              <div className="absolute inset-0 bg-white/60 rounded-lg flex items-center justify-center">
                                <span className="text-xs font-semibold text-red-600 bg-white/90 px-1.5 py-0.5 rounded">
                                  Out of Stock
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Product Content */}
                          <div className="flex-1 min-w-0">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                                  <Link
                                    href={getProductUrl(item.product)}
                                    className="hover:text-blue-600 transition-colors"
                                  >
                                    {item.product.name}
                                  </Link>
                                </h3>

                                {/* Product Meta + stock badges */}
                                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                                  {variantInfo && (
                                    <span className="flex items-center gap-1">
                                      Size:{" "}
                                      <span className="font-medium text-gray-900">
                                        {variantInfo.size}
                                      </span>
                                    </span>
                                  )}
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
                              </div>

                              <Button
                                variant="link"
                                size="icon"
                                onClick={() => removeFromCart(item.id)}
                                disabled={updating === item.id}
                                aria-label="Remove item"
                              >
                                <X className="w-4 h-4 text-gray-500 hover:text-red-600" />
                              </Button>
                            </div>

                            {/* Price & Quantity Row */}
                            <div className="flex items-center justify-between">
                              {/* Price Info */}
                              <div className="flex items-center gap-4">
                                {hasDiscount ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-red-600">
                                      {formatPrice(effectivePrice)}
                                    </span>
                                    <span className="text-xs text-gray-500 line-through">
                                      {formatPrice(orig)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-sm font-bold text-gray-900">
                                    {formatPrice(effectivePrice)}
                                  </span>
                                )}
                              </div>

                              {/* Quantity Controls */}
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-700">
                                  Qty:
                                </span>
                                <div className="flex items-center border rounded-lg overflow-hidden">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      updateQuantity(item.id, item.quantity - 1)
                                    }
                                    disabled={
                                      updating === item.id ||
                                      item.quantity <= 1 ||
                                      isOutOfStock
                                    }
                                  >
                                    <Minus />
                                  </Button>
                                  <span className="text-sm w-12 text-center font-medium text-gray-900">
                                    {item.quantity}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      updateQuantity(item.id, item.quantity + 1)
                                    }
                                    disabled={
                                      updating === item.id ||
                                      isOutOfStock ||
                                      item.quantity >= effectiveAvailableStock
                                    }
                                  >
                                    <Plus />
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* Item Total */}
                            <div className="mt-4 pt-4 border-t flex justify-between items-center">
                              <span className="text-sm text-gray-600">Item total</span>
                              <span className="text-lg font-bold text-gray-900">
                                {formatPrice(effectivePrice * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary - Desktop */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>
              {totalSavings > 0 && (
                <Badge className="mb-4 bg-green-100 text-green-700 border-green-200 hover:bg-green-100 font-medium">
                  You save {formatPrice(totalSavings)}
                </Badge>
              )}

              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Item savings</span>
                    <span>-{formatPrice(totalSavings)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" />
                    Shipping
                  </span>
                  <span className={shipping === 0 ? "font-medium text-green-600" : "font-medium text-gray-900"}>
                    {shipping === 0 ? "FREE" : formatPrice(shipping)}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-green-600">
                    Add {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping
                  </p>
                )}
              </div>

              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between text-base font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Stock issue warning */}
              {checkoutDisabled && (
                <p className="text-xs text-red-600 mb-3 text-center">
                  Some items are unavailable. Please review your cart before checking out.
                </p>
              )}

              {isGuest ? (
                <Button asChild className="w-full mb-4" size="lg">
                  <Link href="/login?redirect=/checkout">
                    Sign In to Checkout • {formatPrice(total)}
                  </Link>
                </Button>
              ) : (
                <Button
                  asChild={!checkoutDisabled}
                  disabled={checkoutDisabled}
                  className="w-full mb-4"
                  size="lg"
                >
                  {checkoutDisabled ? (
                    <span>Proceed to Checkout • {formatPrice(total)}</span>
                  ) : (
                    <Link href="/checkout">
                      Proceed to Checkout • {formatPrice(total)}
                    </Link>
                  )}
                </Button>
              )}

              <div className="text-center">
                <Button variant="outline" asChild className="w-full">
                  <Link href="/collections">Continue Shopping</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
