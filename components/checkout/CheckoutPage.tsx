"use client";

import { useAuth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/formatters";
import { useAddressStore, useCartStore } from "@/lib/stores";
import { CartItemWithProduct, UserAddress } from "@/shared/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Separator } from "@radix-ui/react-separator";
import {
  ImageIcon,
  Loader2,
  MapPin,
  Plus,
  ShoppingBag,
  Tag,
  Truck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "../ui/badge";
import AddressList from "./AddressList";
import AddressForm from "../user/AddressForm";
import RazorpayPayment from "./RazorpayPayment";
import CouponInput from "./CouponInput";

const checkoutSchema = z.object({
  addressId: z.string().min(1, "Please select an address"),
  notes: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const { user, status } = useAuth();
  const router = useRouter();
  const { items, calculateTotal, clearCart } = useCartStore();
  const {
    addresses,
    loading: addressesLoading,
    error: addressesError,
    updating,
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getDefaultAddress,
  } = useAddressStore();

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(
    null,
  );
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    code: string;
    discountAmount: number;
    type: string;
    value: string;
  } | null>(null);
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      addressId: "",
      notes: "",
    },
  });

  const subtotal = calculateTotal();
  const shipping = subtotal > 0 ? (subtotal >= 999 ? 0 : 50) : 0;
  const couponDiscount = appliedCoupon?.discountAmount || 0;
  
  // Calculate total savings (original price - discounted price)
  const totalDiscountedPrice = items.reduce((sum, item) => {
    const originalPrice = parseFloat(item.product.price || "0");
    const discountedPrice = item.product.discountedPrice || originalPrice;
    const savings = (originalPrice - discountedPrice) * item.quantity;
    return sum + savings;
  }, 0);
  
  const total = subtotal + shipping - couponDiscount;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?redirect=/checkout");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchAddresses();
    }
  }, [status, fetchAddresses]);

  // Auto-select default address
  useEffect(() => {
    const defaultAddress = getDefaultAddress();
    if (defaultAddress && !selectedAddressId) {
      setSelectedAddressId(defaultAddress.id);
      form.setValue("addressId", defaultAddress.id);
    }
  }, [addresses, selectedAddressId, getDefaultAddress, form]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleAddressSubmit = async (data: any) => {
    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, data);
        toast.success("Address updated successfully");
      } else {
        await createAddress(data);
        toast.success("Address added successfully");
      }
      setEditingAddress(null);
    } catch (error) {
      toast.error("Failed to save address");
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      try {
        await deleteAddress(addressId);
        toast.success("Address deleted successfully");
        if (selectedAddressId === addressId) {
          setSelectedAddressId("");
          form.setValue("addressId", "");
        }
      } catch (error) {
        toast.error("Failed to delete address");
      }
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      await setDefaultAddress(addressId);
      toast.success("Default address updated");
    } catch (error) {
      toast.error("Failed to set default address");
    }
  };

  const handleEditAddress = (address: UserAddress) => {
    setEditingAddress(address);
    setShowAddressModal(true);
  };

  const handleSelectAddress = (addressId: string) => {
    setSelectedAddressId(addressId);
    form.setValue("addressId", addressId);
  };

  const onSubmit = async (data: CheckoutFormData) => {
    // Payment will be handled by Razorpay component
  };

  const handlePaymentSuccess = (orderId: string) => {
    clearCart();
    setOrderId(orderId);
    setOrderPlaced(true);
  };

  const handlePaymentError = (error: string) => {
    toast.error(error);
  };

  const handleCouponApplied = (coupon: {
    id: string;
    code: string;
    discountAmount: number;
    type: string;
    value: string;
  }) => {
    setAppliedCoupon(coupon);
  };

  const handleCouponRemoved = () => {
    setAppliedCoupon(null);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (orderPlaced && orderId) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center py-12">
            <CardContent className="space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Order Placed Successfully!
                </h1>
                <p className="text-gray-600">
                  Thank you for your order. Your order ID is:
                </p>
                <Badge variant="secondary" className="mt-2 text-lg px-4 py-2">
                  {orderId}
                </Badge>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  You will receive an order confirmation email shortly.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => router.push("/orders")}
                    className="w-full sm:w-auto"
                  >
                    View Orders
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/")}
                    className="w-full sm:w-auto"
                  >
                    Continue Shopping
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
            Checkout
          </h1>
          <p className="text-sm text-gray-600">Complete your order details</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Shipping & Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Shipping Address
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingAddress(null);
                      setShowAddressModal(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Address
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {addressesError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                    {addressesError}
                  </div>
                )}

                {addressesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading addresses...</span>
                  </div>
                ) : (
                  <AddressList
                    addresses={addresses}
                    selectedAddressId={selectedAddressId}
                    onSelectAddress={handleSelectAddress}
                    onEditAddress={handleEditAddress}
                    onDeleteAddress={handleDeleteAddress}
                    onSetDefault={handleSetDefaultAddress}
                    updatingId={updating || undefined}
                  />
                )}

                {form.formState.errors.addressId && (
                  <p className="text-sm text-red-600 mt-2">
                    {form.formState.errors.addressId.message}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Notes (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  {...form.register("notes")}
                  className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Special instructions for delivery..."
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary (Desktop) */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {items.map((item: CartItemWithProduct) => {
                      const variant = item.product.variants?.find(
                        (v) => v.id === item.variantId,
                      );
                      return (
                        <div key={item.id} className="flex gap-3">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {item.product?.imageUrl && (
                              <img
                                src={item.product.imageUrl}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">
                              {item.product?.name}
                            </h4>
                            {variant && (
                              <p className="text-xs text-gray-500">
                                Size: {variant.size}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              Qty: {item.quantity}
                            </p>
                            <p className="text-sm font-medium">
                              {formatPrice(
                                (item.product?.discountedPrice ||
                                  parseFloat(item.product?.price || "0")) *
                                  item.quantity,
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Separator />

                  {/* Coupon Input */}
                  <CouponInput
                    orderAmount={subtotal}
                    onCouponApplied={handleCouponApplied}
                    onCouponRemoved={handleCouponRemoved}
                    appliedCoupon={appliedCoupon}
                  />

                  {/* Price Breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    {totalDiscountedPrice > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Total Savings</span>
                        <span className="text-green-600">
                          -{formatPrice(totalDiscountedPrice)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Truck className="h-4 w-4" />
                        Shipping
                      </span>
                      <span>
                        {shipping === 0 ? "FREE" : formatPrice(shipping)}
                      </span>
                    </div>
                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-1 text-green-600">
                          <Tag className="h-4 w-4" />
                          Coupon Discount
                        </span>
                        <span className="text-green-600">
                          -{formatPrice(couponDiscount)}
                        </span>
                      </div>
                    )}
                    {shipping > 0 && (
                      <p className="text-xs text-green-600">
                        Add {formatPrice(999 - subtotal)} more for FREE shipping
                      </p>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>

                  {/* Desktop Payment Button */}
                  <RazorpayPayment
                    amount={total}
                    user={user}
                    selectedAddress={
                      addresses.find((addr) => addr.id === selectedAddressId) ||
                      undefined
                    }
                    notes={form.getValues("notes")}
                    couponId={appliedCoupon?.id}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    disabled={!selectedAddressId || items.length === 0}
                  />

                  <p className="text-xs text-gray-500 text-center">
                    By placing this order, you agree to our Terms of Service and
                    Privacy Policy
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Mobile Cart Items and Coupon Section */}
        {isMobile && (
          <div className="lg:hidden space-y-4 mb-4">
            {/* Cart Items */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Order Items ({items.length})
                </h3>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      {/* Product Image */}
                      <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                        {item.product.images?.[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm line-clamp-2">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Qty: {item.quantity}
                        </p>
                        </div>

                      {/* Price */}
                      <div className="text-right">
                        {item.product.discountedPrice ? (
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-medium text-red-600">
                              {formatPrice(item.product.discountedPrice * item.quantity)}
                            </span>
                            <span className="text-xs text-gray-400 line-through">
                              {formatPrice(parseFloat(item.product.price || "0") * item.quantity)}
                            </span>
                          </div>
                        ) : (
                          <p className="text-sm font-medium">
                            {formatPrice(parseFloat(item.product.price || "0") * item.quantity)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Coupon Input */}
            <CouponInput
              orderAmount={subtotal}
              onCouponApplied={handleCouponApplied}
              onCouponRemoved={handleCouponRemoved}
              appliedCoupon={appliedCoupon}
            />
          </div>
        )}

        {/* Mobile Sticky Payment Section */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg lg:hidden z-40">
            <div className="p-4">
              {/* Toggle Summary */}
              <button
                onClick={() => setShowMobileSummary(!showMobileSummary)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-3"
              >
                <span className="font-medium text-gray-900">Order Summary</span>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-lg">
                    {formatPrice(total)}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-600 transform transition-transform ${
                      showMobileSummary ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {/* Expanded Summary */}
              {showMobileSummary && (
                <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {totalDiscountedPrice > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Total Savings</span>
                      <span>-{formatPrice(totalDiscountedPrice)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Truck className="h-4 w-4" />
                      Shipping
                    </span>
                    <span>
                      {shipping === 0 ? "FREE" : formatPrice(shipping)}
                    </span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="flex items-center gap-1">
                        <Tag className="h-4 w-4" />
                        Coupon Discount
                      </span>
                      <span>-{formatPrice(couponDiscount)}</span>
                    </div>
                  )}
                  {shipping > 0 && (
                    <p className="text-xs text-green-600">
                      Add {formatPrice(999 - subtotal)} more for FREE shipping
                    </p>
                  )}
                  <Separator />
                </div>
              )}

              {/* Mobile Payment Button */}
              <RazorpayPayment
                amount={total}
                user={user}
                selectedAddress={
                  addresses.find((addr) => addr.id === selectedAddressId) ||
                  undefined
                }
                notes={form.getValues("notes")}
                couponId={appliedCoupon?.id}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                disabled={!selectedAddressId || items.length === 0}
              />

              <p className="text-xs text-gray-500 text-center mt-2">
                By placing this order, you agree to our Terms of Service and
                Privacy Policy
              </p>
            </div>
          </div>
        )}

        {/* Spacer for mobile sticky bottom */}
        {isMobile && <div className="h-32 lg:hidden"></div>}

        {/* Address Form */}
        <AddressForm
          isOpen={showAddressModal}
          onClose={() => {
            setShowAddressModal(false);
            setEditingAddress(null);
          }}
          onSubmit={handleAddressSubmit}
          editingAddress={editingAddress}
          isLoading={updating !== null}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
}
