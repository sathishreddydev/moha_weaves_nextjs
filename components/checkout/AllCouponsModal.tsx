"use client";

import { useState, useMemo, useEffect } from "react";
import { StickyPanel } from "@/components/ui/StickyPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tag, Search } from "lucide-react";
import {
  Coupon,
  getCouponDisplay,
  getCouponIcon,
  getCouponColor,
  isExpiringSoon,
  getCouponStatus,
  getCouponStatusBadge,
} from "./couponUtils";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AllCouponsModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupons: Coupon[];
  availableCoupons: Coupon[];
  usedCoupons: Coupon[];
  onCouponSelect: (couponCode: string) => void;
  orderAmount: number;
}

// ─── Component ─────────────────────────────────────────────────────────────────

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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Reset search when panel closes
  useEffect(() => {
    if (!isOpen) setSearchTerm("");
  }, [isOpen]);

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

  // ── Footer (sticky) ─────────────────────────────────────────────────────────

  const footer = (
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-500">
        {coupons.length} coupons &bull; {filteredCoupons.length} shown
      </p>
      <Button variant="outline" size="sm" onClick={onClose}>
        Close
      </Button>
    </div>
  );

  // ── Body (scrollable) ───────────────────────────────────────────────────────

  const body = (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by name, code, or type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        {filteredCoupons.length !== coupons.length && (
          <p className="text-xs text-gray-500 mt-1.5">
            Found {filteredCoupons.length} of {coupons.length} coupons
          </p>
        )}
      </div>

      {/* Coupon list */}
      {filteredCoupons.length === 0 ? (
        <div className="text-center py-10">
          <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            {searchTerm
              ? "No coupons found matching your search"
              : "No coupons available"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
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
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
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

                      <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
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
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <StickyPanel
      isOpen={isOpen}
      onClose={onClose}
      title={`All Coupons (${coupons.length})`}
      icon={<Tag className="h-4 w-4" />}
      footer={footer}
      isMobile={isMobile}
      maxHeight="90vh"
    >
      {body}
    </StickyPanel>
  );
}
