"use client";

import ReturnModal from "@/components/returns/ReturnModal";
import ReviewModal from "@/components/reviews/ReviewModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OrderItem } from "@/components/user/OrderItem";
import LiveChat from "@/components/user/LiveChat";
import ProfileSidebar from "@/components/user/ProfileSidebar";
import ShippingAddress from "@/components/user/shippingAddress";
import {
  OrderWithItems,
  ShippingAddress as ShippingAddressType,
} from "@/shared";
import {
  ArrowLeft,
  CreditCard,
  Download,
  MapPin,
  Package,
  ReceiptText,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CouponBadge } from "@/components/orders/CouponBadge";

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [orderId, setOrderId] = useState<string | null>(null);

  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    type: "return" | "exchange";
  } | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedReviewItem, setSelectedReviewItem] = useState<{
    orderItemId: string;
    productId: string;
  } | null>(null);
  const [helpChatOpen, setHelpChatOpen] = useState(false);

  useEffect(() => {
    const getOrderId = async () => {
      const resolvedParams = (await params) as { id: string };
      setOrderId(resolvedParams.id);
    };
    getOrderId();
  }, [params]);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/orders/${orderId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch order details");
      }

      const orderData = await response.json();
      setOrder(orderData);
      setLoading(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch order details",
      );
      setLoading(false);
    }
  };

  const downloadInvoice = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/invoice`);

      if (!response.ok) {
        throw new Error("Failed to generate invoice");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to download invoice:", err);
      alert("Failed to download invoice. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error || "Order not found"}</p>
              <Button onClick={() => router.back()} variant="outline">
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        {/* Mobile: Back Button + Content Only */}
        <div className="lg:hidden">
          <OrderDetailsContent
            order={order}
            onDownloadInvoice={downloadInvoice}
            onHelpClick={() => setHelpChatOpen(true)}
            onReturnClick={(itemId: string, type: "return" | "exchange") => {
              setSelectedItem({ id: itemId, type });
              setReturnModalOpen(true);
            }}
            onReviewClick={(orderItemId: string, productId: string) => {
              setSelectedReviewItem({ orderItemId, productId });
              setReviewModalOpen(true);
            }}
          />
        </div>

        {/* Desktop: Sidebar + Content */}
        <div className="hidden lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <ProfileSidebar />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <OrderDetailsContent
              order={order}
              onDownloadInvoice={downloadInvoice}
              onHelpClick={() => setHelpChatOpen(true)}
              onReturnClick={(itemId: string, type: "return" | "exchange") => {
                setSelectedItem({ id: itemId, type });
                setReturnModalOpen(true);
              }}
              onReviewClick={(orderItemId: string, productId: string) => {
                setSelectedReviewItem({ orderItemId, productId });
                setReviewModalOpen(true);
              }}
            />
          </div>
        </div>
      </div>

      {/* Return Modal */}
      {selectedItem && order && (
        <ReturnModal
          open={returnModalOpen}
          onOpenChange={setReturnModalOpen}
          order={order}
          orderItemId={selectedItem.id}
          type={selectedItem.type}
        />
      )}

      {/* Review Modal */}
      {selectedReviewItem && order && (
        <ReviewModal
          open={reviewModalOpen}
          onOpenChange={setReviewModalOpen}
          order={order}
          orderItemId={selectedReviewItem.orderItemId}
          productId={selectedReviewItem.productId}
        />
      )}

      {/* Contextual Help Chat */}
      {order && orderId && (
        <LiveChat
          isOpen={helpChatOpen}
          onOpenChange={setHelpChatOpen}
          onReturnClick={(itemId: string, type: "return" | "exchange") => {
            setSelectedItem({ id: itemId, type });
            setReturnModalOpen(true);
            setHelpChatOpen(false);
          }}
          orderContext={{
            orderId,
            order,
            productName:
              order.items.length === 1
                ? order.items[0].product.name
                : undefined,
          }}
        />
      )}
    </div>
  );
}

function OrderDetailsContent({
  order,
  onDownloadInvoice,
  onHelpClick,
  onReturnClick,
  onReviewClick,
}: {
  order: OrderWithItems;
  onDownloadInvoice: () => void;
  onHelpClick: () => void;
  onReturnClick: (itemId: string, type: "return" | "exchange") => void;
  onReviewClick: (orderItemId: string, productId: string) => void;
}) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-5 space-y-4 hover:border-slate-300 transition-colors bg-white">
        {/* Header */}
        <div className="flex justify-between items-center gap-2">
          <div
            onClick={() => router.push("/my/orders")}
            className="flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Order Summary
            </h2>
          </div>

          <div className="text-xs">
            <span className="mr-1">Need</span>
            <button
              onClick={onHelpClick}
              className="text-blue-800 underline hover:text-blue-600"
            >
              Help?
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Coupon Information */}
          <CouponBadge
            couponCode={order.couponCode}
            couponType={order.couponType}
            couponValue={order.couponValue}
            discountAmount={order.discountAmount}
            className="justify-center"
          />

          {/* Order Details */}
          <div className="flex justify-between gap-4">
            {/* Order Details */}
            <div className="flex items-center justify-between gap-4 sm:gap-8">
              {/* Order ID */}
              <div>
                <p className="text-xs text-gray-500">Order ID</p>
                <p className="font-medium text-xs"># {order.id}</p>
              </div>

              {/* Total Amount */}
              <div className="hidden sm:block">
                <p className="text-xs text-gray-500">Total Amount</p>
                <p className="font-medium text-xs">
                  ₹{parseFloat(order.finalAmount).toFixed(2)}
                </p>
              </div>

              {/* Shipping Address */}
              <div className="hidden sm:block">
                <div className="max-w-xs">
                  <p className="text-xs text-gray-500">Shipping Address</p>
                  <ShippingAddress address={order.shippingAddress || ""} />
                </div>
              </div>
            </div>

            {/* Button */}
            <div>
              <Button
                onClick={onDownloadInvoice}
                variant="outline"
                size="sm"
                className="rounded-3xl w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Invoice
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-slate-400" />
            Items in your order ({order.items.length})
          </h3>
        </div>
        {order.items.map((item) => (
          <OrderItem
            key={item.id}
            item={item}
            onReview={onReviewClick}
            onReturn={onReturnClick}
          />
        ))}
      </div>

      {/* Price Breakdown */}
      <Card className="p-4 sm:p-5 hover:border-slate-300 transition-colors bg-white">
        <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <ReceiptText className="w-5 h-5 text-slate-400" />
          Price Details
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">
              Subtotal ({order.items.length} items)
            </span>
            <span className="font-medium">
              ₹
              {order.items
                .reduce(
                  (sum, item) => sum + parseFloat(item.price) * item.quantity,
                  0,
                )
                .toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Discount</span>
            <span className="font-medium text-green-600">
              -₹{order?.discountAmount || 0}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Total Savings</span>
            <span className="font-medium text-green-600">
              ₹
              {(() => {
                // Calculate item-level savings (difference between original price and discounted price)
                const itemSavings = order.items.reduce((total, item) => {
                  if (item.productPrice && item.discountedPrice) {
                    return (
                      total +
                      (parseFloat(item.productPrice) -
                        parseFloat(item.discountedPrice)) *
                        item.quantity
                    );
                  }
                  return total;
                }, 0);

                // Add coupon discount if available
                const couponDiscount = parseFloat(order?.discountAmount || "0");

                return (itemSavings + couponDiscount).toFixed(2);
              })()}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Shipping</span>
            <span className="font-medium text-green-600">FREE</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Tax</span>
            <span className="font-medium">₹0.00</span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between text-sm font-bold">
              <span>Total Amount</span>
              <span>₹{parseFloat(order.finalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Shipping Details - Mobile Only */}
      <div className="block sm:hidden">
        <Card className="p-4 sm:p-5 hover:border-slate-300 transition-colors bg-white">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            Shipping Address
          </h3>
          <div className="text-xs whitespace-pre-line">
            {typeof order.shippingAddress === "object" &&
            order.shippingAddress !== null
              ? `${(order.shippingAddress as ShippingAddressType).name || ""}\n${(order.shippingAddress as ShippingAddressType).address || ""}\n${(order.shippingAddress as ShippingAddressType).locality || ""}, ${(order.shippingAddress as ShippingAddressType).city || ""}\n${(order.shippingAddress as ShippingAddressType).pincode || ""}\n${(order.shippingAddress as ShippingAddressType).phone || ""}`
                  .replace(/\n+/g, "\n")
                  .trim()
              : order.shippingAddress || ""}
          </div>
        </Card>
      </div>

      {/* Payment Details */}
      {order.paymentDetails?.available && (
        <Card className="p-4 sm:p-5 hover:border-slate-300 transition-colors bg-white">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-400" />
            Payment Details
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-[10px] font-bold text-blue-600 uppercase leading-none">
                    {order.paymentDetails.method?.slice(0, 2) || "PA"}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-900">
                    {order.paymentDetails.display}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    ID: {order.paymentDetails.razorpayPaymentId}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-green-600">Paid</p>
                <p className="text-[10px] text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
