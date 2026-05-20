"use client";

import { useAuth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/formatters";
import { calculatePricing } from "@/lib/pricing-utils";
import { useAddressStore, useCartStore } from "@/lib/stores";
import { CartItemWithProduct, UserAddress } from "@/shared/types";
import {
  ArrowLeft,
  CheckCircle2,
  ImageIcon,
  Loader2,
  MapPin,
  ShoppingBag,
  Tag,
  Truck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import AddressSelector, { AddressListView } from "./AddressSelector";
import AddressForm, { type AddressFormData } from "../user/AddressForm";
import RazorpayPayment from "./RazorpayPayment";
import CouponInput from "./CouponInput";
import { useCartProductPurchasedListener } from "@/hooks/useProductPurchasedListener";
import { Textarea } from "../ui/textarea";

// ─── View state ───────────────────────────────────────────────────────────────
// "checkout"       → normal checkout view (selected address card + order summary)
// "address-select" → address list (pick / change delivery address)
// "address-form"   → add or edit an address
type CheckoutView = "checkout" | "address-select" | "address-form";

interface AppliedCoupon {
  id: string;
  code: string;
  discountAmount: number;
  type: string;
  value: string;
}

export default function CheckoutPage() {
  const { user, status } = useAuth();
  const router = useRouter();
  const { items, calculateTotal, clearCart, fetchCart, hasStockIssues, validateCartStock } =
    useCartStore();
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
  const [checkoutView, setCheckoutView] = useState<CheckoutView>("checkout");
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  // ── Pricing ──────────────────────────────────────────────────────────────
  const subtotal = calculateTotal();
  const couponForPricing = appliedCoupon
    ? {
        type: appliedCoupon.type as "percentage" | "fixed" | "free_shipping",
        value: appliedCoupon.value,
        isActive: true,
      }
    : null;
  const pricing = calculatePricing(items, couponForPricing);
  const shipping = pricing.shipping;
  const couponDiscount = appliedCoupon?.discountAmount || 0;
  const total = subtotal + shipping - couponDiscount;

  const totalSavings = items.reduce((sum, item) => {
    const orig = parseFloat(item.product.price || "0");
    const disc =
      typeof item.product.discountedPrice === "number"
        ? item.product.discountedPrice
        : orig;
    return sum + (orig - disc) * item.quantity;
  }, 0);

  // ── Auth redirect ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?redirect=/checkout");
  }, [status, router]);

  // ── Empty cart redirect ───────────────────────────────────────────────────
  useEffect(() => {
    if (status === "authenticated" && !orderPlaced && items.length === 0) {
      router.push("/cart");
    }
  }, [status, items.length, orderPlaced, router]);

  // ── Fetch addresses ───────────────────────────────────────────────────────
  useEffect(() => {
    if (status === "authenticated") fetchAddresses();
  }, [status, fetchAddresses]);

  // ── Auto-select default address ───────────────────────────────────────────
  useEffect(() => {
    const defaultAddress = getDefaultAddress();
    if (defaultAddress && !selectedAddressId) {
      setSelectedAddressId(defaultAddress.id);
    }
  }, [addresses, selectedAddressId, getDefaultAddress]);

  // ── Validate stock ────────────────────────────────────────────────────────
  useEffect(() => {
    validateCartStock();
  }, [items, validateCartStock]);

  useCartProductPurchasedListener(items, fetchCart);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAddressSubmit = async (data: AddressFormData) => {
    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, data);
        toast.success("Address updated");
      } else {
        await createAddress(data);
        toast.success("Address added");
      }
      setEditingAddress(null);
      // After saving, go back to the address list so user can confirm selection
      setCheckoutView("address-select");
    } catch {
      toast.error("Failed to save address");
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await deleteAddress(addressId);
      toast.success("Address deleted");
      if (selectedAddressId === addressId) setSelectedAddressId("");
    } catch {
      toast.error("Failed to delete address");
    }
  };

  const handleSelectAddress = (id: string) => {
    setSelectedAddressId(id);
    // On mobile, selecting an address returns to checkout automatically
    setCheckoutView("checkout");
  };

  const handlePaymentSuccess = useCallback(
    (newOrderId: string) => {
      clearCart();
      setOrderId(newOrderId);
      setOrderPlaced(true);
    },
    [clearCart],
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Order success ─────────────────────────────────────────────────────────
  if (orderPlaced && orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-8 space-y-5">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground mb-1">Order Placed!</h1>
              <p className="text-sm text-muted-foreground">
                Thank you. Your order ID is:
              </p>
              <Badge variant="secondary" className="mt-2 text-sm px-3 py-1 font-mono">
                {orderId}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              You'll receive a confirmation shortly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button onClick={() => router.push("/my/orders")}>View Orders</Button>
              <Button variant="outline" onClick={() => router.push("/")}>
                Continue Shopping
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Derived state ─────────────────────────────────────────────────────────
  const payDisabled = !selectedAddressId || items.length === 0 || hasStockIssues;

  const razorpayProps = {
    amount: total,
    user,
    selectedAddress: addresses.find((a) => a.id === selectedAddressId),
    notes,
    couponId: appliedCoupon?.id,
    onSuccess: handlePaymentSuccess,
    onError: (e: string) => toast.error(e),
    disabled: payDisabled,
  };

  // ── Price summary ─────────────────────────────────────────────────────────
  const priceSummary = (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between text-muted-foreground">
        <span>Subtotal</span>
        <span className="text-foreground font-medium">{formatPrice(subtotal)}</span>
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
            shipping === 0 ? "text-green-600 font-medium" : "text-foreground font-medium"
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

  // ── Address section content (shared between mobile takeover + desktop left col) ──
  const addressSectionContent = (() => {
    // Address form (add / edit)
    if (checkoutView === "address-form") {
      return (
        <AddressForm
          isOpen
          onClose={() => {
            setEditingAddress(null);
            setCheckoutView("address-select");
          }}
          onSubmit={handleAddressSubmit}
          editingAddress={editingAddress}
          isLoading={updating !== null}
        />
      );
    }

    // Address list (change / select)
    if (checkoutView === "address-select") {
      return (
        <div className="space-y-4">
          {/* Back header */}
          <button
            type="button"
            onClick={() => setCheckoutView("checkout")}
            className="flex items-center gap-3 group"
            aria-label="Back to checkout"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-gray-800 transition-colors" />
            <h2 className="text-xl font-semibold text-gray-900">
              Select Delivery Address
            </h2>
          </button>

          {addressesError && (
            <div className="px-3 py-2 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
              {addressesError}
            </div>
          )}

          <AddressListView
            addresses={addresses}
            selectedAddressId={selectedAddressId}
            onSelectAddress={handleSelectAddress}
            onAddNew={() => {
              setEditingAddress(null);
              setCheckoutView("address-form");
            }}
            onEditAddress={(addr) => {
              setEditingAddress(addr);
              setCheckoutView("address-form");
            }}
            onDeleteAddress={handleDeleteAddress}
            onSetDefault={async (id) => {
              try {
                await setDefaultAddress(id);
                toast.success("Default address updated");
              } catch {
                toast.error("Failed to update default");
              }
            }}
            updatingId={updating || undefined}
          />
        </div>
      );
    }

    // Default: selected address card
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold text-foreground">Delivery Address</h2>
        </div>

        {addressesError && (
          <div className="px-3 py-2 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
            {addressesError}
          </div>
        )}

        {addressesLoading ? (
          <div className="flex items-center gap-2 py-8 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading addresses…
          </div>
        ) : (
          <AddressSelector
            addresses={addresses}
            selectedAddressId={selectedAddressId}
            onSelectAddress={handleSelectAddress}
            onChangeRequest={() => setCheckoutView("address-select")}
            onAddNew={() => {
              setEditingAddress(null);
              setCheckoutView("address-form");
            }}
            onEditAddress={(addr) => {
              setEditingAddress(addr);
              setCheckoutView("address-form");
            }}
            onDeleteAddress={handleDeleteAddress}
            onSetDefault={async (id) => {
              try {
                await setDefaultAddress(id);
                toast.success("Default address updated");
              } catch {
                toast.error("Failed to update default");
              }
            }}
            updatingId={updating || undefined}
          />
        )}

        {!selectedAddressId && !addressesLoading && addresses.length > 0 && (
          <p className="text-xs text-destructive">Please select a delivery address</p>
        )}
      </div>
    );
  })();

  // ── Mobile full-screen takeover (address-select or address-form) ──────────
  const isMobileAddressView =
    checkoutView === "address-select" || checkoutView === "address-form";

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto">
      {/* ── Mobile full-screen address takeover ── */}
      {isMobileAddressView && (
        <div className="lg:hidden min-h-screen pb-8">
          {/* Stock banner */}
          {hasStockIssues && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              Some items have stock issues. Resolve them in your cart first.
            </div>
          )}
          {addressSectionContent}
        </div>
      )}

      {/* ── Normal checkout layout (mobile: hidden when in address view) ── */}
      <div className={isMobileAddressView ? "hidden lg:block" : ""}>
        {/* Back to cart */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/cart")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Cart
          </button>
        </div>

        {/* Stock issue banner */}
        {hasStockIssues && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            Some items in your cart are out of stock or have insufficient quantity.
            Please go back to your cart and remove or update them before proceeding.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* ── LEFT: Address section ── */}
          <div className="lg:col-span-3 space-y-6">
            {/* Desktop: inline view swap */}
            <div className="hidden lg:block">
              {addressSectionContent}
            </div>

            {/* Mobile: only show the selected-address card (list/form are in takeover above) */}
            <div className="lg:hidden">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-base font-semibold text-foreground">Delivery Address</h2>
                </div>

                {addressesError && (
                  <div className="px-3 py-2 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
                    {addressesError}
                  </div>
                )}

                {addressesLoading ? (
                  <div className="flex items-center gap-2 py-8 text-muted-foreground text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading addresses…
                  </div>
                ) : (
                  <AddressSelector
                    addresses={addresses}
                    selectedAddressId={selectedAddressId}
                    onSelectAddress={handleSelectAddress}
                    onChangeRequest={() => setCheckoutView("address-select")}
                    onAddNew={() => {
                      setEditingAddress(null);
                      setCheckoutView("address-form");
                    }}
                    onEditAddress={(addr) => {
                      setEditingAddress(addr);
                      setCheckoutView("address-form");
                    }}
                    onDeleteAddress={handleDeleteAddress}
                    onSetDefault={async (id) => {
                      try {
                        await setDefaultAddress(id);
                        toast.success("Default address updated");
                      } catch {
                        toast.error("Failed to update default");
                      }
                    }}
                    updatingId={updating || undefined}
                  />
                )}

                {!selectedAddressId && !addressesLoading && addresses.length > 0 && (
                  <p className="text-xs text-destructive">Please select a delivery address</p>
                )}
              </div>
            </div>

            {/* Mobile: order items + coupon + notes */}
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
                      (typeof item.product.discountedPrice === "number"
                        ? item.product.discountedPrice
                        : parseFloat(item.product.price || "0")) * item.quantity;
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
                            {variant ? `${variant.size} · ` : ""}Qty {item.quantity}
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

              {/* Notes */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  Order Notes{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions for your order…"
                  rows={2}
                  inputMode="text"
                />
              </div>

              {/* Price summary */}
              {priceSummary}
            </div>

            {/* Mobile spacer for fixed pay bar */}
            <div className="h-24 lg:hidden" />
          </div>

          {/* ── RIGHT: Order summary (desktop sticky) ── */}
          <div className="hidden lg:block lg:col-span-2">
            <div className="sticky space-y-5" style={{ top: "calc(var(--banner-height, 0px) + var(--header-height, 74px) + 1.5rem)" }}>
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
                      (typeof item.product.discountedPrice === "number"
                        ? item.product.discountedPrice
                        : parseFloat(item.product.price || "0")) * item.quantity;
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
                            {variant ? `${variant.size} · ` : ""}Qty {item.quantity}
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

              <CouponInput
                orderAmount={subtotal}
                onCouponApplied={setAppliedCoupon}
                onCouponRemoved={() => setAppliedCoupon(null)}
                appliedCoupon={appliedCoupon}
              />

              <Separator />

              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  Order Notes{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions for your order…"
                  rows={2}
                  className="w-full text-sm rounded-lg border border-input bg-background px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <Separator />

              {priceSummary}

              <RazorpayPayment {...razorpayProps} />

              {hasStockIssues && (
                <p className="text-xs text-red-600 text-center -mt-2">
                  Resolve stock issues in your cart to proceed
                </p>
              )}

              <p className="text-xs text-muted-foreground text-center">
                By placing this order you agree to our{" "}
                <span className="underline cursor-pointer">Terms</span> &{" "}
                <span className="underline cursor-pointer">Privacy Policy</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile fixed pay bar — hidden during address views ── */}
      {!isMobileAddressView && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t shadow-xl">
          <div className="px-4 pt-3 pb-5 space-y-2 max-w-lg mx-auto">
            {hasStockIssues && (
              <p className="text-xs text-red-600 text-center">
                Resolve stock issues in your cart to proceed
              </p>
            )}
            <RazorpayPayment {...razorpayProps} />
          </div>
        </div>
      )}
    </div>
  );
}
