"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  MapPin,
  Package,
} from "lucide-react";
import { OrderWithItems, ShippingAddress } from "@/shared";
import { TextArea } from "../ui/textarea";

// ─── Constants ─────────────────────────────────────────────────────────────────

const REASONS = [
  { value: "defective", label: "Defective Product" },
  { value: "wrong_item", label: "Wrong Item Received" },
  { value: "not_as_described", label: "Not as Described" },
  { value: "size_issue", label: "Size Issue" },
  { value: "color_mismatch", label: "Color Mismatch" },
  { value: "damaged_in_shipping", label: "Damaged in Shipping" },
  { value: "changed_mind", label: "Changed Mind" },
  { value: "quality_issue", label: "Quality Issue" },
  { value: "other", label: "Other" },
];

// ─── Props ─────────────────────────────────────────────────────────────────────

interface ReturnFormProps {
  order: OrderWithItems;
  orderItemId: string;
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function ReturnForm({
  order,
  orderItemId,
  onClose,
  onSuccess,
}: ReturnFormProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonDetails, setReasonDetails] = useState("");
  const [resolution, setResolution] = useState<"refund" | "store_credit">("refund");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");

  const orderItem = order.items?.find((item) => item.id === orderItemId);
  if (!orderItem) return null;

  const maxQuantity = orderItem.quantity || 1;
  const elig = (orderItem as any).returnEligibility;

  // Pickup address — same as shipping address
  const addr = order.shippingAddress as ShippingAddress | string | undefined;
  const pickupAddress =
    typeof addr === "object" && addr !== null
      ? [addr.name, addr.address, addr.locality, addr.city, addr.pincode]
          .filter(Boolean)
          .join(", ")
      : typeof addr === "string"
        ? addr
        : "";

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!reason) { setError("Please select a reason"); return; }
    if (!reasonDetails.trim()) { setError("Please describe the issue"); return; }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          reason,
          reasonDetails,
          resolution,
          pickupAddress: pickupAddress || undefined,
          items: [{ orderItemId, quantity }],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to submit return request");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header with back button */}
      <button
        type="button"
        onClick={onClose}
        disabled={loading}
        className="flex items-center gap-3 group disabled:opacity-50"
        aria-label="Back to order"
      >
        <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-gray-800 transition-colors" />
        <h2 className="text-xl font-semibold text-gray-900">Return Request</h2>
      </button>

      {/* Order ID + Item + Pickup address — same card style as order detail */}
      <Card className="p-4 sm:p-5 hover:border-slate-300 transition-colors bg-white space-y-3">
        {/* Order ID */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
            Order
          </span>
          <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
            #{order.id}
          </span>
          {elig?.remainingDays && (
            <span className="ml-auto text-[10px] text-blue-600 font-medium">
              ⏱ {elig.remainingDays}d left to return
            </span>
          )}
        </div>

        {/* Item preview */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            {orderItem.product?.imageUrl ? (
              <img
                src={orderItem.product.imageUrl}
                alt={orderItem.product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {orderItem.product?.name || "Product"}
            </p>
            <p className="text-xs text-gray-500">
              ₹{parseFloat(orderItem.price).toFixed(2)} · Qty {orderItem.quantity}
            </p>
          </div>
        </div>

        {/* Pickup address */}
        {pickupAddress && (
          <div className="flex items-start gap-2.5 pt-2 border-t border-gray-100">
            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">
                Pickup Address
              </p>
              <p className="text-xs text-gray-700 leading-relaxed">{pickupAddress}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Form fields — same card style */}
      <Card className="p-4 sm:p-5 hover:border-slate-300 transition-colors bg-white space-y-3">
        {/* Quantity — only if ordered more than 1 */}
        {maxQuantity > 1 && (
          <Select value={quantity.toString()} onValueChange={(val) => setQuantity(parseInt(val))}>
            <SelectTrigger className="text-xs h-8">
              <SelectValue placeholder="Quantity" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: maxQuantity }, (_, i) => i + 1).map((qty) => (
                <SelectItem key={qty} value={qty.toString()} className="text-xs">
                  {qty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Reason */}
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger className="text-xs">
            <SelectValue placeholder="Reason for Return" />
          </SelectTrigger>
          <SelectContent>
            {REASONS.map((r) => (
              <SelectItem key={r.value} value={r.value} className="text-xs">
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Details */}
        <div className="space-y-1.5">
          <TextArea
            label="Describe the issue with your item..."
            value={reasonDetails}
            onChange={(e) => setReasonDetails(e.target.value)}
            rows={3}
            className="text-xs resize-none"
            inputMode="text"
          />
        </div>

        {/* Resolution */}
        <div className="space-y-1.5">
          <Label className="text-xs">How would you like your refund?</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setResolution("refund")}
              className={[
                "py-2.5 px-3 rounded-xl border-2 text-xs font-medium transition-all text-left",
                resolution === "refund"
                  ? "border-gray-900 bg-gray-50 text-gray-900"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
              ].join(" ")}
            >
              <div className="text-base mb-0.5">💳</div>
              <div>Refund to original</div>
              <div className="text-[10px] text-gray-400 font-normal">5–7 business days</div>
            </button>
            <button
              type="button"
              onClick={() => setResolution("store_credit")}
              className={[
                "py-2.5 px-3 rounded-xl border-2 text-xs font-medium transition-all text-left",
                resolution === "store_credit"
                  ? "border-green-600 bg-green-50 text-green-800"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
              ].join(" ")}
            >
              <div className="text-base mb-0.5">🎟️</div>
              <div>Store credit</div>
              <div className="text-[10px] text-gray-400 font-normal">Instant coupon</div>
            </button>
          </div>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-800">{error}</p>
        </div>
      )}

      {/* Submit */}
      <Button
        className="w-full"
        size="sm"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
            Submitting…
          </>
        ) : (
          "Submit Return Request"
        )}
      </Button>
    </div>
  );
}
