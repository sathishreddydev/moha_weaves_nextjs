"use client";

import { useAuth } from "@/auth";
import DesktopCartView from "@/components/cart/DesktopCartView";
import MobileCartView from "@/components/cart/MobileCartView";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/stores";
import Link from "next/link";
import { useEffect } from "react";

export default function CartPage() {
  const { status } = useAuth();
  const {
    items,
    loading,
    error,
    updating,
    updateQuantity,
    removeFromCart,
    clearCart,
    calculateTotal,
    syncGuestCart,
  } = useCartStore();

  // Show guest user indicator
  const isGuest = status === "unauthenticated";

  // Sync guest cart on page load for guest users
  useEffect(() => {
    if (isGuest && items.length > 0) {
      syncGuestCart();
    }
  }, [isGuest, items.length, syncGuestCart]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {isGuest && items.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Shopping as guest</p>
                <p className="text-sm text-blue-600">
                  Sign in to save your cart and access your orders
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/login?redirect=/cart">Sign In</Link>
              </Button>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">Your cart is empty</div>
            <Button asChild>
              <Link href="/collections">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            <DesktopCartView
              items={items}
              updating={updating}
              updateQuantity={updateQuantity}
              removeFromCart={removeFromCart}
              clearCart={clearCart}
              calculateTotal={calculateTotal}
              isGuest={isGuest}
            />
            <MobileCartView
              items={items}
              updating={updating}
              updateQuantity={updateQuantity}
              removeFromCart={removeFromCart}
              clearCart={clearCart}
              calculateTotal={calculateTotal}
              isGuest={isGuest}
            />
          </>
        )}
      </div>
    </div>
  );
}
