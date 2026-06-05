"use client";

import { useAuth } from "@/auth";
import { CartItemWithProduct } from "@/shared/types";
import { getAvailableStock } from "@/lib/stock-utils";
import { getEffectivePrice } from "@/lib/pricing-utils";
import { guestStorage, GuestCartItem } from "@/lib/guest-storage";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const cartKeys = {
  all: ["cart"] as const,
  list: () => [...cartKeys.all, "list"] as const,
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CartQueryData {
  cart: CartItemWithProduct[];
  count: number;
}

export interface CartItemStockStatus {
  itemId: string;
  outOfStock: boolean;
  limitedStock: boolean;
  availableStock: number;
}

interface AddToCartParams {
  productId: string;
  quantity?: number;
  variantId?: string | null;
}

interface UpdateQuantityParams {
  itemId: string;
  quantity: number;
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────
async function fetchCart(): Promise<CartQueryData> {
  const response = await fetch("/api/cart");
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to fetch cart");
  }
  // API returns { success, data: { cart, count }, isGuest }
  if (result.isGuest) {
    throw new Error("GUEST_USER");
  }
  return result.data;
}

async function postCartItem(params: AddToCartParams): Promise<CartQueryData> {
  const response = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to add to cart");
  }
  return result.data;
}

async function putCartItem(params: UpdateQuantityParams): Promise<CartQueryData> {
  const response = await fetch("/api/cart", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: params.itemId, quantity: params.quantity }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to update cart");
  }
  return result.data;
}

async function deleteCartItem(itemId: string): Promise<CartQueryData> {
  const response = await fetch(`/api/cart?id=${itemId}`, { method: "DELETE" });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to remove from cart");
  }
  return result.data;
}

async function clearCartApi(): Promise<CartQueryData> {
  const response = await fetch("/api/cart?clear=true", { method: "DELETE" });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to clear cart");
  }
  return result.data;
}

// ─── Cart Query Hook ──────────────────────────────────────────────────────────
export function useCartQuery() {
  const { status } = useAuth();

  return useQuery<CartQueryData>({
    queryKey: cartKeys.list(),
    queryFn: fetchCart,
    enabled: status === "authenticated",
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      // Don't retry for guest users
      if ((error as Error).message === "GUEST_USER") return false;
      return failureCount < 2;
    },
  });
}

// ─── Cart Mutations ───────────────────────────────────────────────────────────
export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: AddToCartParams) => postCartItem(params),
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: cartKeys.list() });
      const previous = queryClient.getQueryData<CartQueryData>(cartKeys.list());
      // We can't build a full optimistic item without product data,
      // so we just increment the count for instant badge feedback
      if (previous) {
        queryClient.setQueryData<CartQueryData>(cartKeys.list(), {
          cart: previous.cart,
          count: previous.count + (params.quantity ?? 1),
        });
      }
      return { previous };
    },
    onError: (_err, _params, context) => {
      if (context?.previous) {
        queryClient.setQueryData(cartKeys.list(), context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.list(), data);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

export function useUpdateCartQuantity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateQuantityParams) => putCartItem(params),
    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: cartKeys.list() });
      const previous = queryClient.getQueryData<CartQueryData>(cartKeys.list());
      if (previous) {
        const updatedCart = previous.cart.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        );
        queryClient.setQueryData<CartQueryData>(cartKeys.list(), {
          cart: updatedCart,
          count: updatedCart.reduce((sum, item) => sum + item.quantity, 0),
        });
      }
      return { previous };
    },
    onError: (_err, _params, context) => {
      if (context?.previous) {
        queryClient.setQueryData(cartKeys.list(), context.previous);
      }
    },
    onSuccess: (data, { itemId, quantity }) => {
      // Only update cache if server response differs from our optimistic state
      // (e.g. server capped quantity due to stock). Otherwise skip to avoid
      // replacing the array reference and causing a full re-render.
      const serverItem = data.cart.find((item) => item.id === itemId);
      if (serverItem && serverItem.quantity !== quantity) {
        queryClient.setQueryData(cartKeys.list(), data);
      }
    },
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => deleteCartItem(itemId),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: cartKeys.list() });
      const previous = queryClient.getQueryData<CartQueryData>(cartKeys.list());
      if (previous) {
        const filtered = previous.cart.filter((item) => item.id !== itemId);
        queryClient.setQueryData<CartQueryData>(cartKeys.list(), {
          cart: filtered,
          count: filtered.reduce((sum, item) => sum + item.quantity, 0),
        });
      }
      return { previous };
    },
    onError: (_err, _params, context) => {
      if (context?.previous) {
        queryClient.setQueryData(cartKeys.list(), context.previous);
      }
    },
    // No onSuccess needed — optimistic removal is already correct.
    // If it somehow failed, onError rolls back.
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => clearCartApi(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: cartKeys.list() });
      const previous = queryClient.getQueryData<CartQueryData>(cartKeys.list());
      queryClient.setQueryData<CartQueryData>(cartKeys.list(), { cart: [], count: 0 });
      return { previous };
    },
    onError: (_err, _params, context) => {
      if (context?.previous) {
        queryClient.setQueryData(cartKeys.list(), context.previous);
      }
    },
    onSuccess: () => {
      queryClient.setQueryData<CartQueryData>(cartKeys.list(), { cart: [], count: 0 });
    },
  });
}

