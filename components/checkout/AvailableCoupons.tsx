"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag, ChevronRight } from "lucide-react";
import AllCouponsModal from "./AllCouponsModal";
import {
  Coupon,
  getCouponDisplay,
  getCouponIcon,
  isExpiringSoon,
  getCouponStatus,
  getDiscountValue,
} from "./couponUtils";

interface AvailableCouponsProps {
  orderAmount: number;
  onCouponSelect: (couponCode: string) => void;
}

export default function AvailableCoupons({
  orderAmount,
  onCouponSelect,
}: AvailableCouponsProps) {
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [usedCoupons, setUsedCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllModal, setShowAllModal] = useState(false);

  useEffect(() => {
    fetchAvailableCoupons();
  }, [orderAmount]);

  const fetchAvailableCoupons = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/coupon/available?orderAmount=${orderAmount}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch coupons");
      }

      const data = await response.json();
      const sortedAvailable = sortCouponsByBest(data.available || []);
      const sortedUsed = sortCouponsByBest(data.used || []);

      setAvailableCoupons(sortedAvailable);
      setUsedCoupons(sortedUsed);
    } catch (error) {
      // Non-critical — silently ignore so checkout is unblocked
    } finally {
      setLoading(false);
    }
  };

  const sortCouponsByBest = (couponList: Coupon[]): Coupon[] => {
    return couponList.sort((a, b) => {
      const aExpiringSoon = isExpiringSoon(a.validUntil);
      const bExpiringSoon = isExpiringSoon(b.validUntil);
      if (aExpiringSoon && !bExpiringSoon) return -1;
      if (!aExpiringSoon && bExpiringSoon) return 1;

      const aDiscountValue = getDiscountValue(a, orderAmount);
      const bDiscountValue = getDiscountValue(b, orderAmount);
      if (bDiscountValue > aDiscountValue) return 1;
      if (aDiscountValue > bDiscountValue) return -1;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  const handleApplyCoupon = (couponCode: string) => {
    onCouponSelect(couponCode);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse h-14 bg-gray-100 rounded-lg" />
        ))}
      </div>
    );
  }

  if (availableCoupons.length === 0) {
    return null;
  }

  const allCoupons = [...availableCoupons, ...usedCoupons];
  const bestCoupon = availableCoupons[0];
  const hasMoreCoupons = allCoupons.length > 1;

  const bestCouponStatus = getCouponStatus(bestCoupon, usedCoupons, orderAmount);
  const isBestCouponDisabled = bestCouponStatus !== "available";

  return (
    <>
      <div className="space-y-3">
        {/* Best coupon card */}
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <Badge
                  variant="secondary"
                  className="bg-gray-100 text-gray-800 border-0 text-xs font-medium"
                >
                  {getCouponIcon(bestCoupon.type)}
                  <span className="ml-1">{getCouponDisplay(bestCoupon)}</span>
                </Badge>
                {isExpiringSoon(bestCoupon.validUntil) && (
                  <span className="text-xs text-gray-500 font-medium">
                    Expires soon
                  </span>
                )}
              </div>

              {bestCoupon.description && (
                <p className="text-sm text-gray-600 mb-1.5 line-clamp-1">
                  {bestCoupon.description}
                </p>
              )}

              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="font-mono">{bestCoupon.code}</span>
                {bestCoupon.minOrderAmount && (
                  <span>Min ₹{bestCoupon.minOrderAmount}</span>
                )}
              </div>
            </div>

            <Button
              size="sm"
              variant={isBestCouponDisabled ? "secondary" : "default"}
              onClick={() =>
                !isBestCouponDisabled && handleApplyCoupon(bestCoupon.code)
              }
              disabled={isBestCouponDisabled}
              className="flex-shrink-0"
            >
              {isBestCouponDisabled ? "Unavailable" : "Apply"}
            </Button>
          </div>
        </div>

        {/* See all coupons */}
        {hasMoreCoupons && (
          <button
            type="button"
            onClick={() => setShowAllModal(true)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Tag className="h-3.5 w-3.5" />
              View all {allCoupons.length} coupons
            </span>
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      <AllCouponsModal
        isOpen={showAllModal}
        onClose={() => setShowAllModal(false)}
        coupons={allCoupons}
        availableCoupons={availableCoupons}
        usedCoupons={usedCoupons}
        onCouponSelect={handleApplyCoupon}
        orderAmount={orderAmount}
      />
    </>
  );
}
