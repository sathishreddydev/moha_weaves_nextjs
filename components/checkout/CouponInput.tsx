"use client";

import { Button } from "@/components/ui/button";
import { Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import AvailableCoupons from "./AvailableCoupons";

interface AppliedCoupon {
  id: string;
  code: string;
  discountAmount: number;
  type: string;
  value: string;
}

interface CouponInputProps {
  orderAmount: number;
  onCouponApplied: (coupon: AppliedCoupon) => void;
  onCouponRemoved: () => void;
  appliedCoupon?: AppliedCoupon | null;
}

export default function CouponInput({
  orderAmount,
  onCouponApplied,
  onCouponRemoved,
  appliedCoupon,
}: CouponInputProps) {
  const handleCouponSelect = async (couponCode: string) => {
    try {
      const response = await fetch("/api/coupon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: couponCode.trim(),
          orderAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Invalid coupon code");
        return;
      }

      const appliedCoupon: AppliedCoupon = {
        id: data.coupon.id,
        code: data.coupon.code,
        discountAmount: data.discountAmount,
        type: data.coupon.type,
        value: data.coupon.value,
      };

      onCouponApplied(appliedCoupon);
      toast.success("Coupon applied successfully!");
    } catch (error) {
      console.error("Coupon application error:", error);
      toast.error("Failed to apply coupon");
    }
  };

  const handleRemoveCoupon = () => {
    onCouponRemoved();
    toast.success("Coupon removed");
  };

  if (appliedCoupon) {
    return (
      <div className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center">
            <Check className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {appliedCoupon.code.toUpperCase()}
            </p>
            <p className="text-xs text-gray-500">
              {appliedCoupon.type === "percentage"
                ? `${appliedCoupon.value}% off`
                : appliedCoupon.type === "fixed"
                  ? `₹${appliedCoupon.value} off`
                  : "Free shipping"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemoveCoupon}
          className="text-gray-400 hover:text-gray-700 hover:bg-gray-100"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <AvailableCoupons
      orderAmount={orderAmount}
      onCouponSelect={handleCouponSelect}
    />
  );
}
