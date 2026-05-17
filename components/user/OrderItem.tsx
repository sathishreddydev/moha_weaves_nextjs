"use client";

import { Card } from "@/components/ui/card";
import { getExchangeTimelineStep, getRefundStatusLabel, getStatusConfig } from "@/lib/orderStatus";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Package,
  RefreshCw,
  RotateCcw,
  Star,
  XCircle,
} from "lucide-react";

export function OrderItem({
  item,
  onReview,
  onReturn,
}: {
  item: any;
  onReview: (orderItemId: string, productId: string) => void;
  onReturn: (itemId: string, type: "return" | "exchange") => void;
}) {
  // Use currentStatus (realtime-patched) if available, fall back to persisted status
  const currentStatus: string = item.currentStatus || item.status || "pending";
  const statusCfg = getStatusConfig(currentStatus);
  const StatusIcon = statusCfg.Icon;

  // Find the correct variant by variantId
  const selectedVariant = item.variantId
    ? item.product?.variants?.find((v: any) => v.id === item.variantId)
    : item.product?.variants?.[0];

  const isDelivered = currentStatus === "delivered";
  const isCancelled = currentStatus === "cancelled";
  const isInReturn = currentStatus.startsWith("return_");
  const isInExchange = currentStatus.startsWith("exchange_");

  // Return / refund info attached by the order detail API
  const returnInfo = item.returnInfo as {
    returnRequestId: string;
    status: string;
    resolution: string;
    reason: string;
    reasonDetails?: string;
    refundAmount?: string;
    createdAt: string;
    updatedAt: string;
    refund?: {
      id: string;
      status: string;
      amount: string;
      initiatedAt?: string;
      completedAt?: string;
      failureReason?: string;
    } | null;
  } | undefined;

  // Exchange info attached by the order detail API
  const exchangeInfo = item.exchangeInfo as {
    exchangeId: string;
    status: string;
    reason: string;
    reasonDetails?: string;
    exchangeOrderId?: string | null;
    exchangeVariantId?: string | null;
    createdAt: string;
    updatedAt: string;
  } | undefined;

  return (
    <Card className="p-4 hover:border-slate-300 transition-colors bg-white">
      <div className="flex gap-4">
        {/* Product Image */}
        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          {item.product?.imageUrl ? (
            <img
              src={item.product.imageUrl}
              alt={item.product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <h4 className="text-xs font-medium text-gray-900 truncate">
                {item.product?.name || "Product"}
              </h4>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-[10px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                  Qty: {item.quantity}
                </span>
                {selectedVariant?.size && (
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    Size: {selectedVariant.size}
                  </span>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="text-right flex-shrink-0">
              {item.productPrice &&
              item.discountedPrice &&
              item.productPrice !== item.discountedPrice ? (
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-xs text-gray-400 line-through">
                    ₹{parseFloat(item.productPrice).toFixed(2)}
                  </span>
                  <span className="text-xs font-bold text-green-600">
                    ₹{parseFloat(item.discountedPrice).toFixed(2)}
                  </span>
                </div>
              ) : (
                <p className="text-xs font-bold">
                  ₹{parseFloat(item.price).toFixed(2)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status + Actions row */}
      <div className="flex flex-wrap items-center gap-3 pt-3 mt-3 border-t border-slate-100">
        {/* Status badge */}
        <div className={`flex items-center gap-1 ${statusCfg.className}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">{statusCfg.label}</span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 ml-auto">
          {isDelivered && !isInReturn && !isInExchange && (
            <button
              className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
              onClick={() => onReview(item.id, item.product.id)}
            >
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              Review
            </button>
          )}

          {item.returnEligibility?.eligible && (
            <>
              {isDelivered && !isInReturn && !isInExchange && (
                <div className="w-1 h-1 bg-slate-300 rounded-full" />
              )}
              <button
                onClick={() => onReturn(item.id, "return")}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Return
              </button>
            </>
          )}

          {item.exchangeEligibility?.eligible && (
            <>
              {(isDelivered || item.returnEligibility?.eligible) && (
                <div className="w-1 h-1 bg-slate-300 rounded-full" />
              )}
              <button
                onClick={() => onReturn(item.id, "exchange")}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Exchange
              </button>
            </>
          )}

          {!isDelivered &&
            !item.returnEligibility?.eligible &&
            !item.exchangeEligibility?.eligible &&
            !isCancelled &&
            !isInReturn &&
            !isInExchange && (
              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                {item.returnEligibility?.reason || "Non-returnable"}
              </span>
            )}
        </div>
      </div>

      {/* ── Return / Refund info panel ─────────────────────────────────────── */}
      {returnInfo && (
        <ReturnRefundPanel returnInfo={returnInfo} />
      )}

      {/* ── Exchange info panel ───────────────────────────────────────────── */}
      {exchangeInfo && (
        <ExchangePanel exchangeInfo={exchangeInfo} variants={item.product?.variants ?? []} />
      )}
    </Card>
  );
}

/** Inline panel shown below the item when a return/refund is active. */
function ReturnRefundPanel({
  returnInfo,
}: {
  returnInfo: NonNullable<ReturnType<typeof extractReturnInfo>>;
}) {
  const { status, resolution, refundAmount, refund, createdAt } = returnInfo;

  const isRefundResolution = resolution === "refund";
  const isCreditResolution = resolution === "store_credit";

  // Timeline steps
  const step = getReturnStep(status);

  return (
    <div className="mt-3 pt-3 border-t border-orange-100 space-y-3">
      {/* Timeline */}
      <ReturnTimeline step={step} resolution={resolution} />

      {/* Refund detail — shown once return_completed */}
      {status === "return_completed" && isRefundResolution && refund && (
        <RefundDetail refund={refund} refundAmount={refundAmount} />
      )}

      {/* Store credit detail */}
      {status === "return_completed" && isCreditResolution && (
        <div className="flex items-center gap-2 text-[10px] text-green-700 bg-green-50 rounded-lg px-3 py-2">
          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            Store credit of ₹{parseFloat(refundAmount || "0").toFixed(2)} has been issued.
            Check your email for the coupon code.
          </span>
        </div>
      )}

      {/* Rejection reason */}
      {status === "return_rejected" && returnInfo.reasonDetails && (
        <div className="flex items-start gap-2 text-[10px] text-red-600 bg-red-50 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>Rejected: {returnInfo.reasonDetails}</span>
        </div>
      )}

      {/* Request date */}
      <p className="text-[10px] text-slate-400">
        Return requested on{" "}
        {new Date(createdAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </p>
    </div>
  );
}

function getReturnStep(
  status: string
): "requested" | "in_progress" | "done" | "rejected" {
  if (status === "return_requested") return "requested";
  if (
    ["return_approved", "return_pickup_scheduled", "return_picked_up",
     "return_in_transit", "return_received", "return_inspected"].includes(status)
  )
    return "in_progress";
  if (status === "return_completed") return "done";
  return "rejected";
}

function ReturnTimeline({
  step,
  resolution,
}: {
  step: "requested" | "in_progress" | "done" | "rejected";
  resolution: string;
}) {
  const doneLabel =
    resolution === "refund"
      ? "Refund Initiated"
      : resolution === "store_credit"
      ? "Credit Issued"
      : "Completed";

  const steps = [
    { key: "requested",   label: "Return Requested" },
    { key: "in_progress", label: "Return in Progress" },
    { key: "done",        label: doneLabel },
  ];

  const order = ["requested", "in_progress", "done"];
  const currentIdx = step === "rejected" ? -1 : order.indexOf(step);

  if (step === "rejected") {
    return (
      <div className="flex items-center gap-2 text-[10px] text-red-500">
        <AlertCircle className="w-3.5 h-3.5" />
        <span className="font-semibold">Return Rejected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {steps.map((s, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={s.key} className="flex items-center gap-1 flex-1 min-w-0">
            <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center
                  ${done || active
                    ? "bg-orange-500 text-white"
                    : "bg-slate-200 text-slate-400"
                  }`}
              >
                {done ? (
                  <CheckCircle className="w-3 h-3" />
                ) : active ? (
                  <Clock className="w-3 h-3" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                )}
              </div>
            </div>
            <span
              className={`text-[9px] leading-tight truncate
                ${active ? "text-orange-600 font-semibold" : done ? "text-slate-500" : "text-slate-300"}`}
            >
              {s.label}
            </span>
            {idx < steps.length - 1 && (
              <div
                className={`h-px flex-1 mx-1 ${
                  done ? "bg-orange-400" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function RefundDetail({
  refund,
  refundAmount,
}: {
  refund: {
    status: string;
    amount: string;
    initiatedAt?: string;
    completedAt?: string;
    failureReason?: string;
  };
  refundAmount?: string;
}) {
  const amount = parseFloat(refund.amount || refundAmount || "0").toFixed(2);
  const { label, className } = getRefundStatusLabel(refund.status);

  if (refund.status === "failed") {
    return (
      <div className="flex items-start gap-2 text-[10px] text-red-600 bg-red-50 rounded-lg px-3 py-2">
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Refund Failed</p>
          {refund.failureReason && (
            <p className="text-red-500 mt-0.5">{refund.failureReason}</p>
          )}
          <p className="text-red-400 mt-0.5">Please contact support.</p>
        </div>
      </div>
    );
  }

  if (refund.status === "completed") {
    return (
      <div className="flex items-center gap-2 text-[10px] text-green-700 bg-green-50 rounded-lg px-3 py-2">
        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
        <div>
          <span className="font-semibold">₹{amount} refunded</span>
          {refund.completedAt && (
            <span className="text-green-600 ml-1">
              on{" "}
              {new Date(refund.completedAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })}
            </span>
          )}
          <p className="text-green-600 mt-0.5">
            Refund has been credited to your original payment method.
          </p>
        </div>
      </div>
    );
  }

  // pending / initiated / processing
  return (
    <div className="flex items-start gap-2 text-[10px] text-orange-700 bg-orange-50 rounded-lg px-3 py-2">
      <Clock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
      <div>
        <span className={`font-semibold ${className}`}>
          ₹{amount} — {label}
        </span>
        {refund.initiatedAt && (
          <span className="text-orange-500 ml-1">
            on{" "}
            {new Date(refund.initiatedAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
          </span>
        )}
        <p className="text-orange-600 mt-0.5">
          Expected in your account within 5–7 business days.
        </p>
      </div>
    </div>
  );
}

/** Inline panel shown below the item when an exchange is active. */
function ExchangePanel({
  exchangeInfo,
  variants,
}: {
  exchangeInfo: {
    exchangeId: string;
    status: string;
    reason: string;
    reasonDetails?: string;
    exchangeOrderId?: string | null;
    exchangeVariantId?: string | null;
    createdAt: string;
  };
  variants: Array<{ id: string; size: string }>;
}) {
  const { status, exchangeOrderId, exchangeVariantId, createdAt } = exchangeInfo;
  const step = getExchangeTimelineStep(status);

  // Resolve the requested replacement size label
  const requestedSize = exchangeVariantId
    ? variants.find((v) => v.id === exchangeVariantId)?.size ?? null
    : null;

  const steps = [
    { key: "requested",   label: "Exchange Requested" },
    { key: "in_progress", label: "Exchange in Progress" },
    { key: "shipped",     label: "Replacement Shipped" },
    { key: "done",        label: "Exchange Completed" },
  ];

  const order = ["requested", "in_progress", "shipped", "done"];
  const currentIdx = step === "rejected" ? -1 : order.indexOf(step);

  return (
    <div className="mt-3 pt-3 border-t border-blue-100 space-y-3">
      {/* Requested replacement size badge */}
      {requestedSize && (
        <div className="flex items-center gap-2 text-[10px] text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
          <RefreshCw className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            Replacement size requested:{" "}
            <span className="font-semibold">{requestedSize}</span>
          </span>
        </div>
      )}

      {/* Timeline */}
      {step === "rejected" ? (
        <div className="flex items-center gap-2 text-[10px] text-red-500">
          <AlertCircle className="w-3.5 h-3.5" />
          <span className="font-semibold">Exchange Cancelled</span>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          {steps.map((s, idx) => {
            const done = idx < currentIdx;
            const active = idx === currentIdx;
            return (
              <div key={s.key} className="flex items-center gap-1 flex-1 min-w-0">
                <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center
                      ${done || active
                        ? "bg-blue-500 text-white"
                        : "bg-slate-200 text-slate-400"
                      }`}
                  >
                    {done ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : active ? (
                      <Clock className="w-3 h-3" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-current" />
                    )}
                  </div>
                </div>
                <span
                  className={`text-[9px] leading-tight truncate
                    ${active ? "text-blue-600 font-semibold" : done ? "text-slate-500" : "text-slate-300"}`}
                >
                  {s.label}
                </span>
                {idx < steps.length - 1 && (
                  <div
                    className={`h-px flex-1 mx-1 ${done ? "bg-blue-400" : "bg-slate-200"}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Replacement shipped — show new order ID if available */}
      {(step === "shipped" || step === "done") && exchangeOrderId && (
        <div className="flex items-center gap-2 text-[10px] text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
          <Package className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            Replacement order <span className="font-semibold">#{exchangeOrderId}</span> is on its way.
          </span>
        </div>
      )}

      {step === "done" && (
        <div className="flex items-center gap-2 text-[10px] text-green-700 bg-green-50 rounded-lg px-3 py-2">
          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="font-semibold">Exchange completed. Enjoy your new item!</span>
        </div>
      )}

      {/* Request date */}
      <p className="text-[10px] text-slate-400">
        Exchange requested on{" "}
        {new Date(createdAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </p>
    </div>
  );
}

// Helper to satisfy TypeScript for the panel prop type
function extractReturnInfo(item: any) {
  return item.returnInfo as {
    returnRequestId: string;
    status: string;
    resolution: string;
    reason: string;
    reasonDetails?: string;
    refundAmount?: string;
    createdAt: string;
    updatedAt: string;
    refund?: {
      id: string;
      status: string;
      amount: string;
      initiatedAt?: string;
      completedAt?: string;
      failureReason?: string;
    } | null;
  } | undefined;
}
