"use client";

import { useEffect, useRef } from "react";
import socketService from "@/realtime/socket";
import { useCartStore } from "@/lib/stores";
import { toast } from "sonner";

interface StockUpdatedPayload {
  productId: string;
  variantId: string | null;
  newStock: number;
}

/**
 * Connects to the socket server and listens for `stock_updated` events.
 * When stock changes for a product that is in the cart:
 *  - If the item quantity exceeds new stock → clamp and show a warning toast
 *  - If new stock is 0 → remove the item and show an error toast
 *
 * Also joins per-product socket rooms so the server can target broadcasts.
 */
export function useCartStockSync() {
  const items = useCartStore((s) => s.items);
  const applyStockUpdate = useCartStore((s) => s.applyStockUpdate);

  // Keep a stable ref to the latest items so the socket handler always sees
  // the current cart without needing to re-subscribe on every render.
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Track which product rooms we've already joined to avoid redundant emits
  const joinedRoomsRef = useRef<Set<string>>(new Set());

  // Join/leave socket rooms as cart items change
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket?.connected) return;

    const currentProductIds = new Set(items.map((i) => i.productId));

    // Join rooms for newly added products
    const toJoin = items
      .map((i) => i.productId)
      .filter((id) => !joinedRoomsRef.current.has(id));

    if (toJoin.length > 0) {
      socket.emit("join_product_rooms", toJoin);
      toJoin.forEach((id) => joinedRoomsRef.current.add(id));
    }

    // Leave rooms for products no longer in the cart
    const toLeave = Array.from(joinedRoomsRef.current).filter(
      (id) => !currentProductIds.has(id)
    );

    if (toLeave.length > 0) {
      socket.emit("leave_product_rooms", toLeave);
      toLeave.forEach((id) => joinedRoomsRef.current.delete(id));
    }
  }, [items]);

  // Connect once and register the stock_updated listener
  useEffect(() => {
    const socket = socketService.connect();

    const handleStockUpdated = (payload: StockUpdatedPayload) => {
      const { productId, variantId, newStock } = payload;

      // Check if any cart item is affected before calling applyStockUpdate
      const affected = itemsRef.current.find(
        (item) =>
          item.productId === productId &&
          (variantId ? item.variantId === variantId : !item.variantId)
      );

      if (!affected) return;

      const { clamped, removed } = applyStockUpdate({ productId, variantId, newStock });

      if (removed.includes(affected.id)) {
        toast.error(`"${affected.product.name}" is now out of stock and was removed from your cart.`);
      } else if (clamped.includes(affected.id)) {
        toast.warning(
          `Only ${newStock} of "${affected.product.name}" left in stock. Your quantity has been updated.`
        );
      }
    };

    socket.on("stock_updated", handleStockUpdated);

    // Join rooms for products already in cart when socket first connects
    socket.on("connect", () => {
      const productIds = itemsRef.current.map((i) => i.productId);
      if (productIds.length > 0) {
        socket.emit("join_product_rooms", productIds);
        productIds.forEach((id) => joinedRoomsRef.current.add(id));
      }
    });

    return () => {
      socket.off("stock_updated", handleStockUpdated);
    };
  }, [applyStockUpdate]);
}
