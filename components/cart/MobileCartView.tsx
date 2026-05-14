"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatPrice } from "@/lib/formatters";
import { useState } from "react";
import { Truck, X } from "lucide-react";
import { getProductUrl } from "@/lib/utils/productUrl";

interface MobileCartViewProps {
  items: any[];
  updating: string | null;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  calculateTotal: () => number;
  isGuest: boolean;
}

const FREE_SHIPPING_THRESHOLD = 999;

export default function MobileCartView({
  items,
  updating,
  updateQuantity,
  removeFromCart,
  clearCart,
  calculateTotal,
  isGuest,
}: MobileCartViewProps) {
  const [showSummary, setShowSummary] = useState(false);

  const getProductPrice = (product: any) => {
    if (product.discountedPrice) {
      return {
        original: parseFloat(product.price),
        discounted: parseFloat(product.discountedPrice),
        hasDiscount: true,
      };
    }
    return {
      original: parseFloat(product.price),
      discounted: null,
      hasDiscount: false,
    };
  };

  const subtotal = calculateTotal();
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 50;
  const total = subtotal + shipping;

  const totalSavings = items.reduce((sum: number, item: any) => {
    const p = getProductPrice(item.product);
    return p.hasDiscount && p.discounted !== null
      ? sum + (p.original - p.discounted) * item.quantity
      : sum;
  }, 0);

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
              className="touch-manipulation active:scale-95 transition-transform"
            >
              {updating === "all" ? "Clearing..." : "Clear"}
            </Button>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="space-y-4 mb-20">
        {items.map((item) => {
          const price = getProductPrice(item.product);
          const firstImage = item.product.images?.[0];
          const variantInfo = item.variantId
            ? item.product.variants?.find((v: any) => v.id === item.variantId)
            : null;

          return (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow p-4 relative"
            >
              {/* Remove Button - Top Right */}
              <Button
                variant="link"
                size="icon"
                onClick={() => removeFromCart(item.id)}
                disabled={updating === item.id}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-95"
                aria-label="Remove item"
              >
                <X className="w-4 h-4 text-gray-500 hover:text-red-600" />
              </Button>
              <div className="flex space-x-4">
                {/* Product Image */}
                <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
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
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
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

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {price.hasDiscount ? (
                        <>
                          <span className="font-medium text-red-600">
                            {formatPrice(price.discounted || 0)}
                          </span>
                          <span className="text-xs text-gray-500 line-through">
                            {formatPrice(price.original)}
                          </span>
                        </>
                      ) : (
                        <span className="font-medium text-gray-900">
                          {formatPrice(price.original)}
                        </span>
                      )}
                    </div>
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
                      disabled={updating === item.id || item.quantity <= 1}
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 touch-manipulation active:scale-95 transition-transform"
                    >
                      -
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={updating === item.id}
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 touch-manipulation active:scale-95 transition-transform"
                    >
                      +
                    </Button>
                  </div>
                </div>
                <div className="font-medium text-gray-900">
                  {formatPrice(
                    (price.discounted || price.original) * item.quantity,
                  )}
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

          {/* Checkout Button */}
          <Button
            asChild
            className="w-full h-12 touch-manipulation active:scale-95 transition-transform"
            size="lg"
          >
            {isGuest ? (
              <Link href="/login?redirect=/checkout">Sign In to Checkout</Link>
            ) : (
              <Link href="/checkout">Proceed to Checkout</Link>
            )}
          </Button>
        </div>
      </div>

      {/* Spacer for fixed bottom */}
      <div className="h-32 lg:hidden"></div>
    </div>
  );
}
