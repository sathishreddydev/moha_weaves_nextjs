"use client";

import { CouponBadge } from "@/components/orders/CouponBadge";
import ExchangeForm from "@/components/returns/ExchangeForm";
import MultiReturnView from "@/components/returns/MultiReturnView";
import ReturnForm from "@/components/returns/ReturnForm";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import LiveChat from "@/components/user/LiveChat";
import { OrderItem } from "@/components/user/OrderItem";

import ShippingAddress from "@/components/user/shippingAddress";
import {
  useOrderItemStatusListenerDetail,
  useReturnCreatedListener,
  useExchangeCreatedListener,
  useReturnStatusListener,
  useExchangeStatusListener,
  useRefundStatusListener,
} from "@/hooks/useProductPurchasedListener";
import { useOrderDetails, useInvalidateOrders } from "@/hooks/useOrderQueries";
import {
  OrderWithItems,
  ShippingAddress as ShippingAddressType,
} from "@/shared";
import {
  ArrowLeft,
  CreditCard,
  Download,
  MapPin,
  Package,
  ReceiptText,
  RotateCcw,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useCallback, useState } from "react";
import { toast } from "sonner";

// ─── View state ───────────────────────────────────────────────────────────────
// "detail"      → normal order detail view
// "return"      → multi-item return flow (order-level button)
// "return-item" → single-item return form (item-level Return button)
// "exchange"    → single-item exchange form (item-level Exchange button)
type OrderView = "detail" | "return" | "return-item" | "exchange";


