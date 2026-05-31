"use client";

import { useSocketStore } from "@/lib/stores/socketStore";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { cartKeys } from "./useCartQueries";

/**
 * Bridges Socket.io events to React Query cache invalidation.
 * Debounces rapid-fire events (e.g. flash sale triggers many purchases).
 *
 * Events handled:
 * - product_purchased → invalidate cart (stock may have changed)
 * - product_event → invalidate cart (product updated/deleted by admin)
 * - offer_event → invalidate cart (pricing may have changed)
 * - coupon_event → invalidate cart (discounts may have changed)
 */
export function useCartSocketSync() {
  const { socket } = useSocketStore();
  const queryClient = useQueryClient();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedInvalidate = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: cartKeys.list() });
    }, 2000); // 2s debounce for burst events
  }, [queryClient]);

  useEffect(() => {
    if (!socket) return;

    const handleProductPurchased = () => debouncedInvalidate();
    const handleProductEvent = () => debouncedInvalidate();
    const handleOfferEvent = () => debouncedInvalidate();
    const handleCouponEvent = () => debouncedInvalidate();

    socket.on("product_purchased", handleProductPurchased);
    socket.on("product_event", handleProductEvent);
    socket.on("offer_event", handleOfferEvent);
    socket.on("coupon_event", handleCouponEvent);

    return () => {
      socket.off("product_purchased", handleProductPurchased);
      socket.off("product_event", handleProductEvent);
      socket.off("offer_event", handleOfferEvent);
      socket.off("coupon_event", handleCouponEvent);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [socket, debouncedInvalidate]);
}
