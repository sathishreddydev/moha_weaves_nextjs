"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/formatters";
import { Tag, X, Search } from "lucide-react";
import {
  Coupon,
  getCouponDisplay,
  getCouponIcon,
  getCouponColor,
  isExpiringSoon,
  getCouponStatus,
  getCouponStatusBadge,
} from "./couponUtils";

interface AllCouponsModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupons: Coupon[];
  availableCoupons: Coupon[];
  usedCoupons: Coupon[];
  onCouponSelect: (couponCode: string) => void;
  orderAmount: number;
}

export default function AllCouponsModal({
  isOpen,
  onClose,
  coupons,
  availableCoupons,
  usedCoupons,
  onCouponSelect,
  orderAmount,
}: AllCouponsModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCoupons = useMemo(() => {
    if (!searchTerm) return coupons;

    const term = searchTerm.toLowerCase();
    return coupons.filter(
      (coupon) =>
        coupon.name.toLowerCase().includes(term) ||
        coupon.code.toLowerCase().includes(term) ||
        coupon.description?.toLowerCase().includes(term) ||
        coupon.type.toLowerCase().includes(term),
    );
  }, [coupons, searchTerm]);

  
  const handleCouponSelect = (couponCode: string) => {
    onCouponSelect(couponCode);
    onClose();
  };

  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Tag className="h-5 w-5" />
            All Available Coupons ({coupons.length})
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search coupons by name, code, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {filteredCoupons.length !== coupons.length && (
            <p className="text-sm text-gray-500 mt-2">
              Found {filteredCoupons.length} of {coupons.length} coupons
            </p>
          )}
        </div>

        {/* Coupons List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredCoupons.length === 0 ? (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm
                  ? "No coupons found matching your search"
                  : "No coupons available"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCoupons.map((coupon, index) => {
                const status = getCouponStatus(coupon, usedCoupons, orderAmount);
                const isDisabled = status !== "available";

                return (
                  <Card
                    key={coupon.id}
                    className={`transition-shadow ${
                      isDisabled
                        ? "bg-gray-50 opacity-75 border-gray-200"
                        : "hover:shadow-md"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getCouponColor(coupon.type)}>
                              {getCouponIcon(coupon.type)}
                              <span className="ml-1">
                                {getCouponDisplay(coupon)}
                              </span>
                            </Badge>
                            {isExpiringSoon(coupon.validUntil) && (
                              <Badge variant="destructive" className="text-xs">
                                Expires Soon
                              </Badge>
                            )}
                            {getCouponStatusBadge(status)}
                            {index === 0 && !searchTerm && !isDisabled && (
                              <Badge variant="secondary" className="text-xs">
                                🏆 Best Deal
                              </Badge>
                            )}
                          </div>

                          <h4
                            className={`font-medium mb-1 ${
                              isDisabled ? "text-gray-600" : "text-gray-900"
                            }`}
                          >
                            {coupon.name}
                          </h4>

                          {coupon.description && (
                            <p
                              className={`text-sm mb-2 ${
                                isDisabled ? "text-gray-500" : "text-gray-600"
                              }`}
                            >
                              {coupon.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {coupon.code}
                            </span>
                            {coupon.minOrderAmount && (
                              <span>Min order: ₹{coupon.minOrderAmount}</span>
                            )}
                            {coupon.usageLimit && (
                              <span>
                                {coupon.usageLimit - coupon.usedCount} left
                              </span>
                            )}
                          </div>
                        </div>

                        <Button
                          size="sm"
                          onClick={() =>
                            !isDisabled && handleCouponSelect(coupon.code)
                          }
                          disabled={isDisabled}
                          className="ml-3 flex-shrink-0"
                          variant={isDisabled ? "secondary" : "default"}
                        >
                          {isDisabled ? "Unavailable" : "Apply"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {coupons.length} coupons available • {filteredCoupons.length}{" "}
              shown
            </p>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
