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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, RefreshCw, AlertCircle } from "lucide-react";
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

const exchangeReasons = [
  { value: "size_issue", label: "Wrong Size" },
  { value: "color_mismatch", label: "Wrong Color" },
  { value: "defective", label: "Defective Product" },
  { value: "not_as_described", label: "Not as Described" },
  { value: "other", label: "Other" },
];

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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const orderItem = order.items?.find((item) => item.id === orderItemId);
  const maxQuantity = orderItem?.quantity || 1;

  const reasons = type === "exchange" ? exchangeReasons : returnReasons;

  const handleSubmit = async () => {
    if (!reason) {
      setError("Please select a reason");
      return;
    }

    if (!reasonDetails.trim()) {
      setError("Please provide details about your return/exchange");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/returns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          reason,
          reasonDetails,
          resolution: type,
          items: [
            {
              orderItemId,
              quantity,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit request");
      }

      const result = await response.json();

      // Close modal and show success message
      onOpenChange(false);
      setReason("");
      setReasonDetails("");
      setQuantity(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  if (!orderItem) return null;

  const ModalContent = () => (
    <>
      <Header />
      <div className="space-y-4">
        {/* Item Details */}
        <div className="border rounded-lg p-3 bg-gray-50">
          <div className="flex gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
              {orderItem.product?.imageUrl ? (
                <img
                  src={orderItem.product.imageUrl}
                  alt={orderItem.product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <RotateCcw className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">
                {orderItem.product?.name || "Product"}
              </h4>
              <p className="text-xs text-gray-500">
                {orderItem.product?.category?.name}
                {orderItem.product?.color?.name &&
                  ` | ${orderItem.product.color.name}`}
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">
                  Qty: {orderItem.quantity}
                </span>
                <span className="text-sm font-medium">
                  ¥{parseFloat(orderItem.price).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Return Eligibility Info */}
        {orderItem.returnEligibility && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <div className="text-sm">
              <p className="text-blue-800 font-medium">
                {orderItem.returnEligibility.remainingDays
                  ? `${orderItem.returnEligibility.remainingDays} days remaining`
                  : "Eligible for return"}
              </p>
            </div>
          </div>
        )}

        {/* Quantity Selection */}
        {maxQuantity > 1 && (
          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantity to {type === "exchange" ? "Exchange" : "Return"}
            </Label>
            <Select
              value={quantity.toString()}
              onValueChange={(value) => setQuantity(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: maxQuantity }, (_, i) => i + 1).map(
                  (qty) => (
                    <SelectItem key={qty} value={qty.toString()}>
                      {qty}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Reason Selection */}
        <div className="space-y-2">
          <Label htmlFor="reason">
            Reason for {type === "exchange" ? "Exchange" : "Return"}
          </Label>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger>
              <SelectValue placeholder="Select a reason" />
            </SelectTrigger>
            <SelectContent>
              {reasons.map((reasonOption) => (
                <SelectItem key={reasonOption.value} value={reasonOption.value}>
                  {reasonOption.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reason Details */}
        <div className="space-y-2">
          <Label htmlFor="details">Additional Details</Label>
          <Textarea
            id="details"
            placeholder="Please provide more details about your request..."
            value={reasonDetails}
            onChange={(e) => setReasonDetails(e.target.value)}
            rows={4}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>

      <Footer />
    </>
  );

  const Header = () =>
    isMobile ? (
      <DrawerHeader>
        <DrawerTitle className="flex items-center gap-2">
          {type === "exchange" ? (
            <RefreshCw className="w-5 h-5" />
          ) : (
            <RotateCcw className="w-5 h-5" />
          )}
          Request {type === "exchange" ? "Exchange" : "Return"}
        </DrawerTitle>
        <DrawerDescription>
          {type === "exchange"
            ? "Request an exchange for this item"
            : "Request a return for this item"}
        </DrawerDescription>
      </DrawerHeader>
    ) : (
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {type === "exchange" ? (
            <RefreshCw className="w-5 h-5" />
          ) : (
            <RotateCcw className="w-5 h-5" />
          )}
          Request {type === "exchange" ? "Exchange" : "Return"}
        </DialogTitle>
        <DialogDescription>
          {type === "exchange"
            ? "Request an exchange for this item"
            : "Request a return for this item"}
        </DialogDescription>
      </DialogHeader>
    );

  const Footer = () =>
    isMobile ? (
      <DrawerFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading
            ? "Submitting..."
            : `Submit ${type === "exchange" ? "Exchange" : "Return"} Request`}
        </Button>
      </DrawerFooter>
    ) : (
      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading
            ? "Submitting..."
            : `Submit ${type === "exchange" ? "Exchange" : "Return"} Request`}
        </Button>
      </DialogFooter>
    );

  return (
    <>
      {isMobile ? (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent>
            <ModalContent />
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent>
            <ModalContent />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
