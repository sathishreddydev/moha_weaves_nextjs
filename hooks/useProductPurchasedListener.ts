import { useEffect } from "react";
import type React from "react";
import { useSocketStore } from "@/lib/stores/socketStore";
import type { OrderWithItems } from "@/shared/types";

interface ProductPurchasedPayload {
  productId: string;
  variantId: string | null;
}

interface ReturnStatusPayload {
  returnId: string;
  userId: string;
  status: string;
}

interface ExchangeStatusPayload {
  exchangeId: string;
  userId: string;
  status: string;
}

interface RefundStatusPayload {
  refundId: string;
  userId: string;
  orderId: string;
  status: string;
  amount: string;
  failureReason?: string;
  completedAt?: string;
  initiatedAt?: string;
}

/** Shared shape for return/exchange created events */
interface ReturnExchangeCreatedPayload {
  orderId: string;
  itemId: string | null;
  userId: string;
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
 * Exception: when status is `delivered`, calls `onDelivered` (full refetch)
 * so return/exchange eligibility and review buttons appear immediately.
 * Filtered to `orderId` so events for other orders are ignored.
 */
export function useOrderItemStatusListenerDetail(
  orderId: string | null | undefined,
  setOrder: React.Dispatch<React.SetStateAction<OrderWithItems | null>>,
  onDelivered?: () => void,
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

      // On delivery, do a full refetch so eligibility + review buttons appear
      if (status === "delivered" && onDelivered) {
        console.log("[OrderDetail] delivered — triggering full refetch");
        onDelivered();
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
  }, [socket, orderId, setOrder, onDelivered]);
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

// ---------------------------------------------------------------------------
// Return / Exchange status listeners
// ---------------------------------------------------------------------------

/**
 * Normalises the raw socket payload for return/exchange status events.
 * The server wraps it as { type, data: { returnId/exchangeId, userId, status } }
 * but we guard against a flat shape too.
 */
function extractReturnStatusPayload(
  raw: unknown,
): ReturnStatusPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as any;
  const d = r.data ?? r;
  const { returnId, userId, status } = d;
  if (!returnId || !status) return null;
  return { returnId, userId, status };
}

function extractExchangeStatusPayload(
  raw: unknown,
): ExchangeStatusPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as any;
  const d = r.data ?? r;
  const { exchangeId, userId, status } = d;
  if (!exchangeId || !status) return null;
  return { exchangeId, userId, status };
}

/**
 * Listens for `return_status_updated` and calls `onStatusChange` with the
 * new status whenever the server pushes an update for the given returnId.
 * Pass `returnId = null` to listen for any return update (e.g. on a list page).
 */
export function useReturnStatusListener(
  returnId: string | null | undefined,
  onStatusChange: (payload: ReturnStatusPayload) => void,
) {
  const { socket } = useSocketStore();

  useEffect(() => {
    if (!socket) return;

    const handler = (raw: unknown) => {
      const payload = extractReturnStatusPayload(raw);
      if (!payload) return;
      // If a specific returnId is provided, filter to that return only
      if (returnId && payload.returnId !== returnId) return;
      onStatusChange(payload);
    };

    socket.on("return_status_updated", handler);
    return () => {
      socket.off("return_status_updated", handler);
    };
  }, [socket, returnId, onStatusChange]);
}

/**
 * Listens for `exchange_status_updated` and calls `onStatusChange` with the
 * new status whenever the server pushes an update for the given exchangeId.
 * Pass `exchangeId = null` to listen for any exchange update (e.g. on a list page).
 */
export function useExchangeStatusListener(
  exchangeId: string | null | undefined,
  onStatusChange: (payload: ExchangeStatusPayload) => void,
) {
  const { socket } = useSocketStore();

  useEffect(() => {
    if (!socket) return;

    const handler = (raw: unknown) => {
      const payload = extractExchangeStatusPayload(raw);
      if (!payload) return;
      // If a specific exchangeId is provided, filter to that exchange only
      if (exchangeId && payload.exchangeId !== exchangeId) return;
      onStatusChange(payload);
    };

    socket.on("exchange_status_updated", handler);
    return () => {
      socket.off("exchange_status_updated", handler);
    };
  }, [socket, exchangeId, onStatusChange]);
}

