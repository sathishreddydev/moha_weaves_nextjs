"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, MapPin, RefreshCw, X } from "lucide-react";
import { OrderWithItems, ShippingAddress } from "@/shared";
import { Card } from "@/components/ui/card";

// ─── Constants ─────────────────────────────────────────────────────────────────

const REASONS = [
  { value: "size_issue", label: "Size Issue" },
  { value: "defective", label: "Defective Product" },
  { value: "wrong_item", label: "Wrong Item Received" },
  { value: "not_as_described", label: "Not as Described" },
  { value: "color_mismatch", label: "Color Mismatch" },
  { value: "damaged_in_shipping", label: "Damaged in Shipping" },
  { value: "quality_issue", label: "Quality Issue" },
  { value: "other", label: "Other" },
];

// ─── Props ─────────────────────────────────────────────────────────────────────

interface ExchangeFormProps {
  order: OrderWithItems;
  orderItemId: string;
  onClose: () => void;
  onSuccess: () => void;
  showBackButton?: boolean;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function ExchangeForm({
  order,
  orderItemId,
  onClose,
  onSuccess,
  showBackButton = false,
}: ExchangeFormProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonDetails, setReasonDetails] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const orderItem = order.items?.find((item) => item.id === orderItemId);
  if (!orderItem) return null;

  const variants: Array<{
    id: string;
    size: string;
    onlineStock: number;
    isActive: boolean;
  }> = (orderItem.product as any)?.variants ?? [];

  const hasVariants = variants.length > 0;
  const orderedVariantId = (orderItem as any)?.variantId ?? null;

  // Eligibility info
  const elig = (orderItem as any).exchangeEligibility;

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
    if (hasVariants && !selectedVariantId) {
      setError("Please select the replacement size");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const itemPayload: Record<string, unknown> = { orderItemId, quantity: 1 };
      if (selectedVariantId) {
        itemPayload.exchangeproductId = orderItem.product?.id;
        itemPayload.exchangeVariantId = selectedVariantId;
      }

      const res = await fetch("/api/exchanges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          reason,
          reasonDetails,
          pickupAddress: pickupAddress || undefined,
          items: [itemPayload],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to submit exchange request");
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
    <div className={showBackButton ? "space-y-4" : "mt-3 pt-3 border-t border-blue-100 space-y-3"}>
      {/* Header */}
      {showBackButton ? (
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex items-center gap-3 group disabled:opacity-50"
          aria-label="Back to order"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-gray-800 transition-colors" />
          <h2 className="text-xl font-semibold text-gray-900">Exchange Request</h2>
        </button>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700">
            <RefreshCw className="w-3.5 h-3.5" />
            Exchange Request
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            aria-label="Cancel exchange"
          >
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
      )}

      {/* Item preview — shown in full-page mode */}
      {showBackButton && (
        <>
          {/* Order ID + Item + Pickup address card */}
          <Card className="p-4 sm:p-5 hover:border-slate-300 transition-colors bg-white space-y-3">
            {/* Order ID */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Order</span>
              <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                #{order.id}
              </span>
              {elig?.remainingDays && (
                <span className="ml-auto text-[10px] text-blue-600 font-medium">
                  ⏱ {elig.remainingDays}d left to exchange
                </span>
              )}
            </div>

            {/* Item card */}
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
                    <RefreshCw className="w-4 h-4 text-gray-400" />
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
        </>
      )}

      {/* Eligibility banner */}
      {elig?.remainingDays && !showBackButton && (
        <div className="flex items-center gap-2 px-2.5 py-2 bg-blue-50 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
          <p className="text-[11px] text-blue-800 font-medium">
            {elig.remainingDays} days remaining to exchange
          </p>
        </div>
      )}

      {/* Form fields */}
      <Card className="p-4 sm:p-5 hover:border-slate-300 transition-colors bg-white space-y-3">
        {/* Size picker */}
        {hasVariants && (
          <div className="space-y-1.5">
            <Label className="text-xs">
              Replacement Size <span className="text-red-500">*</span>
            </Label>
            <p className="text-[11px] text-gray-500">
              You ordered:{" "}
              <span className="font-medium">
                {variants.find((v) => v.id === orderedVariantId)?.size ?? "—"}
              </span>
              . Select the size you want instead.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {variants.map((v) => {
                const outOfStock = v.onlineStock < 1;
                const isSelected = selectedVariantId === v.id;
                const isOriginal = v.id === orderedVariantId;
                const isDisabled = outOfStock || !v.isActive || isOriginal;
                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => setSelectedVariantId(v.id)}
                    className={[
                      "relative px-2.5 py-1 rounded-md border text-xs font-medium transition-colors",
                      isSelected
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : isDisabled
                          ? "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed"
                          : "border-gray-300 bg-white text-gray-700 hover:border-gray-500",
                    ].join(" ")}
                  >
                    {v.size}
                    {isOriginal && (
                      <span className="ml-1 text-[10px] text-gray-400">(yours)</span>
                    )}
                    {outOfStock && !isOriginal && (
                      <span className="ml-1 text-[10px] text-red-400">OOS</span>
                    )}
                    {isSelected && (
                      <CheckCircle2 className="absolute -top-1.5 -right-1.5 w-3 h-3 text-blue-600 bg-white rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Reason */}
        <div className="space-y-1.5">
          <Label className="text-xs">Reason for Exchange</Label>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger className="text-xs h-8">
              <SelectValue placeholder="Select a reason" />
            </SelectTrigger>
            <SelectContent>
              {REASONS.map((r) => (
                <SelectItem key={r.value} value={r.value} className="text-xs">
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Details */}
        <div className="space-y-1.5">
          <Label className="text-xs">Additional Details</Label>
          <Textarea
            placeholder="Describe the issue with your item..."
            value={reasonDetails}
            onChange={(e) => setReasonDetails(e.target.value)}
            rows={2}
            className="text-xs resize-none"
            inputMode="text"
          />
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-800">{error}</p>
        </div>
      )}

      {/* Actions */}
      <Button
        size="sm"
        onClick={handleSubmit}
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
            Submitting…
          </>
        ) : (
          "Submit Exchange Request"
        )}
      </Button>
    </div>
  );
}
