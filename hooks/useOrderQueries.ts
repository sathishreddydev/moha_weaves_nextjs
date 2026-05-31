"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { OrderWithItems } from "@/shared";

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (page: number, pageSize: number) =>
    [...orderKeys.lists(), { page, pageSize }] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface OrderListResponse {
  data: OrderWithItems[];
  totalPages: number;
  currentPage: number;
  totalOrders: number;
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────
async function fetchOrders(page: number, pageSize: number): Promise<OrderListResponse> {
  const response = await fetch(`/api/orders?page=${page}&pageSize=${pageSize}`);
  if (!response.ok) throw new Error("Failed to fetch orders");
  return response.json();
}

async function fetchOrderDetails(orderId: string): Promise<OrderWithItems> {
  const response = await fetch(`/api/orders/${orderId}`);
  if (!response.ok) throw new Error("Failed to fetch order details");
  return response.json();
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetches paginated order list with caching.
 * - Cached for 2 minutes (staleTime)
 * - Shows previous page data while fetching next page (placeholderData)
 * - Automatically deduplicates concurrent requests
 */
export function useOrderList(page: number, pageSize: number) {
  return useQuery({
    queryKey: orderKeys.list(page, pageSize),
    queryFn: () => fetchOrders(page, pageSize),
    staleTime: 2 * 60 * 1000, // 2 minutes — orders change less frequently
    gcTime: 10 * 60 * 1000, // keep in cache for 10 minutes
    placeholderData: (previousData) => previousData, // keep previous page visible while loading next
  });
}

/**
 * Fetches a single order's details with caching.
 * - Cached for 1 minute (staleTime)
 * - Only fetches when orderId is truthy
 */
export function useOrderDetails(orderId: string | null) {
  return useQuery({
    queryKey: orderKeys.detail(orderId!),
    queryFn: () => fetchOrderDetails(orderId!),
    enabled: !!orderId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // keep in cache for 5 minutes
  });
}

/**
 * Utility hook to invalidate order queries (useful after real-time events).
 */
export function useInvalidateOrders() {
  const queryClient = useQueryClient();

  return {
    /** Invalidate all order list pages */
    invalidateList: () =>
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() }),

    /** Invalidate a specific order detail */
    invalidateDetail: (orderId: string) =>
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) }),

    /** Invalidate everything order-related */
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: orderKeys.all }),

    /** Optimistically update order detail in cache */
    setOrderDetail: (orderId: string, updater: (old: OrderWithItems | undefined) => OrderWithItems | undefined) =>
      queryClient.setQueryData(orderKeys.detail(orderId), updater),

    /** Optimistically update order list in cache */
    setOrderList: (page: number, pageSize: number, updater: (old: OrderListResponse | undefined) => OrderListResponse | undefined) =>
      queryClient.setQueryData(orderKeys.list(page, pageSize), updater),

    /** Prefetch order details (e.g. on hover) — won't refetch if already cached & fresh */
    prefetchOrderDetail: (orderId: string) =>
      queryClient.prefetchQuery({
        queryKey: orderKeys.detail(orderId),
        queryFn: () => fetchOrderDetails(orderId),
        staleTime: 1 * 60 * 1000,
      }),
  };
}
