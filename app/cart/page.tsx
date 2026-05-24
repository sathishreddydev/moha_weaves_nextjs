"use client";

import { useAuth } from "@/auth";
import DesktopCartView from "@/components/cart/DesktopCartView";
import MobileCartView from "@/components/cart/MobileCartView";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/stores";
import { useSocketStore } from "@/lib/stores/socketStore";
import { useCartProductPurchasedListener } from "@/hooks/useProductPurchasedListener";
import { ProductWithDetails } from "@/shared";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function CartPage() {
  const { status } = useAuth();
  const {
    items,
    loading,
    error,
    updating,
    stockStatus,
    hasStockIssues,
    updateQuantity,
    removeFromCart,
    clearCart,
    calculateTotal,
    syncGuestCart,
    fetchCart,
    validateCartStock,
  } = useCartStore();

  const { socket } = useSocketStore();
  const isGuest = status === "unauthenticated";

  const [relatedProducts, setRelatedProducts] = useState<ProductWithDetails[]>([]);
  const [categoryName, setCategoryName] = useState<string>("all");

  // Re-validate stock when any cart product is purchased by another user
  useCartProductPurchasedListener(items, fetchCart);

  const fetchRelatedProducts = useCallback((cartItems: typeof items) => {
    if (cartItems.length === 0) return;

    const firstItem = cartItems[0];
    const category = firstItem?.product?.category;
    if (!category) return;

    const slug = category.name?.toLowerCase().replace(/\s+/g, "-") || "all";
    const cartProductIds = cartItems.map((i: any) => i.product?.id).filter(Boolean);
    setCategoryName(slug);

    fetch(`/api/products?categories=${encodeURIComponent(category.name)}&limit=8&inStock=true`)
      .then((res) => res.json())
      .then((json: { success: boolean; data: ProductWithDetails[] }) => {
        if (!json.success) return;
        const filtered = json.data.filter((p) => !cartProductIds.includes(p.id));
        setRelatedProducts(filtered.slice(0, 4));
      })
      .catch(() => {
        // silently fail — "You May Also Like" is non-critical
      });
  }, []);

  // Re-fetch cart + related products when admin updates a product
  useEffect(() => {
    if (!socket) return;
    const handleProductEvent = () => {
      fetchCart();
      fetchRelatedProducts(items);
    };
    socket.on("product_event", handleProductEvent);
    return () => {
      socket.off("product_event", handleProductEvent);
    };
  }, [socket, fetchCart, fetchRelatedProducts, items]);

  // Sync guest cart on page load
  useEffect(() => {
    if (isGuest && items.length > 0) {
      syncGuestCart();
    }
  }, [isGuest, items.length, syncGuestCart]);

  // Fetch cart once when auth status resolves (handles login redirect to cart)
  useEffect(() => {
    if (status !== "loading") {
      fetchCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Validate stock whenever items change (add, remove, quantity update, fetch)
  useEffect(() => {
    validateCartStock();
  }, [items, validateCartStock]);

  // Fetch related products whenever cart items change
  useEffect(() => {
    fetchRelatedProducts(items);
  }, [items, fetchRelatedProducts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto">
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
              stockStatus={stockStatus}
              hasStockIssues={hasStockIssues}
              updateQuantity={updateQuantity}
              removeFromCart={removeFromCart}
              clearCart={clearCart}
              calculateTotal={calculateTotal}
              isGuest={isGuest}
              relatedProducts={relatedProducts}
              categoryName={categoryName}
            />
            <MobileCartView
              items={items}
              updating={updating}
              stockStatus={stockStatus}
              hasStockIssues={hasStockIssues}
              updateQuantity={updateQuantity}
              removeFromCart={removeFromCart}
              clearCart={clearCart}
              calculateTotal={calculateTotal}
              isGuest={isGuest}
              relatedProducts={relatedProducts}
              categoryName={categoryName}
            />
          </>
        )}
      </div>
    </div>
  );
}
