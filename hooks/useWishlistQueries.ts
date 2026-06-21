"use client";

import { useAuth } from "@/auth";
import { WishlistItemWithProduct } from "@/shared/types";
import { guestStorage, GuestWishlistItem } from "@/lib/guest-storage";
import { cartKeys } from "./useCartQueries";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const wishlistKeys = {
  all: ["wishlist"] as const,
  list: () => [...wishlistKeys.all, "list"] as const,
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface WishlistQueryData {
  wishlist: WishlistItemWithProduct[];
  count: number;
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────
async function fetchWishlist(): Promise<WishlistQueryData> {
  const response = await fetch("/api/wishlist");
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to fetch wishlist");
  }
  if (result.isGuest) {
    throw new Error("GUEST_USER");
  }
  return result.data;
}

async function postWishlistItem(productId: string): Promise<WishlistQueryData> {
  const response = await fetch("/api/wishlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to add to wishlist");
  }
  return result.data;
}

async function deleteWishlistItem(productId: string): Promise<WishlistQueryData> {
  const response = await fetch(`/api/wishlist?productId=${productId}`, {
    method: "DELETE",
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to remove from wishlist");
  }
  return result.data;
}

async function moveWishlistItemToCart(params: {
  productId: string;
  variantId?: string | null;
}): Promise<{ cart: any; wishlist: WishlistQueryData }> {
  // Add to cart first
  const cartResponse = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: params.productId,
      quantity: 1,
      variantId: params.variantId,
    }),
  });
  const cartResult = await cartResponse.json();
  if (!cartResponse.ok) {
    throw new Error(cartResult.error || "Failed to add to cart");
  }

  // Then remove from wishlist
  const wishlistResponse = await fetch(
    `/api/wishlist?productId=${params.productId}`,
    { method: "DELETE" }
  );
  const wishlistResult = await wishlistResponse.json();
  if (!wishlistResponse.ok) {
    throw new Error(wishlistResult.error || "Failed to remove from wishlist");
  }

  return { cart: cartResult.data, wishlist: wishlistResult.data };
}

// ─── Wishlist Query Hook ──────────────────────────────────────────────────────
export function useWishlistQuery() {
  const { status, isMerging } = useAuth();

  return useQuery<WishlistQueryData>({
    queryKey: wishlistKeys.list(),
    queryFn: fetchWishlist,
    // Don't fetch wishlist while guest data is being merged to the server
    enabled: status === "authenticated" && !isMerging,
    staleTime: 60 * 1000, // 60 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      if ((error as Error).message === "GUEST_USER") return false;
      return failureCount < 2;
    },
  });
}

// ─── Wishlist Mutations ───────────────────────────────────────────────────────
export function useAddToWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => postWishlistItem(productId),
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: wishlistKeys.list() });
      const previous = queryClient.getQueryData<WishlistQueryData>(wishlistKeys.list());
      if (previous) {
        queryClient.setQueryData<WishlistQueryData>(wishlistKeys.list(), {
          wishlist: [
            ...previous.wishlist,
            { productId, product: {} } as any, // placeholder
          ],
          count: previous.count + 1,
        });
      }
      return { previous };
    },
    onError: (_err, _params, context) => {
      if (context?.previous) {
        queryClient.setQueryData(wishlistKeys.list(), context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(wishlistKeys.list(), data);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
    },
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => deleteWishlistItem(productId),
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: wishlistKeys.list() });
      const previous = queryClient.getQueryData<WishlistQueryData>(wishlistKeys.list());
      if (previous) {
        queryClient.setQueryData<WishlistQueryData>(wishlistKeys.list(), {
          wishlist: previous.wishlist.filter((item) => item.productId !== productId),
          count: previous.count - 1,
        });
      }
      return { previous };
    },
    onError: (_err, _params, context) => {
      if (context?.previous) {
        queryClient.setQueryData(wishlistKeys.list(), context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(wishlistKeys.list(), data);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
    },
  });
}

