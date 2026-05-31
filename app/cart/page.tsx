"use client";

import { useAuth } from "@/auth";
import DesktopCartView from "@/components/cart/DesktopCartView";
import MobileCartView from "@/components/cart/MobileCartView";
import { Button } from "@/components/ui/button";
import {
  useCartQuery,
  useGuestCart,
  useUpdateCartQuantity,
  useRemoveFromCart,
  useClearCart,
  useCartStockValidation,
  calculateCartTotal,
} from "@/hooks/useCartQueries";
import { useCartSocketSync } from "@/hooks/useCartSocketSync";
import { useSocketStore } from "@/lib/stores/socketStore";
import { useCartProductPurchasedListener } from "@/hooks/useProductPurchasedListener";
import { syncGuestCart } from "@/lib/guest-cart-sync";
import { ProductWithDetails } from "@/shared";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function CartPage() {
  const { status } = useAuth();
  const isGuest = status === "unauthenticated";

  // ── Authenticated cart via React Query ──────────────────────────────────
  const {
    data: cartData,
    isLoading: authLoading,
    error: authError,
    refetch: refetchCart,
  } = useCartQuery();

  // ── Guest cart via localStorage ─────────────────────────────────────────
  const guestCart = useGuestCart();

  // ── Unified items/count based on auth status ────────────────────────────
  const items = isGuest ? (guestCart.items as any) : (cartData?.cart ?? []);
  const loading = status === "loading" || (isGuest ? guestCart.loading : authLoading);
  const error = isGuest ? guestCart.error : authError ? (authError as Error).message : null;

  // ── Mutations (authenticated) ───────────────────────────────────────────
  const updateQuantityMutation = useUpdateCartQuantity();
  const removeFromCartMutation = useRemoveFromCart();
  const clearCartMutation = useClearCart();

  // ── Stock validation ────────────────────────────────────────────────────
  const { stockStatus, hasStockIssues } = useCartStockValidation(items);

  // ── Socket sync for real-time updates ───────────────────────────────────
  useCartSocketSync();

  const { socket } = useSocketStore();
  const hasSyncedRef = useRef(false);

  const [relatedProducts, setRelatedProducts] = useState<ProductWithDetails[]>([]);
  const [categoryName, setCategoryName] = useState<string>("all");

  // Stable reference for socket listener
  const cartProductIds = useMemo(
    () => items.map((i: any) => i.productId).sort().join(","),
    [items]
  );

  const stableItemsForSocket = useMemo(
    () => items.map((i: any) => ({ productId: i.productId, variantId: i.variantId })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cartProductIds]
  );

  // Re-validate stock when any cart product is purchased by another user
  useCartProductPurchasedListener(stableItemsForSocket, () => {
    if (!isGuest) refetchCart();
  });

  const fetchRelatedProducts = useCallback((cartItems: typeof items) => {
    if (cartItems.length === 0) return;

    const firstItem = cartItems[0];
    const category = firstItem?.product?.category;
    if (!category) return;

    const slug = category.name?.toLowerCase().replace(/\s+/g, "-") || "all";
    const productIds = cartItems.map((i: any) => i.product?.id).filter(Boolean);
    setCategoryName(slug);

    fetch(`/api/products?categories=${encodeURIComponent(category.name)}&limit=8&inStock=true`)
      .then((res) => res.json())
      .then((json: { success: boolean; data: ProductWithDetails[] }) => {
        if (!json.success) return;
        const filtered = json.data.filter((p) => !productIds.includes(p.id));
        setRelatedProducts(filtered.slice(0, 4));
      })
      .catch(() => {});
  }, []);

  // Re-fetch cart + related products when admin updates a product or offer
  useEffect(() => {
    if (!socket) return;
    const handleProductEvent = () => {
      if (!isGuest) {
        refetchCart();
      }
    };
    socket.on("product_event", handleProductEvent);
    socket.on("offer_event", handleProductEvent);
    return () => {
      socket.off("product_event", handleProductEvent);
      socket.off("offer_event", handleProductEvent);
    };
  }, [socket, isGuest, refetchCart]);

  // Sync guest cart ONCE on page load
  useEffect(() => {
    if (isGuest && !hasSyncedRef.current && items.length > 0) {
      hasSyncedRef.current = true;
      syncGuestCart({
        validateStock: true,
        updatePrices: true,
        removeOutOfStock: false,
      }).then(() => {
        guestCart.refreshItems();
      });
    }
  }, [isGuest, items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch related products only when the set of product IDs changes
  useEffect(() => {
    fetchRelatedProducts(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartProductIds, fetchRelatedProducts]);

  // ── Unified action handlers ─────────────────────────────────────────────
  const updatingInfo: { itemId: string; action: "updating" | "removing" | "clearing" } | null =
    updateQuantityMutation.isPending
      ? { itemId: updateQuantityMutation.variables?.itemId ?? "", action: "updating" }
      : removeFromCartMutation.isPending
        ? { itemId: removeFromCartMutation.variables ?? "", action: "removing" }
        : clearCartMutation.isPending
          ? { itemId: "all", action: "clearing" }
          : null;

  const updating = updatingInfo?.itemId ?? null;

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (quantity < 1) return;
      if (isGuest) {
        guestCart.updateQuantity(itemId, quantity);
      } else {
        updateQuantityMutation.mutate({ itemId, quantity });
      }
    },
    [isGuest, guestCart, updateQuantityMutation]
  );

  const removeFromCart = useCallback(
    async (itemId: string) => {
      if (isGuest) {
        guestCart.removeFromCart(itemId);
      } else {
        removeFromCartMutation.mutate(itemId);
      }
    },
    [isGuest, guestCart, removeFromCartMutation]
  );

  const clearCart = useCallback(async () => {
    if (isGuest) {
      guestCart.clearCart();
    } else {
      clearCartMutation.mutate();
    }
  }, [isGuest, guestCart, clearCartMutation]);

  const calculateTotal = useCallback(() => {
    return calculateCartTotal(items);
  }, [items]);

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
        <h1 className="text-xl font-light text-gray-900 uppercase tracking-[0.1em] mb-8">
          Your Cart
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {isGuest && items.length > 0 && (
          <div className="border border-gray-200 bg-gray-50/50 px-5 py-3.5 rounded-lg mb-6">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                <Link href="/login?redirect=/cart" className="font-medium text-gray-900 underline underline-offset-2 hover:text-amber-800 transition-colors">Sign in</Link>
                {" "}to save your cart and track orders
              </p>
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
              updatingAction={updatingInfo?.action ?? null}
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
              updatingAction={updatingInfo?.action ?? null}
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
