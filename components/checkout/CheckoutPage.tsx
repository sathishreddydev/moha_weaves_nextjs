"use client";

import { useAuth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/formatters";
import { useAddressStore, useCartStore } from "@/lib/stores";
import { CartItemWithProduct, UserAddress } from "@/shared/types";
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
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import AddressList from "./AddressList";
import AddressForm from "../user/AddressForm";
import RazorpayPayment from "./RazorpayPayment";
import CouponInput from "./CouponInput";
import { useSocket } from "@/providers/socket-provider";

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
  const { socket } = useSocket();
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
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  // ── Pricing ──────────────────────────────────────────────────────────────
  const subtotal = calculateTotal();
  const isFreeShippingCoupon = appliedCoupon?.type === "free_shipping";
  const shipping = subtotal > 0 ? (subtotal >= 999 || isFreeShippingCoupon ? 0 : 50) : 0;
  const couponDiscount = appliedCoupon?.discountAmount || 0;
  const total = subtotal + shipping - couponDiscount;

  const totalSavings = items.reduce((sum, item) => {
    const orig = parseFloat(item.product.price || "0");
    // discountedPrice is already a number; fall back to orig if absent
    const disc = typeof item.product.discountedPrice === "number"
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

  // ── Validate stock on mount and on items change ───────────────────────────
  useEffect(() => {
    validateCartStock();
  }, [items, validateCartStock]);

  // ── Socket: re-fetch cart when admin updates a product ────────────────────
  useEffect(() => {
    if (!socket) return;
    socket.on("product_event", fetchCart);
    return () => { socket.off("product_event", fetchCart); };
  }, [socket, fetchCart]);

  // ── Socket: join product rooms + re-fetch when a matching product is purchased
  useEffect(() => {
    if (!socket || items.length === 0) return;
    items.forEach((item) => socket.emit("join_product_room", item.productId));
    const handleProductPurchased = ({ productId, variantId }: { productId: string; variantId: string | null }) => {
      const affected = items.some(
        (item) =>
          item.productId === productId &&
          (variantId === null || item.variantId === variantId)
      );
      if (affected) fetchCart();
    };
    socket.on("product_purchased", handleProductPurchased);
    return () => {
      items.forEach((item) => socket.emit("leave_product_room", item.productId));
      socket.off("product_purchased", handleProductPurchased);
    };
  }, [socket, items, fetchCart]);

  // ── Handlers ──────────────────────────────────────────────────────────────
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
      if (selectedAddressId === addressId) setSelectedAddressId("");
    } catch {
      toast.error("Failed to delete address");
    }
  };

  const handlePaymentSuccess = useCallback((newOrderId: string) => {
    clearCart();
    setOrderId(newOrderId);
    setOrderPlaced(true);
  }, [clearCart]);

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

  // ── Derived pay button state ──────────────────────────────────────────────
  const payDisabled = !selectedAddressId || items.length === 0 || hasStockIssues;

  // ── Price summary (plain JSX, not a nested component) ────────────────────
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
        <span className={shipping === 0 ? "text-green-600 font-medium" : "text-foreground font-medium"}>
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

  // ── Main checkout ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto">
      {/* Back */}
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
        {/* ── LEFT: Delivery address ── */}
        <div className="lg:col-span-3 space-y-6">
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
                onSelectAddress={setSelectedAddressId}
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

            {!selectedAddressId && !addressesLoading && addresses.length > 0 && (
              <p className="text-xs text-destructive mt-2">
                Please select a delivery address
              </p>
            )}
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
                          <img src={img} alt={item.product.name} className="w-full h-full object-cover" />
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
                Order Notes <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions for your order…"
                rows={2}
                className="w-full text-sm rounded-lg border border-input bg-background px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Price summary */}
            {priceSummary}
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
                    (typeof item.product.discountedPrice === "number"
                      ? item.product.discountedPrice
                      : parseFloat(item.product.price || "0")) * item.quantity;
                  return (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-14 h-14 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        {img ? (
                          <img src={img} alt={item.product.name} className="w-full h-full object-cover" />
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

            {/* Coupon */}
            <CouponInput
              orderAmount={subtotal}
              onCouponApplied={setAppliedCoupon}
              onCouponRemoved={() => setAppliedCoupon(null)}
              appliedCoupon={appliedCoupon}
            />

            <Separator />

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Order Notes <span className="text-muted-foreground font-normal">(optional)</span>
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

            {/* Price breakdown */}
            {priceSummary}

            {/* Pay button */}
            <RazorpayPayment
              amount={total}
              user={user}
              selectedAddress={addresses.find((a) => a.id === selectedAddressId)}
              notes={notes}
              couponId={appliedCoupon?.id}
              onSuccess={handlePaymentSuccess}
              onError={(e) => toast.error(e)}
              disabled={payDisabled}
            />

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

      {/* ── Mobile fixed pay bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t shadow-xl">
        <div className="px-4 pt-3 pb-5 space-y-2 max-w-lg mx-auto">
          {hasStockIssues && (
            <p className="text-xs text-red-600 text-center">
              Resolve stock issues in your cart to proceed
            </p>
          )}
          <RazorpayPayment
            amount={total}
            user={user}
            selectedAddress={addresses.find((a) => a.id === selectedAddressId)}
            notes={notes}
            couponId={appliedCoupon?.id}
            onSuccess={handlePaymentSuccess}
            onError={(e) => toast.error(e)}
            disabled={payDisabled}
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
