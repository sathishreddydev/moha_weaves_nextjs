import {
  AlertCircle,
  Ban,
  CheckCircle,
  Clock,
  Package,
  RefreshCw,
  RotateCcw,
  Truck,
} from "lucide-react";

export const ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; className: string; Icon: any }
> = {
  // ── Core order statuses ────────────────────────────────────────────────────
  pending:     { label: "Pending",    className: "text-yellow-600", Icon: Clock },
  confirmed:   { label: "Confirmed",  className: "text-blue-600",   Icon: CheckCircle },
  processing:  { label: "Processing", className: "text-purple-600", Icon: Package },
  shipped:     { label: "Shipped",    className: "text-indigo-600", Icon: Truck },
  delivered:   { label: "Delivered",  className: "text-green-600",  Icon: CheckCircle },
  cancelled:   { label: "Cancelled",  className: "text-red-500",    Icon: Ban },

  // ── Return statuses (customer-facing labels) ───────────────────────────────
  // "Return Requested"  — customer submitted, waiting for admin approval
  return_requested:          { label: "Return Requested",  className: "text-orange-500", Icon: RotateCcw },
  // "Return in Progress" — everything from approved through inspected
  return_approved:           { label: "Return in Progress", className: "text-orange-500", Icon: RotateCcw },
  return_pickup_scheduled:   { label: "Return in Progress", className: "text-orange-500", Icon: RotateCcw },
  return_picked_up:          { label: "Return in Progress", className: "text-orange-500", Icon: RotateCcw },
  return_in_transit:         { label: "Return in Progress", className: "text-orange-500", Icon: RotateCcw },
  return_received:           { label: "Return in Progress", className: "text-orange-500", Icon: RotateCcw },
  return_inspected:          { label: "Return in Progress", className: "text-orange-500", Icon: RotateCcw },
  // "Refund Initiated"  — return done, money on its way
  return_completed:          { label: "Refund Initiated",   className: "text-green-600",  Icon: CheckCircle },
  return_rejected:           { label: "Return Rejected",    className: "text-red-500",    Icon: AlertCircle },
  return_cancelled:          { label: "Return Cancelled",   className: "text-red-500",    Icon: Ban },

  // ── Exchange statuses (customer-facing labels) ─────────────────────────────
  exchange_requested:        { label: "Exchange Requested",  className: "text-blue-500",  Icon: RefreshCw },
  exchange_approved:         { label: "Exchange in Progress", className: "text-blue-500", Icon: RefreshCw },
  exchange_processing:       { label: "Exchange in Progress", className: "text-blue-500", Icon: RefreshCw },
  exchange_pickup_scheduled: { label: "Exchange in Progress", className: "text-blue-500", Icon: RefreshCw },
  exchange_picked_up:        { label: "Exchange in Progress", className: "text-blue-500", Icon: RefreshCw },
  exchange_in_transit:       { label: "Exchange in Progress", className: "text-blue-500", Icon: RefreshCw },
  exchange_received:         { label: "Exchange in Progress", className: "text-blue-500", Icon: RefreshCw },
  exchange_inspected:        { label: "Exchange in Progress", className: "text-blue-500", Icon: RefreshCw },
  exchange_shipped:          { label: "Exchange Shipped",     className: "text-indigo-600", Icon: Truck },
  exchange_delivered:        { label: "Exchange Delivered",   className: "text-green-600",  Icon: CheckCircle },
  exchange_completed:        { label: "Exchange Completed",   className: "text-green-600",  Icon: CheckCircle },
  exchange_cancelled:        { label: "Exchange Cancelled",   className: "text-red-500",    Icon: Ban },
};

/** Resolve a status config, falling back to a generic "unknown" entry. */
export function getStatusConfig(status: string | undefined | null) {
  return (
    ORDER_STATUS_CONFIG[status ?? "pending"] ?? {
      label: status ?? "Unknown",
      className: "text-gray-500",
      Icon: Clock,
    }
  );
}

/**
 * Maps the internal return status to a simple 3-step customer timeline label.
 * Used in the return/refund timeline card on the order detail page.
 */
export function getReturnTimelineStep(status: string): "requested" | "in_progress" | "done" | "rejected" {
  if (status === "return_requested") return "requested";
  if (["return_approved", "return_pickup_scheduled", "return_picked_up",
       "return_in_transit", "return_received", "return_inspected"].includes(status)) return "in_progress";
  if (status === "return_completed") return "done";
  if (status === "return_rejected" || status === "return_cancelled") return "rejected";
  return "requested";
}

/**
 * Maps internal refund status to a customer-friendly label.
 */
export function getRefundStatusLabel(status: string): { label: string; className: string } {
  switch (status) {
    case "pending":
    case "initiated":
    case "processing":
      return { label: "Refund Initiated", className: "text-orange-500" };
    case "completed":
      return { label: "Refund Completed", className: "text-green-600" };
    case "failed":
      return { label: "Refund Failed", className: "text-red-500" };
    case "cancelled":
      return { label: "Refund Cancelled", className: "text-red-500" };
    default:
      return { label: "Refund Processing", className: "text-orange-500" };
  }
}

/**
 * Maps the internal exchange status to a 4-step customer timeline step.
 */
export function getExchangeTimelineStep(
  status: string
): "requested" | "in_progress" | "shipped" | "done" | "rejected" {
  if (status === "exchange_requested") return "requested";
  if (
    ["exchange_approved", "exchange_processing", "exchange_pickup_scheduled",
     "exchange_picked_up", "exchange_in_transit", "exchange_received",
     "exchange_inspected"].includes(status)
  ) return "in_progress";
  if (status === "exchange_shipped" || status === "exchange_delivered") return "shipped";
  if (status === "exchange_completed") return "done";
  return "rejected"; // exchange_cancelled
}