// ─── Guest Cart Hook ──────────────────────────────────────────────────────────
export function useGuestCart() {
  const [items, setItems] = useState<GuestCartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setItems(guestStorage.cart.get());
  }, []);

  const count = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );

  const refreshItems = useCallback(() => {
    setItems(guestStorage.cart.get());
  }, []);

  const addToCart = useCallback(
    async (productId: string, quantity = 1, variantId?: string | null) => {
      setLoading(true);
      setError(null);
      try {
        // Fetch product details for stock validation
        const productResponse = await fetch(`/api/products/${productId}`);
        const productData = await productResponse.json();

        if (productData.success && productData.data) {
          const p = productData.data;
          const variant = variantId
            ? p.variants?.find((v: any) => v.id === variantId)
            : null;
          const stock = variant
            ? variant.onlineStock || 0
            : p.variants?.length
              ? p.variants.reduce((sum: number, v: any) => sum + (v.onlineStock || 0), 0)
              : p.onlineStock || 0;

          const existingCart = guestStorage.cart.get();
          const existingItem = existingCart.find(
            (item) =>
              item.productId === productId &&
              item.variantId === (variantId || undefined)
          );
          const currentQty = existingItem?.quantity || 0;

          if (currentQty + quantity > stock) {
            setError(`Only ${stock} items available in stock.`);
            setLoading(false);
            return;
          }

          guestStorage.cart.add({
            productId,
            quantity,
            variantId: variantId || undefined,
            product: {
              id: p.id,
              name: p.name,
              description: p.description,
              price: p.price,
              discountedPrice: p.discountedPrice,
              activeSale: p.activeSale || null,
              variants: p.variants || [],
              categoryId: p.categoryId,
              subcategoryId: p.subcategoryId,
              colorId: p.colorId,
              fabricId: p.fabricId,
              imageUrl: p.imageUrl,
              images: p.images || [],
              videoUrl: p.videoUrl,
              sku: p.sku,
              totalStock: p.totalStock,
              onlineStock: p.onlineStock,
              distributionChannel: p.distributionChannel,
              isActive: p.isActive,
              isFeatured: p.isFeatured,
              createdAt: p.createdAt,
              updatedAt: p.updatedAt,
              category: p.category,
              subcategory: p.subcategory,
              color: p.color,
              fabric: p.fabric,
            },
          });
        } else {
          guestStorage.cart.add({
            productId,
            quantity,
            variantId: variantId || undefined,
          });
        }

        refreshItems();
      } catch {
        setError("Failed to add to cart");
      } finally {
        setLoading(false);
      }
    },
    [refreshItems]
  );

  const updateQuantity = useCallback(
    (itemId: string, quantity: number) => {
      if (quantity < 1) return;
      guestStorage.cart.update(itemId, quantity);
      refreshItems();
    },
    [refreshItems]
  );

  const removeFromCart = useCallback(
    (itemId: string) => {
      guestStorage.cart.remove(itemId);
      refreshItems();
    },
    [refreshItems]
  );

  const clearCart = useCallback(() => {
    guestStorage.cart.clear();
    refreshItems();
  }, [refreshItems]);

  return {
    items,
    count,
    loading,
    error,
    setError,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshItems,
  };
}

// ─── Stock Validation Hook ────────────────────────────────────────────────────
export function useCartStockValidation(items: CartItemWithProduct[]) {
  return useMemo(() => {
    if (items.length === 0) return { stockStatus: {} as Record<string, CartItemStockStatus>, hasStockIssues: false };

    const stockStatus: Record<string, CartItemStockStatus> = {};
    for (const item of items) {
      const availableStock = getAvailableStock(item.product as any, item.variantId);
      const outOfStock = availableStock === 0;
      const limitedStock = !outOfStock && availableStock < item.quantity;
      stockStatus[item.id] = { itemId: item.id, outOfStock, limitedStock, availableStock };
    }
    const hasStockIssues = Object.values(stockStatus).some(
      (s) => s.outOfStock || s.limitedStock
    );
    return { stockStatus, hasStockIssues };
  }, [items]);
}

// ─── Cart Count Hook (unified auth + guest) ───────────────────────────────────
export function useCartCount() {
  const { status } = useAuth();
  const { data: cartData } = useCartQuery();
  const [guestCount, setGuestCount] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") {
      setGuestCount(guestStorage.cart.getCount());
    }
  }, [status]);

  // Listen for localStorage changes (cross-tab sync + local updates)
  useEffect(() => {
    if (status === "authenticated") return;

    const handler = (e: StorageEvent) => {
      if (e.key === "urumi_guest_cart") {
        setGuestCount(guestStorage.cart.getCount());
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [status]);

  // Provide a manual refresh for same-tab updates
  const refreshGuestCount = useCallback(() => {
    if (status !== "authenticated") {
      setGuestCount(guestStorage.cart.getCount());
    }
  }, [status]);

  if (status === "authenticated") {
    return { count: cartData?.count ?? 0, refreshGuestCount };
  }
  return { count: guestCount, refreshGuestCount };
}

// ─── Calculate Total Helper ───────────────────────────────────────────────────
export function calculateCartTotal(items: CartItemWithProduct[]): number {
  return items.reduce((total, item) => {
    const product = item.product as any;
    const variant = item.variantId
      ? product.variants?.find((v: any) => v.id === item.variantId)
      : null;
    const variantPrice = variant?.price ? parseFloat(variant.price) : null;
    const price = variantPrice ?? getEffectivePrice(product);
    return total + price * item.quantity;
  }, 0);
}

// ─── Invalidation Helpers ─────────────────────────────────────────────────────
export function useInvalidateCart() {
  const queryClient = useQueryClient();

  return {
    invalidateCart: () =>
      queryClient.invalidateQueries({ queryKey: cartKeys.all }),
    removeCartCache: () =>
      queryClient.removeQueries({ queryKey: cartKeys.all }),
  };
}
