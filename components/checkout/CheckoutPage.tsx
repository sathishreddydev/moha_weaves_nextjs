"use client";

import { useAuth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/formatters";
import { calculatePricing } from "@/lib/pricing-utils";
import { useAddressStore, useCartStore } from "@/lib/stores";
import { UserAddress } from "@/shared/types";
import { CheckCircle2, Loader2, Package, Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { type AddressFormData } from "../user/AddressForm";
import { useCartProductPurchasedListener } from "@/hooks/useProductPurchasedListener";
import DesktopCheckoutView from "./DesktopCheckoutView";
import MobileCheckoutView from "./MobileCheckoutView";

// ─── Types ────────────────────────────────────────────────────────────────────
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
  const {
    items,
    clearCart,
    fetchCart,
    hasStockIssues,
    validateCartStock,
  } = useCartStore();
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
  const [orderTotal, setOrderTotal] = useState<number>(0);
  const [orderItemCount, setOrderItemCount] = useState<number>(0);
  const [checkoutView, setCheckoutView] = useState<CheckoutView>("checkout");
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [notes] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const addressLoadedRef = useRef(false);

  // ── Pricing ──────────────────────────────────────────────────────────────
  const couponForPricing = appliedCoupon
    ? {
        type: appliedCoupon.type as "percentage" | "fixed" | "free_shipping",
        value: appliedCoupon.value,
        isActive: true,
      }
    : null;
  const pricing = calculatePricing(items, couponForPricing);
  const shipping = pricing.shipping;
  const subtotal = pricing.originalSubtotal;
  const saleDiscount = pricing.saleDiscount;
  const couponDiscount = appliedCoupon?.discountAmount || 0;
  const total = pricing.subtotal + shipping - couponDiscount;
  const totalSavings = saleDiscount;
  const freeShippingGap = pricing.subtotal < 999 ? 999 - pricing.subtotal : 0;

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
    if (!addressesLoading) {
      addressLoadedRef.current = true;
    }
    const defaultAddress = getDefaultAddress();
    if (defaultAddress && !selectedAddressId) {
      setSelectedAddressId(defaultAddress.id);
    }
  }, [addresses, addressesLoading, selectedAddressId, getDefaultAddress]);

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
      setCheckoutView("address-select");
    } catch {
      toast.error("Failed to save address");
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    toast("Delete this address?", {
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            await deleteAddress(addressId);
            toast.success("Address deleted");
            if (selectedAddressId === addressId) setSelectedAddressId("");
          } catch {
            toast.error("Failed to delete address");
          }
        },
      },
      cancel: { label: "Cancel", onClick: () => {} },
    });
  };

  const handleSelectAddress = (id: string) => {
    setSelectedAddressId(id);
    setCheckoutView("checkout");
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(id);
      toast.success("Default address updated");
    } catch {
      toast.error("Failed to update default");
    }
  };

  const handlePaymentSuccess = useCallback(
    (newOrderId: string) => {
      setOrderTotal(total);
      setOrderItemCount(items.length);
      clearCart();
      setOrderId(newOrderId);
      setOrderPlaced(true);
    },
    [clearCart, total, items.length],
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // ── Order success ─────────────────────────────────────────────────────────
  if (orderPlaced && orderId) {
    return (
      <div className="flex flex-col items-center px-4 pt-16 pb-16 min-h-[60vh]">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-gray-900" />
          </div>

          <div>
            <h1 className="text-lg font-semibold text-gray-900 mb-2">
              Thank you for your order!
            </h1>
            <p className="text-sm text-gray-500">
              Your order has been confirmed. Order ID:
            </p>
            <Badge
              variant="secondary"
              className="mt-2 text-sm px-3 py-1 font-mono"
            >
              {orderId}
            </Badge>
          </div>

          <div className="bg-gray-50 rounded-lg px-5 py-4 space-y-2 text-left">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-gray-500">
                <Package className="h-4 w-4" />
                Items
              </span>
              <span className="font-medium text-gray-900">
                {orderItemCount}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-gray-500">
                <Tag className="h-4 w-4" />
                Total paid
              </span>
              <span className="font-semibold text-gray-900">
                {formatPrice(orderTotal)}
              </span>
            </div>
          </div>

          <div className="text-left space-y-2 bg-gray-50 rounded-lg px-5 py-4">
            <p className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
              What happens next
            </p>
            <ul className="text-sm text-gray-600 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-gray-900 mt-0.5">✓</span>
                Order confirmed — we&apos;re preparing your items
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">→</span>
                You&apos;ll get a shipping notification once dispatched
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">→</span>
                Estimated delivery: 3–7 business days
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button
              onClick={() => router.push("/my/orders")}
              className="w-full h-12"
            >
              View My Orders
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="w-full h-12"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Derived state ─────────────────────────────────────────────────────────
  const addressStillLoading = addressesLoading && !addressLoadedRef.current;
  const payDisabled =
    addressStillLoading ||
    !selectedAddressId ||
    items.length === 0 ||
    hasStockIssues;

  const payBlockedReason = (() => {
    if (hasStockIssues) return "Resolve stock issues in your cart to proceed";
    if (addressStillLoading) return "Loading your addresses…";
    if (!selectedAddressId) return "Please select a delivery address";
    return null;
  })();

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

  // ── Shared props for both views ───────────────────────────────────────────
  const sharedProps = {
    items,
    addresses,
    addressesLoading,
    addressesError,
    selectedAddressId,
    checkoutView,
    editingAddress,
    updating,
    hasStockIssues,
    subtotal,
    totalSavings,
    shipping,
    couponDiscount,
    total,
    freeShippingGap,
    appliedCoupon,
    payBlockedReason,
    razorpayProps,
    onSetCheckoutView: setCheckoutView,
    onSelectAddress: handleSelectAddress,
    onEditAddress: (addr: UserAddress) => setEditingAddress(addr),
    onDeleteAddress: handleDeleteAddress,
    onSetDefault: handleSetDefault,
    onAddressSubmit: handleAddressSubmit,
    onSetEditingAddress: setEditingAddress,
    onCouponApplied: setAppliedCoupon,
    onCouponRemoved: () => setAppliedCoupon(null),
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto">
      {/* Desktop */}
      <div className="hidden lg:block">
        <DesktopCheckoutView {...sharedProps} onGoToCart={() => router.push("/cart")} />
      </div>

      {/* Mobile */}
      <div className="lg:hidden">
        <MobileCheckoutView {...sharedProps} />
      </div>
    </div>
  );
}
