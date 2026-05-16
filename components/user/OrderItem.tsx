import { Card } from "@/components/ui/card";
import {
  Star,
  Package,
  XCircle,
  RotateCcw,
  RefreshCw,
  CheckCircle,
  Clock,
  Truck,
  Ban,
} from "lucide-react";

// Maps every possible item status to a human-readable label + colour
const STATUS_CONFIG: Record<string, { label: string; className: string; Icon: any }> = {
  pending:                   { label: "Pending",            className: "text-yellow-600",  Icon: Clock },
  confirmed:                 { label: "Confirmed",          className: "text-blue-600",    Icon: CheckCircle },
  processing:                { label: "Processing",         className: "text-purple-600",  Icon: Package },
  shipped:                   { label: "Shipped",            className: "text-indigo-600",  Icon: Truck },
  delivered:                 { label: "Delivered",          className: "text-green-600",   Icon: CheckCircle },
  cancelled:                 { label: "Cancelled",          className: "text-red-500",     Icon: Ban },
  return_requested:          { label: "Return Requested",   className: "text-orange-500",  Icon: RotateCcw },
  return_approved:           { label: "Return Approved",    className: "text-orange-600",  Icon: RotateCcw },
  return_pickup_scheduled:   { label: "Pickup Scheduled",   className: "text-orange-600",  Icon: RotateCcw },
  return_picked_up:          { label: "Picked Up",          className: "text-orange-600",  Icon: RotateCcw },
  return_in_transit:         { label: "Return In Transit",  className: "text-orange-600",  Icon: Truck },
  return_received:           { label: "Return Received",    className: "text-orange-700",  Icon: RotateCcw },
  return_inspected:          { label: "Inspected",          className: "text-orange-700",  Icon: RotateCcw },
  return_completed:          { label: "Return Completed",   className: "text-green-600",   Icon: CheckCircle },
  return_cancelled:          { label: "Return Cancelled",   className: "text-red-500",     Icon: Ban },
  exchange_requested:        { label: "Exchange Requested", className: "text-blue-500",    Icon: RefreshCw },
  exchange_approved:         { label: "Exchange Approved",  className: "text-blue-600",    Icon: RefreshCw },
  exchange_processing:       { label: "Exchange Processing",className: "text-blue-600",    Icon: RefreshCw },
  exchange_pickup_scheduled: { label: "Pickup Scheduled",   className: "text-blue-600",    Icon: RefreshCw },
  exchange_picked_up:        { label: "Picked Up",          className: "text-blue-600",    Icon: RefreshCw },
  exchange_in_transit:       { label: "Exchange In Transit",className: "text-blue-600",    Icon: Truck },
  exchange_received:         { label: "Exchange Received",  className: "text-blue-700",    Icon: RefreshCw },
  exchange_inspected:        { label: "Inspected",          className: "text-blue-700",    Icon: RefreshCw },
  exchange_shipped:          { label: "Exchange Shipped",   className: "text-indigo-600",  Icon: Truck },
  exchange_delivered:        { label: "Exchange Delivered", className: "text-green-600",   Icon: CheckCircle },
  exchange_completed:        { label: "Exchange Completed", className: "text-green-600",   Icon: CheckCircle },
  exchange_cancelled:        { label: "Exchange Cancelled", className: "text-red-500",     Icon: Ban },
};

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
  const statusCfg = STATUS_CONFIG[currentStatus] ?? { label: currentStatus, className: "text-gray-500", Icon: Clock };
  const StatusIcon = statusCfg.Icon;

  // Find the correct variant by variantId (not just [0])
  const selectedVariant = item.variantId
    ? item.product?.variants?.find((v: any) => v.id === item.variantId)
    : item.product?.variants?.[0];

  const isDelivered = currentStatus === "delivered";
  const isCancelled = currentStatus === "cancelled";
  const isInReturn = currentStatus.startsWith("return_");
  const isInExchange = currentStatus.startsWith("exchange_");

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
        {/* Left: status badge */}
        <div className={`flex items-center gap-1 ${statusCfg.className}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">{statusCfg.label}</span>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Rate & Review — only when delivered and not already in return/exchange */}
          {isDelivered && !isInReturn && !isInExchange && (
            <button
              className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
              onClick={() => onReview(item.id, item.product.id)}
            >
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              Review
            </button>
          )}

          {/* Return */}
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

          {/* Exchange */}
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

          {/* Non-actionable fallback — only show when no actions at all */}
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
    </Card>
  );
}
