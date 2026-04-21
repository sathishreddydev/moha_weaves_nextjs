import React from "react";
import { Badge } from "@/components/ui/badge";
import { Tag, Calendar, Percent, DollarSign, Truck } from "lucide-react";

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: string;
  minOrderAmount?: string;
  maxDiscount?: string;
  usageLimit?: number;
  usedCount: number;
  perUserLimit?: number;
  validFrom: string;
  validUntil: string;
  createdAt: string;
}

// Shared utility functions for coupon display and status
export const getCouponDisplay = (coupon: Coupon) => {
  switch (coupon.type) {
    case "percentage":
      return `${coupon.value}% OFF`;
    case "fixed":
      return `₹${coupon.value} OFF`;
    case "free_shipping":
      return "FREE SHIPPING";
    default:
      return coupon.value;
  }
};

export const getCouponIcon = (type: string) => {
  switch (type) {
    case "percentage":
      return <Percent className="h-4 w-4" />;
    case "fixed":
      return <DollarSign className="h-4 w-4" />;
    case "free_shipping":
      return <Truck className="h-4 w-4" />;
    default:
      return <Tag className="h-4 w-4" />;
  }
};

export const getCouponColor = (type: string) => {
  switch (type) {
    case "percentage":
      return "bg-blue-100 text-blue-800";
    case "fixed":
      return "bg-green-100 text-green-800";
    case "free_shipping":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const isExpiringSoon = (validUntil: string) => {
  const expiryDate = new Date(validUntil);
  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 3;
};

export const getCouponStatus = (coupon: Coupon, usedCoupons: Coupon[], orderAmount: number) => {
  // Check if coupon is used by user
  const isUsed = usedCoupons.some((used) => used.id === coupon.id);
  if (isUsed) return "used";

  // Check if usage limit reached
  if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit)
    return "exhausted";

  // Check if per-user limit reached
  if (coupon.perUserLimit) {
    const userUsageCount = usedCoupons.filter(
      (used) => used.id === coupon.id,
    ).length;
    if (userUsageCount >= coupon.perUserLimit) return "limit_reached";
  }

  // Check minimum order amount
  if (coupon.minOrderAmount && orderAmount < Number(coupon.minOrderAmount))
    return "min_order";

  return "available";
};

export const getCouponStatusBadge = (status: string) => {
  switch (status) {
    case "used":
      return (
        <Badge
          variant="secondary"
          className="text-xs bg-gray-100 text-gray-600"
        >
          Already Used
        </Badge>
      );
    case "exhausted":
      return (
        <Badge variant="destructive" className="text-xs">
          Fully Claimed
        </Badge>
      );
    case "limit_reached":
      return (
        <Badge
          variant="secondary"
          className="text-xs bg-orange-100 text-orange-600"
        >
          Limit Reached
        </Badge>
      );
    case "min_order":
      return (
        <Badge
          variant="secondary"
          className="text-xs bg-blue-100 text-blue-600"
        >
          Min Order Required
        </Badge>
      );
    default:
      return null;
  }
};

export const getDiscountValue = (coupon: Coupon, currentOrderAmount: number): number => {
  if (coupon.type === "percentage") {
    return (currentOrderAmount * Number(coupon.value)) / 100;
  } else if (coupon.type === "fixed") {
    return Number(coupon.value);
  } else if (coupon.type === "free_shipping") {
    // Calculate shipping cost (this would depend on your shipping logic)
    const shippingCost = currentOrderAmount < 1000 ? 50 : 0; // Assume shipping cost is ₹50
    return shippingCost;
  }
  return 0;
};