// ---------------------------------------------------------------------------
// Return / Exchange CREATED listeners
// ---------------------------------------------------------------------------

/**
 * Normalises the raw socket payload for product_returned / product_exchanged events.
 * Server emits: { type, data: { orderId, itemId, userId, status } }
 */
function extractReturnExchangeCreatedPayload(
  raw: unknown,
): ReturnExchangeCreatedPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as any;
  const d = r.data ?? r;
  const { orderId, itemId, userId, status } = d;
  if (!orderId || !userId || !status) return null;
  return { orderId, itemId: itemId ?? null, userId, status };
}

/**
 * Listens for `product_returned` (return request created) and calls
 * `onCreated` with `{ orderId, itemId, userId, status }`.
 *
 * Pass `orderId = null` to receive events for all orders (e.g. on a list page).
 */
export function useReturnCreatedListener(
  orderId: string | null | undefined,
  onCreated: (payload: ReturnExchangeCreatedPayload) => void,
) {
  const { socket } = useSocketStore();

  useEffect(() => {
    if (!socket) return;

    const handler = (raw: unknown) => {
      const payload = extractReturnExchangeCreatedPayload(raw);
      if (!payload) return;
      if (orderId && payload.orderId !== orderId) return;
      onCreated(payload);
    };

    socket.on("product_returned", handler);
    return () => {
      socket.off("product_returned", handler);
    };
  }, [socket, orderId, onCreated]);
}

/**
 * Listens for `product_exchanged` (exchange request created) and calls
 * `onCreated` with `{ orderId, itemId, userId, status }`.
 *
 * Pass `orderId = null` to receive events for all orders (e.g. on a list page).
 */
export function useExchangeCreatedListener(
  orderId: string | null | undefined,
  onCreated: (payload: ReturnExchangeCreatedPayload) => void,
) {
  const { socket } = useSocketStore();

  useEffect(() => {
    if (!socket) return;

    const handler = (raw: unknown) => {
      const payload = extractReturnExchangeCreatedPayload(raw);
      if (!payload) return;
      if (orderId && payload.orderId !== orderId) return;
      onCreated(payload);
    };

    socket.on("product_exchanged", handler);
    return () => {
      socket.off("product_exchanged", handler);
    };
  }, [socket, orderId, onCreated]);
}

// ---------------------------------------------------------------------------
// Refund status listener
// ---------------------------------------------------------------------------

function extractRefundStatusPayload(raw: unknown): RefundStatusPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as any;
  const d = r.data ?? r;
  const { refundId, userId, orderId, status, amount } = d;
  if (!refundId || !status) return null;
  return {
    refundId,
    userId,
    orderId,
    status,
    amount,
    failureReason: d.failureReason,
    completedAt: d.completedAt,
    initiatedAt: d.initiatedAt,
  };
}

/**
 * Listens for `refund_status_updated` and calls `onStatusChange` whenever
 * the server pushes a refund update.
 *
 * Pass `orderId = null` to receive events for all orders (e.g. list page).
 * The callback receives the full refund payload so the UI can patch in-place.
 */
export function useRefundStatusListener(
  orderId: string | null | undefined,
  onStatusChange: (payload: RefundStatusPayload) => void,
) {
  const { socket } = useSocketStore();

  useEffect(() => {
    if (!socket) return;

    const handler = (raw: unknown) => {
      const payload = extractRefundStatusPayload(raw);
      if (!payload) return;
      if (orderId && payload.orderId !== orderId) return;
      onStatusChange(payload);
    };

    socket.on("refund_status_updated", handler);
    return () => {
      socket.off("refund_status_updated", handler);
    };
  }, [socket, orderId, onStatusChange]);
}
