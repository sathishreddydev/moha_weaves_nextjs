"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RotateCcw, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { OrderWithItems } from "@/shared";

interface ReturnModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderWithItems;
  orderItemId: string;
  type: "return" | "exchange";
}

const returnReasons = [
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

const exchangeReasons = returnReasons;

export default function ReturnModal({
  open,
  onOpenChange,
  order,
  orderItemId,
  type,
}: ReturnModalProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonDetails, setReasonDetails] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const orderItem = order.items?.find((item) => item.id === orderItemId);
  const maxQuantity = orderItem?.quantity || 1;
  const reasons = type === "exchange" ? exchangeReasons : returnReasons;
  const label = type === "exchange" ? "Exchange" : "Return";

  const variants: Array<{ id: string; size: string; onlineStock: number; isActive: boolean }> =
    (orderItem?.product as any)?.variants ?? [];

  const hasVariants = variants.length > 0;
  const orderedVariantId = (orderItem as any)?.variantId ?? null;

  const resetForm = () => {
    setReason("");
    setReasonDetails("");
    setQuantity(1);
    setSelectedVariantId(null);
    setError("");
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) resetForm();
    onOpenChange(value);
  };

  const handleSubmit = async () => {
    if (!reason) {
      setError("Please select a reason");
      return;
    }
    if (!reasonDetails.trim()) {
      setError("Please provide details about your request");
      return;
    }
    if (type === "exchange" && hasVariants && !selectedVariantId) {
      setError("Please select the size you want for the replacement");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const isExchange = type === "exchange";
      const endpoint = isExchange ? "/api/exchanges" : "/api/returns";

      const itemPayload: Record<string, unknown> = { orderItemId, quantity };
      if (isExchange && selectedVariantId) {
        itemPayload.exchangeproductId = orderItem?.product?.id;
        itemPayload.exchangeVariantId = selectedVariantId;
      }

      const payload = isExchange
        ? { orderId: order.id, reason, reasonDetails, items: [itemPayload] }
        : { orderId: order.id, reason, reasonDetails, resolution: "refund", items: [itemPayload] };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit request");
      }

      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  if (!orderItem) return null;

  const content = (
    <div className="px-4 space-y-3 overflow-y-auto">
      {/* Item Details */}
      <div className="border rounded-lg p-2.5 bg-gray-50">
        <div className="flex gap-2.5">
          <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden flex-shrink-0">
            {orderItem.product?.imageUrl ? (
              <img
                src={orderItem.product.imageUrl}
                alt={orderItem.product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <RotateCcw className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-xs truncate">
              {orderItem.product?.name || "Product"}
            </h4>
            <p className="text-[11px] text-gray-500">
              {orderItem.product?.category?.name}
              {(orderItem.product as any)?.color?.name &&
                ` | ${(orderItem.product as any).color.name}`}
            </p>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[11px] text-gray-500">Qty: {orderItem.quantity}</span>
              <span className="text-xs font-medium">
                ₹{parseFloat(orderItem.price).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Eligibility Info */}
      {(type === "return"
        ? orderItem.returnEligibility
        : (orderItem as any).exchangeEligibility) && (
        <div className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
          <p className="text-xs text-blue-800 font-medium">
            {(() => {
              const elig =
                type === "return"
                  ? orderItem.returnEligibility
                  : (orderItem as any).exchangeEligibility;
              return elig?.remainingDays
                ? `${elig.remainingDays} days remaining`
                : `Eligible for ${label.toLowerCase()}`;
            })()}
          </p>
        </div>
      )}

      {/* Size picker (exchange only) */}
      {type === "exchange" && hasVariants && (
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
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {variants.map((v) => {
              const outOfStock = v.onlineStock < 1;
              const isSelected = selectedVariantId === v.id;
              const isOriginal = v.id === orderedVariantId;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={outOfStock || !v.isActive}
                  onClick={() => setSelectedVariantId(v.id)}
                  className={[
                    "relative px-2.5 py-1 rounded-md border text-xs font-medium transition-colors",
                    isSelected
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : outOfStock || !v.isActive
                      ? "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-500",
                  ].join(" ")}
                >
                  {v.size}
                  {isOriginal && (
                    <span className="ml-1 text-[10px] text-gray-400">(yours)</span>
                  )}
                  {outOfStock && (
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

      {/* Quantity */}
      {maxQuantity > 1 && (
        <div className="space-y-1.5">
          <Label className="text-xs">Quantity to {label}</Label>
          <Select
            value={quantity.toString()}
            onValueChange={(value) => setQuantity(parseInt(value))}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: maxQuantity }, (_, i) => i + 1).map((qty) => (
                <SelectItem key={qty} value={qty.toString()} className="text-xs">
                  {qty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Reason */}
      <div className="space-y-1.5">
        <Label className="text-xs">Reason for {label}</Label>
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select a reason" />
          </SelectTrigger>
          <SelectContent>
            {reasons.map((r) => (
              <SelectItem key={r.value} value={r.value} className="text-xs">
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Details */}
      <div className="space-y-1.5">
        <Label htmlFor="return-details" className="text-xs">Additional Details</Label>
        <Textarea
          id="return-details"
          placeholder="Please provide more details about your request..."
          value={reasonDetails}
          onChange={(e) => setReasonDetails(e.target.value)}
          rows={3}
          className="text-xs resize-none"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-2.5 bg-red-50 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-800">{error}</p>
        </div>
      )}
    </div>
  );

  const titleContent = (
    <>
      {type === "exchange" ? (
        <RefreshCw className="w-4 h-4" />
      ) : (
        <RotateCcw className="w-4 h-4" />
      )}
      Request {label}
    </>
  );

  const descriptionText = `Request a${type === "exchange" ? "n exchange" : " return"} for this item`;

  const footerButtons = (
    <>
      <Button
        variant="outline"
        onClick={() => handleOpenChange(false)}
        disabled={loading}
        size="sm"
        className="text-xs"
      >
        Cancel
      </Button>
      <Button onClick={handleSubmit} disabled={loading} size="sm" className="text-xs">
        {loading ? "Submitting..." : `Submit ${label} Request`}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent>
          <DrawerHeader className="pb-2">
            <DrawerTitle className="flex items-center gap-2 text-sm">
              {titleContent}
            </DrawerTitle>
            <DrawerDescription className="text-xs">{descriptionText}</DrawerDescription>
          </DrawerHeader>
          {content}
          <DrawerFooter className="pt-3">{footerButtons}</DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            {titleContent}
          </DialogTitle>
          <DialogDescription className="text-xs">{descriptionText}</DialogDescription>
        </DialogHeader>
        {content}
        <DialogFooter>{footerButtons}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
