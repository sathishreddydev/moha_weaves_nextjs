"use client";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/stores";
import Link from "next/link";
import { formatPrice } from "@/lib/formatters";
import { Minus, Plus, X } from "lucide-react";
import { getProductUrl } from "@/lib/utils/productUrl";

interface DesktopCartViewProps {
  items: any[];
  updating: string | null;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  calculateTotal: () => number;
  isGuest: boolean;
}

export default function DesktopCartView({
  items,
  updating,
  updateQuantity,
  removeFromCart,
  clearCart,
  calculateTotal,
  isGuest,
}: DesktopCartViewProps) {
  const getProductPrice = (product: any) => {
    if (product.discountedPrice) {
      return {
        original: parseFloat(product.price),
        discounted: product.discountedPrice,
        hasDiscount: true,
      };
    }
    return {
      original: parseFloat(product.price),
      discounted: null,
      hasDiscount: false,
    };
  };

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
                  const price = getProductPrice(item.product);
                  const firstImage = item.product.images?.[0];
                  const variantInfo = item.variantId
                    ? item.product.variants?.find(
                        (v: any) => v.id === item.variantId,
                      )
                    : null;

                  return (
                    <div
                      key={item.id}
                      className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex gap-6">
                          {/* Product Image */}
                          <div className="flex-shrink-0">
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

                                {/* Product Meta */}
                                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                                  {variantInfo && (
                                    <span className="flex items-center gap-1">
                                      Size:{" "}
                                      <span className="font-medium text-gray-900">
                                        {variantInfo.size}
                                      </span>
                                    </span>
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
                                {price.hasDiscount ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-red-600">
                                      {formatPrice(price.discounted || 0)}
                                    </span>
                                    <span className="text-xs text-gray-500 line-through">
                                      {formatPrice(price.original)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-sm font-bold text-gray-900">
                                    {formatPrice(price.original)}
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
                                      updating === item.id || item.quantity <= 1
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
                                    disabled={updating === item.id}
                                  >
                                    <Plus />
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* Item Total */}
                            <div className="mt-4 pt-4 border-t flex justify-between items-center">
                              <span className="text-sm text-gray-600">
                                Item total
                              </span>
                              <span className="text-lg font-bold text-gray-900">
                                {formatPrice(
                                  (price.discounted || price.original) *
                                    item.quantity,
                                )}
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
              <h2 className="text-base font-semibold text-gray-900 mb-6">
                Order Summary
              </h2>

              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(calculateTotal())}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>

              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between text-base font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{formatPrice(calculateTotal())}</span>
                </div>
              </div>

              <Button asChild className="w-full mb-4" size="lg">
                {isGuest ? (
                  <Link href="/login?redirect=/checkout">
                    Sign In to Checkout • {formatPrice(calculateTotal())}
                  </Link>
                ) : (
                  <Link href="/checkout">
                    Proceed to Checkout • {formatPrice(calculateTotal())}
                  </Link>
                )}
              </Button>

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
