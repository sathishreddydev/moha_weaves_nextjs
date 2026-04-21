import React from "react";
import { Badge } from "@/components/ui/badge";
import { Tag, Percent, Truck } from "lucide-react";

interface CouponBadgeProps {
  couponCode?: string | null;
  couponType?: string | null;
  couponValue?: string | null;
  discountAmount?: string | null;
  className?: string;
}

export function CouponBadge({
  couponCode,
  couponType,
  couponValue,
  discountAmount,
  className = ""
}: CouponBadgeProps) {
  if (!couponCode) {
    return null;
  }

  const getCouponIcon = () => {
    switch (couponType) {
      case "percentage":
        return <Percent className="h-3 w-3" />;
      case "fixed":
        return <Tag className="h-3 w-3" />;
      case "free_shipping":
        return <Truck className="h-3 w-3" />;
      default:
        return <Tag className="h-3 w-3" />;
    }
  };

  const getCouponDisplay = () => {
    switch (couponType) {
      case "percentage":
        return `${couponValue}% off`;
      case "fixed":
        return `₹${couponValue} off`;
      case "free_shipping":
        return "Free shipping";
      default:
        return couponCode;
    }
  };

  const getDiscountDisplay = () => {
    if (!discountAmount || parseFloat(discountAmount) === 0) {
      return null;
    }
    return `Saved ₹${discountAmount}`;
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
        <div className="flex items-center gap-1">
          {getCouponIcon()}
          <span className="font-medium">{couponCode.toUpperCase()}</span>
          <span className="text-xs">({getCouponDisplay()})</span>
        </div>
      </Badge>
      
      {getDiscountDisplay() && (
        <Badge variant="outline" className="text-green-700 border-green-300">
          {getDiscountDisplay()}
        </Badge>
      )}
    </div>
  );
}
