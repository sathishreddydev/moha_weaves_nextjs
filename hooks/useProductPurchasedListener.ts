import { useEffect } from "react";
import type React from "react";
import { useSocketStore } from "@/lib/stores/socketStore";
import type { OrderWithItems } from "@/shared/types";

interface ProductPurchasedPayload {
  productId: string;
  variantId: string | null;
}

interface OrderItemStatusPayload {
  orderItemId: string;
  orderId: string;
  userId: string;
  itemId: string;
  status: string;
}

/**
 * Joins the Socket.IO product room for `productId` and calls `onAffected`
 * whenever a `product_purchased` event arrives that matches the given
 * productId + variantId combination.
 *
 * Variant matching rules:
 * - If the event has no variantId  → always affected (product-level purchase)
 * - If the event has a variantId but `currentVariantId` is null/undefined
 *   → affected (we don't know which variant the user is looking at)
 * - If both have a variantId → only affected when they match
 */
export function useProductPurchasedListener(
  productId: string,
  currentVariantId: string | null | undefined,
  onAffected: () => void,
) {
  const { socket } = useSocketStore();

  useEffect(() => {
    if (!socket || !productId) return;

    socket.emit("join_product_room", productId);

    const handler = ({
      productId: pid,
      variantId: vid,
    }: ProductPurchasedPayload) => {
      if (pid !== productId) return;

      // A purchase of a different variant doesn't affect the current view
      if (vid && currentVariantId && vid !== currentVariantId) return;

      onAffected();
    };

    socket.on("product_purchased", handler);

    return () => {
      socket.emit("leave_product_room", productId);
      socket.off("product_purchased", handler);
    };
  }, [socket, productId, currentVariantId, onAffected]);
}

/**
 * Variant for the cart page — joins rooms for *multiple* products and
 * calls `onAffected` when any of them is purchased.
 */
export function useCartProductPurchasedListener(
  items: Array<{ productId: string; variantId: string | null | undefined }>,
  onAffected: () => void,
) {
  const { socket } = useSocketStore();

  useEffect(() => {
    if (!socket || items.length === 0) return;

    items.forEach((item) => socket.emit("join_product_room", item.productId));

    const handler = ({ productId, variantId }: ProductPurchasedPayload) => {
      const affected = items.some(
        (item) =>
          item.productId === productId &&
          (variantId === null || item.variantId === variantId),
      );
      if (affected) onAffected();
    };

    socket.on("product_purchased", handler);

    return () => {
      items.forEach((item) =>
        socket.emit("leave_product_room", item.productId),
      );
      socket.off("product_purchased", handler);
    };
  }, [socket, items, onAffected]);
}

/**
 * Normalises the raw socket payload — the server subscriber wraps it as
 * { type, data: { orderId, itemId, status } } but guard against flat shape too.
 */
function extractOrderItemPayload(
  raw: unknown,
): { orderId: string; itemId: string; status: string } | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as any;
  const d = r.data ?? r; // unwrap envelope if present
  const { orderId, itemId, status } = d;
  if (!orderId || !itemId || !status) return null;
  return { orderId, itemId, status };
}

/**
 * Listens for `order_item_status_updated` on the ORDER DETAIL page.
 * Directly patches the matching item's status in state — no refetch needed.
 * Filtered to `orderId` so events for other orders are ignored.
 */
export function useOrderItemStatusListenerDetail(
  orderId: string | null | undefined,
  setOrder: React.Dispatch<React.SetStateAction<OrderWithItems | null>>,
) {
  const { socket } = useSocketStore();

  useEffect(() => {
    console.log("[OrderDetail] socket:", !!socket, "orderId:", orderId);
    if (!socket) return;

    const handler = (raw: unknown) => {
      console.log("[OrderDetail] raw event:", JSON.stringify(raw));
      const payload = extractOrderItemPayload(raw);
      console.log("[OrderDetail] parsed payload:", payload);
      if (!payload) return;
      const { orderId: oid, itemId, status } = payload;

      if (orderId && oid !== orderId) {
        console.log("[OrderDetail] skipping — orderId mismatch", oid, "!=", orderId);
        return;
      }

      setOrder((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          items: prev.items.map((item) =>
            item.id === itemId
              ? { ...item, currentStatus: status, status }
              : item,
          ),
        };
        console.log("[OrderDetail] patched item", itemId, "→", status);
        return updated;
      });
    };

    console.log("[OrderDetail] registering handler for order_item_status_updated");
    socket.on("order_item_status_updated", handler);
    return () => {
      console.log("[OrderDetail] removing handler");
      socket.off("order_item_status_updated", handler);
    };
  }, [socket, orderId, setOrder]);
}

/**
 * Listens for `order_item_status_updated` on the ORDER LIST page.
 * Directly patches the matching item's status across all loaded orders.
 */
export function useOrderItemStatusListenerList(
  setOrders: React.Dispatch<React.SetStateAction<OrderWithItems[]>>,
) {
  const { socket } = useSocketStore();

  useEffect(() => {
    console.log("[OrderList] socket:", !!socket);
    if (!socket) return;

    const handler = (raw: unknown) => {
      console.log("[OrderList] raw event:", JSON.stringify(raw));
      const payload = extractOrderItemPayload(raw);
      console.log("[OrderList] parsed payload:", payload);
      if (!payload) return;

      const { orderId, itemId, status } = payload;

      setOrders((prev) => {
        const match = prev.find((o) => o.id === orderId);
        console.log("[OrderList] order match:", !!match, "orderId:", orderId);
        return prev.map((order) => {
          if (order.id !== orderId) return order;
          return {
            ...order,
            items: order.items.map((item) =>
              item.id === itemId
                ? { ...item, currentStatus: status, status }
                : item,
            ),
          };
        });
      });
    };

    console.log("[OrderList] registering handler for order_item_status_updated");
    socket.on("order_item_status_updated", handler);
    return () => {
      console.log("[OrderList] removing handler");
      socket.off("order_item_status_updated", handler);
    };
  }, [socket, setOrders]);
}
