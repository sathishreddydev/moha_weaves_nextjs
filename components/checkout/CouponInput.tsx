"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Tag, CheckCircle } from "lucide-react";
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
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">
                  Coupon Applied: {appliedCoupon.code.toUpperCase()}
                </p>
                <p className="text-sm text-green-700">
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
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <AvailableCoupons
      orderAmount={orderAmount}
      onCouponSelect={handleCouponSelect}
    />
  );
}
