"use client";

import { useAuth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/formatters";
import { useAddressStore, useCartStore } from "@/lib/stores";
import { CartItemWithProduct, UserAddress } from "@/shared/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  CheckCircle2,
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

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { addressId: "", notes: "" },
  });

  const subtotal = calculateTotal();
  const isFreeShippingCoupon = appliedCoupon?.type === "free_shipping";
  const shipping =
    subtotal > 0 ? (subtotal >= 999 || isFreeShippingCoupon ? 0 : 50) : 0;
  const couponDiscount = appliedCoupon?.discountAmount || 0;
  const totalSavings = items.reduce((sum, item) => {
    const orig = parseFloat(item.product.price || "0");
    const disc = item.product.discountedPrice || orig;
    return sum + (orig - disc) * item.quantity;
  }, 0);
  const total = subtotal + shipping - couponDiscount;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?redirect=/checkout");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") fetchAddresses();
  }, [status, fetchAddresses]);

  useEffect(() => {
    const defaultAddress = getDefaultAddress();
    if (defaultAddress && !selectedAddressId) {
      setSelectedAddressId(defaultAddress.id);
      form.setValue("addressId", defaultAddress.id);
    }
  }, [addresses, selectedAddressId, getDefaultAddress, form]);

  const handleAddressSubmit = async (data: any) => {
    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, data);
        toast.success("Address updated");
      } else {
        await createAddress(data);
        toast.success("Address added");
      }
      setEditingAddress(null);
    } catch {
      toast.error("Failed to save address");
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await deleteAddress(addressId);
      toast.success("Address deleted");
      if (selectedAddressId === addressId) {
        setSelectedAddressId("");
        form.setValue("addressId", "");
      }
    } catch {
      toast.error("Failed to delete address");
    }
  };

  const handlePaymentSuccess = (newOrderId: string) => {
    clearCart();
    setOrderId(newOrderId);
    setOrderPlaced(true);
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Order success ────────────────────────────────────────────────────────
  if (orderPlaced && orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-8 space-y-5">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground mb-1">
                Order Placed!
              </h1>
              <p className="text-sm text-muted-foreground">
                Thank you. Your order ID is:
              </p>
              <Badge
                variant="secondary"
                className="mt-2 text-sm px-3 py-1 font-mono"
              >
                {orderId}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              You'll receive a confirmation shortly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button onClick={() => router.push("/my/orders")}>
                View Orders
              </Button>
              <Button variant="outline" onClick={() => router.push("/")}>
                Continue Shopping
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Price summary helper (shared between desktop + mobile) ───────────────
  const PriceSummary = () => (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between text-muted-foreground">
        <span>Subtotal</span>
        <span className="text-foreground font-medium">
          {formatPrice(subtotal)}
        </span>
      </div>
      {totalSavings > 0 && (
        <div className="flex justify-between text-green-600">
          <span>Item savings</span>
          <span>-{formatPrice(totalSavings)}</span>
        </div>
      )}
      <div className="flex justify-between text-muted-foreground">
        <span className="flex items-center gap-1">
          <Truck className="h-3.5 w-3.5" />
          Shipping
        </span>
        <span
          className={
            shipping === 0
              ? "text-green-600 font-medium"
              : "text-foreground font-medium"
          }
        >
          {shipping === 0 ? "FREE" : formatPrice(shipping)}
        </span>
      </div>
      {couponDiscount > 0 && (
        <div className="flex justify-between text-green-600">
          <span className="flex items-center gap-1">
            <Tag className="h-3.5 w-3.5" />
            Coupon
          </span>
          <span>-{formatPrice(couponDiscount)}</span>
        </div>
      )}
      {shipping > 0 && (
        <p className="text-xs text-green-600">
          Add {formatPrice(999 - subtotal)} more for free shipping
        </p>
      )}
      <Separator className="my-1" />
      <div className="flex justify-between font-bold text-base text-foreground">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>
    </div>
  );

  // ── Main checkout ────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto">
      {/* Back + title */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/cart")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Cart
        </button>
        {/* <h1 className="text-2xl font-bold text-foreground">Checkout</h1> */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* ── LEFT: Delivery address ── */}
        <div className="lg:col-span-3 space-y-6">
          {/* Section header — no Card */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Delivery Address
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingAddress(null);
                  setShowAddressModal(true);
                }}
                className="h-8 text-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Add New
              </Button>
            </div>

            {addressesError && (
              <div className="mb-3 px-3 py-2 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
                {addressesError}
              </div>
            )}

            {addressesLoading ? (
              <div className="flex items-center gap-2 py-8 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading addresses…
              </div>
            ) : (
              <AddressList
                addresses={addresses}
                selectedAddressId={selectedAddressId}
                onSelectAddress={(id) => {
                  setSelectedAddressId(id);
                  form.setValue("addressId", id);
                }}
                onEditAddress={(addr) => {
                  setEditingAddress(addr);
                  setShowAddressModal(true);
                }}
                onDeleteAddress={handleDeleteAddress}
                onSetDefault={async (id) => {
                  try {
                    await setDefaultAddress(id);
                    toast.success("Default address updated");
                  } catch {
                    toast.error("Failed");
                  }
                }}
                updatingId={updating || undefined}
              />
            )}

            {form.formState.errors.addressId && (
              <p className="text-xs text-destructive mt-2">
                {form.formState.errors.addressId.message}
              </p>
            )}
          </div>

          {/* Mobile: order items + coupon (shown above sticky bar) */}
          <div className="lg:hidden space-y-4">
            <Separator />

            {/* Items */}
            <div>
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                Order Items ({items.length})
              </h2>
              <div className="space-y-3">
                {items.map((item) => {
                  const img = item.product.images?.[0] || item.product.imageUrl;
                  const variant = item.product.variants?.find(
                    (v: any) => v.id === item.variantId,
                  );
                  const linePrice =
                    (item.product.discountedPrice ||
                      parseFloat(item.product.price || "0")) * item.quantity;
                  return (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-14 h-14 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        {img ? (
                          <img
                            src={img}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-1">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {variant ? `${variant.size} · ` : ""}Qty{" "}
                          {item.quantity}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-foreground tabular-nums">
                        {formatPrice(linePrice)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Coupon */}
            <CouponInput
              orderAmount={subtotal}
              onCouponApplied={setAppliedCoupon}
              onCouponRemoved={() => setAppliedCoupon(null)}
              appliedCoupon={appliedCoupon}
            />

            {/* Price summary */}
            <PriceSummary />
          </div>

          {/* Mobile spacer for fixed bar */}
          <div className="h-24 lg:hidden" />
        </div>

        {/* ── RIGHT: Order summary (desktop sticky) ── */}
        <div className="hidden lg:block lg:col-span-2">
          <div className="sticky top-6 space-y-5">
            {/* Items */}
            <div>
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                Order Summary
              </h2>
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {items.map((item: CartItemWithProduct) => {
                  const img = item.product.images?.[0] || item.product.imageUrl;
                  const variant = item.product.variants?.find(
                    (v) => v.id === item.variantId,
                  );
                  const linePrice =
                    (item.product.discountedPrice ||
                      parseFloat(item.product.price || "0")) * item.quantity;
                  return (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-14 h-14 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        {img ? (
                          <img
                            src={img}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-1">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {variant ? `${variant.size} · ` : ""}Qty{" "}
                          {item.quantity}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-foreground tabular-nums">
                        {formatPrice(linePrice)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Coupon */}
            <CouponInput
              orderAmount={subtotal}
              onCouponApplied={setAppliedCoupon}
              onCouponRemoved={() => setAppliedCoupon(null)}
              appliedCoupon={appliedCoupon}
            />

            <Separator />

            {/* Price breakdown */}
            <PriceSummary />

            {/* Pay button */}
            <RazorpayPayment
              amount={total}
              user={user}
              selectedAddress={addresses.find(
                (a) => a.id === selectedAddressId,
              )}
              notes={form.getValues("notes")}
              couponId={appliedCoupon?.id}
              onSuccess={handlePaymentSuccess}
              onError={(e) => toast.error(e)}
              disabled={!selectedAddressId || items.length === 0}
            />

            <p className="text-xs text-muted-foreground text-center">
              By placing this order you agree to our{" "}
              <span className="underline cursor-pointer">Terms</span> &{" "}
              <span className="underline cursor-pointer">Privacy Policy</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Mobile fixed pay bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t shadow-xl">
        <div className="px-4 pt-3 pb-5 space-y-2 max-w-lg mx-auto">
          <RazorpayPayment
            amount={total}
            user={user}
            selectedAddress={addresses.find((a) => a.id === selectedAddressId)}
            notes={form.getValues("notes")}
            couponId={appliedCoupon?.id}
            onSuccess={handlePaymentSuccess}
            onError={(e) => toast.error(e)}
            disabled={!selectedAddressId || items.length === 0}
          />
        </div>
      </div>

      {/* Address form modal */}
      <AddressForm
        isOpen={showAddressModal}
        onClose={() => {
          setShowAddressModal(false);
          setEditingAddress(null);
        }}
        onSubmit={handleAddressSubmit}
        editingAddress={editingAddress}
        isLoading={updating !== null}
        isMobile={false}
      />
    </div>
  );
}
