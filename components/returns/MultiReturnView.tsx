"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Loader2,
  MapPin,
  Minus,
  Package,
  Plus,
  RotateCcw,
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

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SelectedItem {
  orderItemId: string;
  quantity: number;
}

interface MultiReturnViewProps {
  order: OrderWithItems;
  preSelectedItemId?: string | null;
  onBack: () => void;
  onSuccess: () => void;
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <div
          className={[
            "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
            step === 1 ? "bg-gray-900 text-white" : "bg-green-500 text-white",
          ].join(" ")}
        >
          {step > 1 ? <Check className="w-3 h-3" /> : "1"}
        </div>
        <span
          className={[
            "text-xs font-medium",
            step === 1 ? "text-gray-900" : "text-gray-400",
          ].join(" ")}
        >
          Select Items
        </span>
      </div>
      <div
        className={[
          "h-px w-8 flex-shrink-0",
          step > 1 ? "bg-green-400" : "bg-gray-200",
        ].join(" ")}
      />
      <div className="flex items-center gap-1.5">
        <div
          className={[
            "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
            step === 2 ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-400",
          ].join(" ")}
        >
          2
        </div>
        <span
          className={[
            "text-xs font-medium",
            step === 2 ? "text-gray-900" : "text-gray-400",
          ].join(" ")}
        >
          Details
        </span>
      </div>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function MultiReturnView({
  order,
  preSelectedItemId,
  onBack,
  onSuccess,
}: MultiReturnViewProps) {
  const [step, setStep] = useState<1 | 2>(1);

  // Pre-select the item that was clicked, if eligible
  const eligibleIds = order.items
    .filter((item) => (item as any).returnEligibility?.eligible)
    .map((item) => item.id);

  const initialSelected: SelectedItem[] =
    preSelectedItemId && eligibleIds.includes(preSelectedItemId)
      ? [{ orderItemId: preSelectedItemId, quantity: 1 }]
      : [];

  const [selectedItems, setSelectedItems] =
    useState<SelectedItem[]>(initialSelected);
  const [reason, setReason] = useState("");
  const [reasonDetails, setReasonDetails] = useState("");
  const [resolution, setResolution] = useState<"refund" | "store_credit">(
    "refund",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  // Only items eligible for return
  const eligibleItems = order.items.filter(
    (item) => (item as any).returnEligibility?.eligible,
  );

  const ineligibleItems = order.items.filter(
    (item) =>
      !(item as any).returnEligibility?.eligible &&
      !(item as any).returnInfo &&
      !(item as any).exchangeInfo,
  );

  // ── Selection helpers ──────────────────────────────────────────────────────

  const isSelected = (id: string) =>
    selectedItems.some((s) => s.orderItemId === id);

  const toggleItem = (item: any) => {
    if (isSelected(item.id)) {
      setSelectedItems((prev) => prev.filter((s) => s.orderItemId !== item.id));
    } else {
      setSelectedItems((prev) => [
        ...prev,
        { orderItemId: item.id, quantity: 1 },
      ]);
    }
  };

  const setQty = (id: string, qty: number) =>
    setSelectedItems((prev) =>
      prev.map((s) => (s.orderItemId === id ? { ...s, quantity: qty } : s)),
    );

  const getQty = (id: string) =>
    selectedItems.find((s) => s.orderItemId === id)?.quantity ?? 1;

  const selectedTotal = selectedItems.reduce((sum, sel) => {
    const item = order.items.find((i) => i.id === sel.orderItemId);
    return item ? sum + parseFloat(item.price) * sel.quantity : sum;
  }, 0);

  // ── Step 1 → Step 2 ────────────────────────────────────────────────────────

  const handleContinue = () => {
    if (selectedItems.length === 0) {
      setError("Please select at least one item to return");
      return;
    }
    setError("");
    setStep(2);
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!reason) {
      setError("Please select a reason");
      return;
    }
    if (!reasonDetails.trim()) {
      setError("Please describe the issue");
      return;
    }

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
          items: selectedItems,
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
      {/* Header */}
      <button
        type="button"
        onClick={step === 2 ? () => setStep(1) : onBack}
        className="flex items-center gap-3 group"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-gray-800 transition-colors" />
        <h2 className="text-xl font-semibold text-gray-900">Return Items</h2>
      </button>

      {/* Order ID + step indicator */}
      <div className="flex items-center justify-between">
        <StepIndicator step={step} />
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
            Order
          </span>
          <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
            #{order.id}
          </span>
        </div>
      </div>

      {/* ── STEP 1: Select items ── */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            Select the items you want to return
          </p>

          {eligibleItems.length === 0 ? (
            <Card className="p-8 hover:border-slate-300 transition-colors bg-white flex flex-col items-center text-center">
              <RotateCcw className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-600">
                No items eligible for return
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Return window may have passed or items are non-returnable
              </p>
            </Card>
          ) : (
            <Card className="p-4 sm:p-5 hover:border-slate-300 transition-colors bg-white space-y-2">
              {eligibleItems.map((item: any) => {
                const selected = isSelected(item.id);
                const qty = getQty(item.id);
                const maxQty = item.quantity;
                const elig = item.returnEligibility;
                const variant = item.variantId
                  ? item.product?.variants?.find(
                      (v: any) => v.id === item.variantId,
                    )
                  : null;

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleItem(item)}
                    className={[
                      "flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all",
                      selected
                        ? "border-gray-900 bg-gray-50"
                        : "border-gray-200 bg-white hover:border-gray-300",
                    ].join(" ")}
                  >
                    {/* Checkbox */}
                    <div className="flex-shrink-0 mt-0.5">
                      <div
                        className={[
                          "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
                          selected
                            ? "bg-gray-900 border-gray-900"
                            : "border-gray-300 bg-white",
                        ].join(" ")}
                      >
                        {selected && (
                          <Check className="w-2.5 h-2.5 text-white" />
                        )}
                      </div>
                    </div>

                    {/* Image */}
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.product?.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {item.product?.name || "Product"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {variant?.size && (
                          <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            Size: {variant.size}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-500">
                          ₹{parseFloat(item.price).toFixed(2)}
                        </span>
                        {elig?.remainingDays && (
                          <span className="text-[10px] text-blue-600 font-medium">
                            ⏱ {elig.remainingDays}d left
                          </span>
                        )}
                      </div>

                      {/* Quantity stepper */}
                      {selected && maxQty > 1 && (
                        <div
                          className="flex items-center gap-2 mt-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-[10px] text-gray-500">
                            Return qty:
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setQty(item.id, Math.max(1, qty - 1))
                              }
                              className="w-5 h-5 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="text-xs font-medium w-4 text-center">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setQty(item.id, Math.min(maxQty, qty + 1))
                              }
                              className="w-5 h-5 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                            <span className="text-[10px] text-gray-400">
                              of {maxQty}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </Card>
          )}

          {/* Ineligible items */}
          {ineligibleItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
                Not eligible for return
              </p>
              {ineligibleItems.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 opacity-60"
                >
                  <div className="w-10 h-10 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product?.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 truncate">
                      {item.product?.name || "Product"}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {item.returnEligibility?.reason || "Non-returnable"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
              <p className="text-xs text-red-800">{error}</p>
            </div>
          )}

          {/* Continue */}
          {eligibleItems.length > 0 && (
            <div className="space-y-2 pt-1">
              {selectedItems.length > 0 && (
                <p className="text-xs text-gray-500 text-center">
                  {selectedItems.length} item
                  {selectedItems.length > 1 ? "s" : ""} selected
                  {" · "}
                  <span className="font-medium text-gray-900">
                    ₹{selectedTotal.toFixed(2)}
                  </span>
                </p>
              )}
              <Button
                className="w-full"
                size="sm"
                onClick={handleContinue}
                disabled={selectedItems.length === 0}
              >
                Continue →
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: Return details ── */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Selected items + pickup address summary */}
          <Card className="p-4 sm:p-5 hover:border-slate-300 transition-colors bg-white space-y-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
              Returning {selectedItems.length} item
              {selectedItems.length > 1 ? "s" : ""}
              {" · "}₹{selectedTotal.toFixed(2)}
            </p>
            {selectedItems.map((sel) => {
              const item = order.items.find(
                (i) => i.id === sel.orderItemId,
              ) as any;
              if (!item) return null;
              return (
                <div key={sel.orderItemId} className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product?.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 truncate flex-1">
                    {item.product?.name}
                  </p>
                  <span className="text-[10px] text-gray-400 flex-shrink-0">
                    Qty: {sel.quantity}
                  </span>
                </div>
              );
            })}

            {/* Pickup address */}
            {pickupAddress && (
              <div className="flex items-start gap-2.5 pt-2 border-t border-gray-100">
                <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">
                    Pickup Address
                  </p>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {pickupAddress}
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Form fields */}
          <Card className="p-4 sm:p-5 hover:border-slate-300 transition-colors bg-white space-y-3">
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
                label="Please describe the issue with your item(s)..."
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
                  <div className="text-[10px] text-gray-400 font-normal">
                    5–7 business days
                  </div>
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
                  <div className="text-[10px] text-gray-400 font-normal">
                    Instant coupon
                  </div>
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
      )}
    </div>
  );
}
