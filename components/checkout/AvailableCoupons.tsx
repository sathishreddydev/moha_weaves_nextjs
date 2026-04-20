"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/formatters";
import { Tag, Calendar, Percent, DollarSign, Truck, Search } from "lucide-react";
import { toast } from "sonner";
import AllCouponsModal from "./AllCouponsModal";

interface Coupon {
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

interface AvailableCouponsProps {
  orderAmount: number;
  onCouponSelect: (couponCode: string) => void;
}

export default function AvailableCoupons({ orderAmount, onCouponSelect }: AvailableCouponsProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllModal, setShowAllModal] = useState(false);

  useEffect(() => {
    fetchAvailableCoupons();
  }, [orderAmount]);

  const fetchAvailableCoupons = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/coupon/available?orderAmount=${orderAmount}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch coupons");
      }

      const data = await response.json();
      const sortedCoupons = sortCouponsByBest(data.coupons || []);
      setCoupons(sortedCoupons);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      // Don't show error toast for this, it's not critical
    } finally {
      setLoading(false);
    }
  };

  const sortCouponsByBest = (couponList: Coupon[]): Coupon[] => {
    return couponList.sort((a, b) => {
      // Priority 1: Expiring soon (within 3 days)
      const aExpiringSoon = isExpiringSoon(a.validUntil);
      const bExpiringSoon = isExpiringSoon(b.validUntil);
      if (aExpiringSoon && !bExpiringSoon) return -1;
      if (!aExpiringSoon && bExpiringSoon) return 1;

      // Priority 2: Higher discount value
      const aDiscountValue = getDiscountValue(a, orderAmount);
      const bDiscountValue = getDiscountValue(b, orderAmount);
      if (bDiscountValue > aDiscountValue) return 1;
      if (aDiscountValue > bDiscountValue) return -1;

      // Priority 3: Newer coupons
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  const getDiscountValue = (coupon: Coupon, currentOrderAmount: number): number => {
    if (coupon.type === "percentage") {
      return (currentOrderAmount * Number(coupon.value)) / 100;
    } else if (coupon.type === "fixed") {
      return Number(coupon.value);
    } else if (coupon.type === "free_shipping") {
      return 50; // Assume shipping cost is ₹50
    }
    return 0;
  };

  const handleApplyCoupon = (couponCode: string) => {
    onCouponSelect(couponCode);
  };

  const getCouponDisplay = (coupon: Coupon) => {
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

  const getCouponIcon = (type: string) => {
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

  const getCouponColor = (type: string) => {
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

  const isExpiringSoon = (validUntil: string) => {
    const expiryDate = new Date(validUntil);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Tag className="h-5 w-5" />
            Available Coupons
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-100 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (coupons.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Tag className="h-5 w-5" />
            Available Coupons
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            No coupons available at the moment
          </p>
        </CardContent>
      </Card>
    );
  }

  const bestCoupon = coupons[0]; // First coupon is the best after sorting
  const hasMoreCoupons = coupons.length > 1;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Tag className="h-5 w-5" />
            Best Coupon Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getCouponColor(bestCoupon.type)}>
                    {getCouponIcon(bestCoupon.type)}
                    <span className="ml-1">{getCouponDisplay(bestCoupon)}</span>
                  </Badge>
                  {isExpiringSoon(bestCoupon.validUntil) && (
                    <Badge variant="destructive" className="text-xs">
                      Expires Soon
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    🏆 Best Deal
                  </Badge>
                </div>
                
                <h4 className="font-medium text-gray-900 mb-1">{bestCoupon.name}</h4>
                
                {bestCoupon.description && (
                  <p className="text-sm text-gray-600 mb-2">{bestCoupon.description}</p>
                )}
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {bestCoupon.code}
                  </span>
                  {bestCoupon.minOrderAmount && (
                    <span>Min order: ₹{bestCoupon.minOrderAmount}</span>
                  )}
                  {bestCoupon.usageLimit && (
                    <span>
                      {bestCoupon.usageLimit - bestCoupon.usedCount} left
                    </span>
                  )}
                </div>
              </div>
              
              <Button
                size="sm"
                onClick={() => handleApplyCoupon(bestCoupon.code)}
                className="ml-3 flex-shrink-0"
              >
                Apply
              </Button>
            </div>
          </div>

          {hasMoreCoupons && (
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => setShowAllModal(true)}
                className="w-full"
              >
                <Search className="h-4 w-4 mr-2" />
                See All Coupons ({coupons.length})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Coupons Modal */}
      <AllCouponsModal
        isOpen={showAllModal}
        onClose={() => setShowAllModal(false)}
        coupons={coupons}
        onCouponSelect={handleApplyCoupon}
        orderAmount={orderAmount}
      />
    </>
  );
}