export function useMoveToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { productId: string; variantId?: string | null }) =>
      moveWishlistItemToCart(params),
    onMutate: async ({ productId }) => {
      await queryClient.cancelQueries({ queryKey: wishlistKeys.list() });
      await queryClient.cancelQueries({ queryKey: cartKeys.list() });
      const previousWishlist = queryClient.getQueryData<WishlistQueryData>(
        wishlistKeys.list()
      );
      // Optimistically remove from wishlist
      if (previousWishlist) {
        queryClient.setQueryData<WishlistQueryData>(wishlistKeys.list(), {
          wishlist: previousWishlist.wishlist.filter(
            (item) => item.productId !== productId
          ),
          count: previousWishlist.count - 1,
        });
      }
      return { previousWishlist };
    },
    onError: (_err, _params, context) => {
      if (context?.previousWishlist) {
        queryClient.setQueryData(wishlistKeys.list(), context.previousWishlist);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

// ─── Guest Wishlist Hook ──────────────────────────────────────────────────────

interface NormalizedGuestWishlistItem {
  productId: string;
  addedAt: string;
  product?: GuestWishlistItem["product"];
}

function normalizeWishlistItems(
  raw: (string | GuestWishlistItem)[]
): NormalizedGuestWishlistItem[] {
  return raw.map((item) => {
    if (typeof item === "string") {
      return { productId: item, addedAt: new Date().toISOString() };
    }
    return item as NormalizedGuestWishlistItem;
  });
}

export function useGuestWishlist() {
  const [items, setItems] = useState<NormalizedGuestWishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const count = items.length;

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = guestStorage.wishlist.get();
    setItems(normalizeWishlistItems(stored));
  }, []);

  const refreshItems = useCallback(() => {
    const stored = guestStorage.wishlist.get();
    setItems(normalizeWishlistItems(stored));
  }, []);

  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const guestWishlist = guestStorage.wishlist.get();
      const enrichedItems: NormalizedGuestWishlistItem[] = [];
      let needsUpdate = false;

      for (const item of guestWishlist) {
        const productId = typeof item === "string" ? item : item.productId;
        const hasProductData =
          typeof item !== "string" && item.product?.images;

        if (hasProductData) {
          enrichedItems.push(item as NormalizedGuestWishlistItem);
        } else {
          try {
            const productResponse = await fetch(`/api/products/${productId}`);
            const productData = await productResponse.json();

            if (productData.success && productData.data) {
              const p = productData.data;
              enrichedItems.push({
                productId,
                addedAt:
                  typeof item !== "string"
                    ? item.addedAt
                    : new Date().toISOString(),
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
              needsUpdate = true;
            } else {
              needsUpdate = true; // product not found, skip
            }
          } catch {
            enrichedItems.push(
              typeof item === "string"
                ? { productId: item, addedAt: new Date().toISOString() }
                : (item as NormalizedGuestWishlistItem)
            );
          }
        }
      }

      if (needsUpdate) {
        guestStorage.wishlist.set(enrichedItems as any);
      }

      setItems(enrichedItems);
    } catch {
      setError("Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  }, []);

  const addToWishlist = useCallback(
    async (productId: string) => {
      setUpdating(productId);
      setError(null);
      try {
        const productResponse = await fetch(`/api/products/${productId}`);
        const productData = await productResponse.json();

        guestStorage.wishlist.add(productId);

        if (productData.success && productData.data) {
          const p = productData.data;
          const guestWishlist = guestStorage.wishlist.get();
          const updatedWishlist = guestWishlist.map((item: any) => {
            const itemProductId =
              typeof item === "string" ? item : item.productId;
            if (itemProductId === productId) {
              return {
                productId,
                addedAt:
                  typeof item !== "string" && item.addedAt
                    ? item.addedAt
                    : new Date().toISOString(),
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
              };
            }
            return item;
          });
          guestStorage.wishlist.set(updatedWishlist);
        }

        refreshItems();
      } catch {
        setError("Failed to add to wishlist");
      } finally {
        setUpdating(null);
      }
    },
    [refreshItems]
  );

  const removeFromWishlist = useCallback(
    (productId: string) => {
      setUpdating(productId);
      guestStorage.wishlist.remove(productId);
      refreshItems();
      setUpdating(null);
    },
    [refreshItems]
  );

  const isInWishlist = useCallback(
    (productId: string) => items.some((item) => item.productId === productId),
    [items]
  );

  const clearWishlist = useCallback(() => {
    guestStorage.wishlist.clear();
    refreshItems();
  }, [refreshItems]);

  return {
    items,
    count,
    loading,
    error,
    updating,
    setError,
    fetchWishlist,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
    refreshItems,
  };
}

// ─── Wishlist Count Hook (unified auth + guest) ───────────────────────────────
export function useWishlistCount() {
  const { status } = useAuth();
  const { data: wishlistData } = useWishlistQuery();
  const [guestCount, setGuestCount] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") {
      setGuestCount(guestStorage.wishlist.getCount());
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") return;

    const handler = (e: StorageEvent) => {
      if (e.key === "urumi_guest_wishlist") {
        setGuestCount(guestStorage.wishlist.getCount());
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [status]);

  const refreshGuestCount = useCallback(() => {
    if (status !== "authenticated") {
      setGuestCount(guestStorage.wishlist.getCount());
    }
  }, [status]);

  if (status === "authenticated") {
    return { count: wishlistData?.count ?? 0, refreshGuestCount };
  }
  return { count: guestCount, refreshGuestCount };
}

// ─── Invalidation Helpers ─────────────────────────────────────────────────────
export function useInvalidateWishlist() {
  const queryClient = useQueryClient();

  return {
    invalidateWishlist: () =>
      queryClient.invalidateQueries({ queryKey: wishlistKeys.all }),
    removeWishlistCache: () =>
      queryClient.removeQueries({ queryKey: wishlistKeys.all }),
  };
}
