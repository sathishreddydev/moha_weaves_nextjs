import { Badge } from "@/components/ui/badge";
import { Tag, Percent, DollarSign, Truck } from "lucide-react";

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
      return <Percent className="h-3.5 w-3.5" />;
    case "fixed":
      return <DollarSign className="h-3.5 w-3.5" />;
    case "free_shipping":
      return <Truck className="h-3.5 w-3.5" />;
    default:
      return <Tag className="h-3.5 w-3.5" />;
  }
};

export const getCouponColor = (_type: string) => {
  return "bg-gray-100 text-gray-800 border border-gray-200";
};

export const isExpiringSoon = (validUntil: string) => {
  const expiryDate = new Date(validUntil);
  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 3;
};

export const getCouponStatus = (
  coupon: Coupon,
  usedCoupons: Coupon[],
  orderAmount: number,
) => {
  if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit)
    return "exhausted";

  if (coupon.perUserLimit) {
    const userUsageCount = usedCoupons.filter(
      (used) => used.id === coupon.id,
    ).length;
    if (userUsageCount >= coupon.perUserLimit) return "limit_reached";
  }

  const isUsed = usedCoupons.some((used) => used.id === coupon.id);
  if (isUsed && !coupon.perUserLimit) return "used";

  if (coupon.minOrderAmount && orderAmount < Number(coupon.minOrderAmount))
    return "min_order";

  return "available";
};

export const getCouponStatusBadge = (status: string) => {
  switch (status) {
    case "used":
      return (
        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-500">
          Already Used
        </Badge>
      );
    case "exhausted":
      return (
        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-500">
          Fully Claimed
        </Badge>
      );
    case "limit_reached":
      return (
        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-500">
          Limit Reached
        </Badge>
      );
    case "min_order":
      return (
        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-500">
          Min Order Required
        </Badge>
      );
    default:
      return null;
  }
};

export const getDiscountValue = (
  coupon: Coupon,
  currentOrderAmount: number,
): number => {
  const FREE_SHIPPING_THRESHOLD = 999;
  const SHIPPING_COST = 50;

  let discount = 0;
  if (coupon.type === "percentage") {
    discount = (currentOrderAmount * Number(coupon.value)) / 100;
  } else if (coupon.type === "fixed") {
    discount = Number(coupon.value);
  } else if (coupon.type === "free_shipping") {
    discount = currentOrderAmount < FREE_SHIPPING_THRESHOLD ? SHIPPING_COST : 0;
  }

  if (coupon.maxDiscount && parseFloat(coupon.maxDiscount) > 0) {
    discount = Math.min(discount, parseFloat(coupon.maxDiscount));
  }

  return discount;
};