export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const orderId = (params as { id: string }).id ?? null;

  // ─── React Query ────────────────────────────────────────────────────────────
  const {
    data: order,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useOrderDetails(orderId);

  const error = queryError ? (queryError as Error).message : null;
  const { invalidateDetail, setOrderDetail } = useInvalidateOrders();

  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [orderView, setOrderView] = useState<OrderView>("detail");
  const [preSelectedReturnItemId, setPreSelectedReturnItemId] = useState<string | null>(null);
  const [exchangeItemId, setExchangeItemId] = useState<string | null>(null);
  const [reviewedItemIds, setReviewedItemIds] = useState<Set<string>>(new Set());
  const [helpChatOpen, setHelpChatOpen] = useState(false);

  // Bridge: useOrderItemStatusListenerDetail expects a React setState setter.
  // We wrap queryClient.setQueryData to match that signature.
  const cacheSetOrder: React.Dispatch<React.SetStateAction<OrderWithItems | null>> = useCallback(
    (action) => {
      if (!orderId) return;
      setOrderDetail(orderId, (old) => {
        const prev = old ?? null;
        const next = typeof action === "function" ? action(prev) : action;
        return next ?? undefined;
      });
    },
    [orderId, setOrderDetail],
  );

  const handleRefetch = useCallback(() => {
    if (orderId) invalidateDetail(orderId);
  }, [orderId, invalidateDetail]);

  // Patch item status in state; refetch on delivery so eligibility/review buttons appear
  useOrderItemStatusListenerDetail(orderId, cacheSetOrder, handleRefetch);

  // Return created → refetch so returnInfo panel appears immediately
  useReturnCreatedListener(orderId, handleRefetch);

  // Exchange created → refetch so exchangeInfo panel appears immediately
  useExchangeCreatedListener(orderId, handleRefetch);

  // Return status updated → patch returnInfo.status in state directly (no refetch)
  const handleReturnStatusChange = useCallback(({ status }: { status: string }) => {
    cacheSetOrder((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((item: any) =>
          item.returnInfo
            ? { ...item, returnInfo: { ...item.returnInfo, status } }
            : item,
        ),
      };
    });
  }, [cacheSetOrder]);

  useReturnStatusListener(null, handleReturnStatusChange);

  // Exchange status updated → patch exchangeInfo.status in state directly (no refetch)
  const handleExchangeStatusChange = useCallback(({ status }: { status: string }) => {
    cacheSetOrder((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((item: any) =>
          item.exchangeInfo
            ? { ...item, exchangeInfo: { ...item.exchangeInfo, status } }
            : item,
        ),
      };
    });
  }, [cacheSetOrder]);

  useExchangeStatusListener(null, handleExchangeStatusChange);

  // Refund status updated → patch returnInfo.refund in state directly (no refetch)
  const handleRefundStatusChange = useCallback(
    ({
      orderId: oid,
      status,
      amount,
      failureReason,
      completedAt,
      initiatedAt,
    }: {
      orderId: string;
      status: string;
      amount: string;
      failureReason?: string;
      completedAt?: string;
      initiatedAt?: string;
    }) => {
      if (orderId && oid !== orderId) return;
      cacheSetOrder((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((item: any) => {
            if (!item.returnInfo?.refund) return item;
            return {
              ...item,
              returnInfo: {
                ...item.returnInfo,
                refund: {
                  ...item.returnInfo.refund,
                  status,
                  amount: amount ?? item.returnInfo.refund.amount,
                  ...(failureReason !== undefined && { failureReason }),
                  ...(completedAt !== undefined && { completedAt }),
                  ...(initiatedAt !== undefined && { initiatedAt }),
                },
              },
            };
          }),
        };
      });
    },
    [orderId, cacheSetOrder],
  );

  useRefundStatusListener(orderId, handleRefundStatusChange);

  const downloadInvoice = async () => {
    if (invoiceLoading) return;
    setInvoiceLoading(true);
    setInvoiceError(null);
    try {
      const response = await fetch(`/api/orders/${orderId}/invoice`);

      if (!response.ok) {
        throw new Error("Failed to generate invoice");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Invoice downloaded");
    } catch (err) {
      setInvoiceError("Failed to download invoice. Please try again.");
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleReturnClick = useCallback(
    (itemId: string, type: "return" | "exchange") => {
      if (type === "exchange") {
        setExchangeItemId(itemId);
        setOrderView("exchange");
      } else if (itemId) {
        setPreSelectedReturnItemId(itemId);
        setOrderView("return-item");
      } else {
        setOrderView("return");
      }
    },
    [],
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="bg-white rounded-lg shadow p-6 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-red-600 mb-4">{error || "Order not found"}</p>
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // ── Return view ────────────────────────────────────────────────────────────
  if (orderView === "return") {
    return (
      <MultiReturnView
        order={order}
        preSelectedItemId={preSelectedReturnItemId}
        onBack={() => {
          setOrderView("detail");
          setPreSelectedReturnItemId(null);
        }}
        onSuccess={() => {
          setOrderView("detail");
          setPreSelectedReturnItemId(null);
          handleRefetch();
          toast.success("Return request submitted");
        }}
      />
    );
  }

  // ── Return-item view ───────────────────────────────────────────────────────
  if (orderView === "return-item" && preSelectedReturnItemId) {
    return (
      <ReturnForm
        order={order}
        orderItemId={preSelectedReturnItemId}
        onClose={() => {
          setOrderView("detail");
          setPreSelectedReturnItemId(null);
        }}
        onSuccess={() => {
          setOrderView("detail");
          setPreSelectedReturnItemId(null);
          handleRefetch();
          toast.success("Return request submitted");
        }}
      />
    );
  }

  // ── Exchange view ──────────────────────────────────────────────────────────
  if (orderView === "exchange" && exchangeItemId) {
    return (
      <ExchangeForm
        order={order}
        orderItemId={exchangeItemId}
        onClose={() => {
          setOrderView("detail");
          setExchangeItemId(null);
        }}
        onSuccess={() => {
          setOrderView("detail");
          setExchangeItemId(null);
          handleRefetch();
          toast.success("Exchange request submitted");
        }}
        showBackButton
      />
    );
  }

  // ── Detail view ────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Invoice error banner */}
      {invoiceError && (
        <div className="px-4 sm:px-0 pt-4">
          <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2 rounded-lg">
            <span>{invoiceError}</span>
            <button
              type="button"
              onClick={() => setInvoiceError(null)}
              className="text-red-500 hover:text-red-700 font-bold text-sm leading-none"
              aria-label="Dismiss invoice error"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <OrderDetailsContent
        order={order}
        onDownloadInvoice={downloadInvoice}
        invoiceLoading={invoiceLoading}
        onHelpClick={() => setHelpChatOpen(true)}
        onReturnClick={handleReturnClick}
        reviewedItemIds={reviewedItemIds}
        onReviewSubmitted={(orderItemId, reviewInfo) => {
          setReviewedItemIds((prev) => {
            const next = new Set(prev);
            next.add(orderItemId);
            return next;
          });
        }}
      />

      {/* Contextual Help Chat */}
      {orderId && (
        <LiveChat
          isOpen={helpChatOpen}
          onOpenChange={setHelpChatOpen}
          onReturnClick={(itemId: string, type: "return" | "exchange") => {
            handleReturnClick(itemId, type);
            setHelpChatOpen(false);
          }}
          orderContext={{
            orderId,
            order,
            productName:
              order.items.length === 1
                ? order.items[0].product.name
                : undefined,
          }}
        />
      )}
    </div>
  );
}

function OrderDetailsContent({
  order,
  onDownloadInvoice,
  invoiceLoading,
  onHelpClick,
  onReturnClick,
  reviewedItemIds,
  onReviewSubmitted,
}: {
  order: OrderWithItems;
  onDownloadInvoice: () => void;
  invoiceLoading: boolean;
  onHelpClick: () => void;
  onReturnClick: (itemId: string, type: "return" | "exchange") => void;
  reviewedItemIds: Set<string>;
  onReviewSubmitted: (orderItemId: string, reviewInfo: NonNullable<import("@/components/user/OrderItem").OrderItemType["reviewInfo"]>) => void;
}) {
  const router = useRouter();

  // Only show "Return Items" if at least one item is eligible AND doesn't
  // already have an active return or exchange in progress.
  const hasReturnEligible = order.items.some(
    (item) =>
      (item as any).returnEligibility?.eligible &&
      !(item as any).returnInfo &&
      !(item as any).exchangeInfo,
  );

  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-5 space-y-4 hover:border-slate-300 transition-colors bg-white">
        {/* Header */}
        <div className="flex justify-between items-center gap-2">
          {/* Back button — proper <button> for accessibility */}
          <button
            type="button"
            aria-label="Back to orders"
            onClick={() => router.push("/my/orders")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Order Summary
            </h2>
          </button>

          <div className="text-xs">
            <span className="mr-1">Need</span>
            <button
              type="button"
              onClick={onHelpClick}
              className="text-blue-800 underline hover:text-blue-600"
            >
              Help?
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Coupon Information */}
          <CouponBadge
            couponCode={order.couponCode}
            couponType={order.couponType}
            couponValue={order.couponValue}
            discountAmount={order.discountAmount}
            className="justify-center"
          />

          {/* Order Details */}
          <div className="flex justify-between gap-4">
            <div className="flex items-center justify-between gap-4 sm:gap-8">
              {/* Order ID */}
              <div>
                <p className="text-xs text-gray-500">Order ID</p>
                <p className="font-medium text-xs"># {order.id}</p>
              </div>

              {/* Total Amount */}
              <div className="hidden sm:block">
                <p className="text-xs text-gray-500">Total Amount</p>
                <p className="font-medium text-xs">
                  ₹{parseFloat(order.finalAmount).toFixed(2)}
                </p>
              </div>

              {/* Shipping Address */}
              <div className="hidden sm:block">
                <div className="max-w-xs">
                  <p className="text-xs text-gray-500">Shipping Address</p>
                  <ShippingAddress address={order.shippingAddress || ""} />
                </div>
              </div>
            </div>

            {/* Invoice button */}
            <div>
              <Button
                onClick={onDownloadInvoice}
                disabled={invoiceLoading}
                variant="outline"
                size="sm"
                className="rounded-3xl w-full sm:w-auto flex items-center justify-center gap-2"
              >
                {invoiceLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {invoiceLoading ? "Generating…" : "Invoice"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-slate-400" />
            Items in your order ({order.items.length})
          </h3>
        </div>
        {order.items.map((item) => (
          <div key={item.id}>
            <OrderItem
              item={{
                ...item,
                // Preserve server-side hasReviewed (true when review already exists in DB).
                // Also check local reviewedItemIds for reviews submitted this session
                // without a page reload — keyed by orderItemId.
                hasReviewed:
                  (item as any).hasReviewed ||
                  reviewedItemIds.has(item.id),
              }}
              orderId={order.id}
              onReviewSubmitted={onReviewSubmitted}
              onReturn={onReturnClick}
            />
          </div>
        ))}

        {/* Order-level Return Items button — only when eligible items exist */}
        {hasReturnEligible && (
          <button
            type="button"
            onClick={() => onReturnClick("", "return")}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Return Items from this order
          </button>
        )}
      </div>

      {/* Price Breakdown */}
      <Card className="p-4 sm:p-5 hover:border-slate-300 transition-colors bg-white">
        <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <ReceiptText className="w-5 h-5 text-slate-400" />
          Price Details
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">
              Subtotal ({order.items.length} items)
            </span>
            <span className="font-medium">
              ₹
              {order.items
                .reduce(
                  (sum, item) => sum + parseFloat(item.price) * item.quantity,
                  0,
                )
                .toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Discount</span>
            <span className="font-medium text-green-600">
              -₹{parseFloat(order?.discountAmount || "0").toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Total Savings</span>
            <span className="font-medium text-green-600">
              ₹
              {(() => {
                const itemSavings = order.items.reduce((total, item) => {
                  if (item.productPrice && item.discountedPrice) {
                    return (
                      total +
                      (parseFloat(item.productPrice) -
                        parseFloat(item.discountedPrice)) *
                        item.quantity
                    );
                  }
                  return total;
                }, 0);
                return itemSavings.toFixed(2);
              })()}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Shipping</span>
            <span className="font-medium">
              {(() => {
                const subtotalPaid = order.items.reduce(
                  (sum, item) => sum + parseFloat(item.price) * item.quantity,
                  0,
                );
                const couponDiscount = parseFloat(order.discountAmount || "0");
                const shipping =
                  parseFloat(order.finalAmount) - subtotalPaid + couponDiscount;
                return shipping > 0.01 ? `₹${shipping.toFixed(2)}` : "FREE";
              })()}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Tax</span>
            <span className="font-medium">₹0.00</span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between text-sm font-bold">
              <span>Total Amount</span>
              <span>₹{parseFloat(order.finalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Shipping Details - Mobile Only */}
      <div className="block sm:hidden">
        <Card className="p-4 sm:p-5 hover:border-slate-300 transition-colors bg-white">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            Shipping Address
          </h3>
          <div className="text-xs whitespace-pre-line">
            {typeof order.shippingAddress === "object" &&
            order.shippingAddress !== null
              ? `${(order.shippingAddress as ShippingAddressType).name || ""}\n${(order.shippingAddress as ShippingAddressType).address || ""}\n${(order.shippingAddress as ShippingAddressType).locality || ""}, ${(order.shippingAddress as ShippingAddressType).city || ""}\n${(order.shippingAddress as ShippingAddressType).pincode || ""}\n${(order.shippingAddress as ShippingAddressType).phone || ""}`
                  .replace(/\n+/g, "\n")
                  .trim()
              : order.shippingAddress || ""}
          </div>
        </Card>
      </div>

      {/* Payment Details */}
      {order.paymentDetails?.available && (
        <Card className="p-4 sm:p-5 hover:border-slate-300 transition-colors bg-white">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-400" />
            Payment Details
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-[10px] font-bold text-gray-600 uppercase leading-none">
                    {order.paymentDetails.method?.slice(0, 2) || "PA"}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-900">
                    {order.paymentDetails.display}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    ID: {order.paymentDetails.razorpayPaymentId}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-green-600">Paid</p>
                <p className="text-[10px] text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
