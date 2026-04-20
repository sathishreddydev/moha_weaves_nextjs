"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/formatters";
import { Tag, Calendar, Percent, DollarSign, Truck, X, Search } from "lucide-react";

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

interface AllCouponsModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupons: Coupon[];
  onCouponSelect: (couponCode: string) => void;
  orderAmount: number;
}

export default function AllCouponsModal({
  isOpen,
  onClose,
  coupons,
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
        coupon.type.toLowerCase().includes(term)
    );
  }, [coupons, searchTerm]);

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
                {searchTerm ? "No coupons found matching your search" : "No coupons available"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCoupons.map((coupon, index) => (
                <Card key={coupon.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getCouponColor(coupon.type)}>
                            {getCouponIcon(coupon.type)}
                            <span className="ml-1">{getCouponDisplay(coupon)}</span>
                          </Badge>
                          {isExpiringSoon(coupon.validUntil) && (
                            <Badge variant="destructive" className="text-xs">
                              Expires Soon
                            </Badge>
                          )}
                          {index === 0 && !searchTerm && (
                            <Badge variant="secondary" className="text-xs">
                              🏆 Best Deal
                            </Badge>
                          )}
                        </div>
                        
                        <h4 className="font-medium text-gray-900 mb-1">{coupon.name}</h4>
                        
                        {coupon.description && (
                          <p className="text-sm text-gray-600 mb-2">{coupon.description}</p>
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
                        onClick={() => handleCouponSelect(coupon.code)}
                        className="ml-3 flex-shrink-0"
                      >
                        Apply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {coupons.length} coupons available • {filteredCoupons.length} shown
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
