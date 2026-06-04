"use client";

import { Separator } from "@/components/ui/separator";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { formatPrice } from "@/lib/formatters";
import { CartItemWithProduct, UserAddress } from "@/shared/types";
import {
  AlertTriangle,
  ArrowLeft,
  ImageIcon,
  Loader2,
  MapPin,
  Tag,
  Truck,
} from "lucide-react";
import Image from "next/image";
import AddressSelector, { AddressListView } from "./AddressSelector";
import AddressForm, { type AddressFormData } from "../user/AddressForm";
import RazorpayPayment from "./RazorpayPayment";
import CouponInput from "./CouponInput";

interface AppliedCoupon {
  id: string;
  code: string;
  discountAmount: number;
  type: string;
  value: string;
}

interface MobileCheckoutViewProps {
  items: CartItemWithProduct[];
  addresses: UserAddress[];
  addressesLoading: boolean;
  addressesError: string | null;
  selectedAddressId: string;
  checkoutView: "checkout" | "address-select" | "address-form";
  editingAddress: UserAddress | null;
  updating: string | null;
  hasStockIssues: boolean;
  subtotal: number;
  totalSavings: number;
  shipping: number;
  couponDiscount: number;
  total: number;
  freeShippingGap: number;
  appliedCoupon: AppliedCoupon | null;
  payBlockedReason: string | null;
  razorpayProps: any;
  onSetCheckoutView: (view: "checkout" | "address-select" | "address-form") => void;
  onSelectAddress: (id: string) => void;
  onEditAddress: (addr: UserAddress) => void;
  onDeleteAddress: (id: string) => void;
  onSetDefault: (id: string) => Promise<void>;
  onAddressSubmit: (data: AddressFormData) => Promise<void>;
  onSetEditingAddress: (addr: UserAddress | null) => void;
  onCouponApplied: (coupon: AppliedCoupon) => void;
  onCouponRemoved: () => void;
}

export default function MobileCheckoutView({
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
  onSetCheckoutView,
  onSelectAddress,
  onEditAddress,
  onDeleteAddress,
  onSetDefault,
  onAddressSubmit,
  onSetEditingAddress,
  onCouponApplied,
  onCouponRemoved,
}: MobileCheckoutViewProps) {
  const isAddressFormOpen = checkoutView === "address-form";

  // When drawer closes, go back to the previous view
  const handleDrawerClose = () => {
    onSetEditingAddress(null);
    // If we came from address-select, go back there; otherwise go to checkout
    onSetCheckoutView("address-select");
  };

  // ── Order items (compact) ───────────────────────────────────────────────
  const OrderItemsList = () => (
    <div className="space-y-4">
      {items.map((item: CartItemWithProduct) => {
        const img = item.product.images?.[0] || item.product.imageUrl;
        const variant = item.product.variants?.find(
          (v) => v.id === item.variantId,
        );
        const orig = parseFloat(item.product.price || "0");
        const effectivePrice =
          typeof item.product.discountedPrice === "number"
            ? item.product.discountedPrice
            : orig;
        const hasDiscount = effectivePrice < orig;
        return (
          <div key={item.id} className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden">
                {img ? (
                  <Image
                    src={img}
                    alt={item.product.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-4 w-4 text-gray-300" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 line-clamp-1">
                {item.product.name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Qty: {item.quantity}
                {variant ? ` · Size: ${variant.size}` : ""}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900 tabular-nums">
                {formatPrice(effectivePrice * item.quantity)}
              </div>
              {hasDiscount && (
                <div className="text-xs text-gray-400 line-through tabular-nums">
                  {formatPrice(orig * item.quantity)}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── Price summary ───────────────────────────────────────────────────────
  const PriceSummary = () => (
    <div className="space-y-3 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-500">Subtotal</span>
        <span className="text-gray-900 font-medium tabular-nums">
          {formatPrice(subtotal)}
        </span>
      </div>
      {totalSavings > 0 && (
        <div className="flex justify-between">
          <span className="text-gray-500">Discount</span>
          <span className="text-gray-900 font-medium tabular-nums">
            -{formatPrice(totalSavings)}
          </span>
        </div>
      )}
      <div className="flex justify-between">
        <span className="text-gray-500 flex items-center gap-1.5">
          <Truck className="h-3.5 w-3.5" />
          Shipping
        </span>
        <span className="text-gray-900 font-medium tabular-nums">
          {shipping === 0 ? "Free" : formatPrice(shipping)}
        </span>
      </div>
      {couponDiscount > 0 && (
        <div className="flex justify-between">
          <span className="text-gray-500 flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5" />
            Coupon ({appliedCoupon?.code})
          </span>
          <span className="text-gray-900 font-medium tabular-nums">
            -{formatPrice(couponDiscount)}
          </span>
        </div>
      )}
      {shipping > 0 && freeShippingGap > 0 && (
        <p className="text-xs text-gray-400">
          Add {formatPrice(freeShippingGap)} more for free shipping
        </p>
      )}
      <Separator />
      <div className="flex justify-between items-center pt-1">
        <span className="text-sm font-semibold text-gray-900">Total</span>
        <span className="text-lg font-semibold text-gray-900 tabular-nums">
          {formatPrice(total)}
        </span>
      </div>
      <p className="text-xs text-gray-400">
        Tax included. Shipping calculated at checkout.
      </p>
    </div>
  );

  // ── Address Form Drawer (shared across all views) ───────────────────────
  const AddressFormDrawer = () => (
    <Drawer
      open={isAddressFormOpen}
      onOpenChange={(open) => {
        if (!open) handleDrawerClose();
      }}
      handleOnly
    >
      <DrawerContent className="max-h-[90dvh] flex flex-col">
        <DrawerHeader className="flex-shrink-0 border-b border-gray-100">
          <DrawerTitle>
            {editingAddress ? "Edit Address" : "Add New Address"}
          </DrawerTitle>
        </DrawerHeader>
        <div
          className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8 pt-2"
          // Prevent touch-move from propagating to the drawer (prevents dismiss while scrolling form)
          onTouchMove={(e) => e.stopPropagation()}
        >
          <AddressForm
            isOpen={isAddressFormOpen}
            onClose={handleDrawerClose}
            onSubmit={onAddressSubmit}
            editingAddress={editingAddress}
            isLoading={updating !== null}
            hideHeader
          />
        </div>
      </DrawerContent>
    </Drawer>
  );

  // ── Full-screen address list view ───────────────────────────────────────
  if (checkoutView === "address-select") {
    return (
      <div className="min-h-screen pb-8 px-4">
        {hasStockIssues && (
          <div className="mb-4 py-3 px-4 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg">
            Some items have stock issues. Resolve them in your cart first.
          </div>
        )}

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => onSetCheckoutView("checkout")}
            className="flex items-center gap-2 group"
            aria-label="Back to checkout"
          >
            <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
            <span className="text-sm text-gray-600 group-hover:text-gray-900">
              Back to checkout
            </span>
          </button>

          <h2 className="text-lg font-semibold text-gray-900">
            Select Delivery Address
          </h2>

          {addressesError && (
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg">
              {addressesError}
            </div>
          )}

          <AddressListView
            addresses={addresses}
            selectedAddressId={selectedAddressId}
            onSelectAddress={onSelectAddress}
            onAddNew={() => {
              onSetEditingAddress(null);
              onSetCheckoutView("address-form");
            }}
            onEditAddress={(addr) => {
              onSetEditingAddress(addr);
              onSetCheckoutView("address-form");
            }}
            onDeleteAddress={onDeleteAddress}
            onSetDefault={onSetDefault}
            updatingId={updating || undefined}
          />
        </div>

        {/* Drawer for address form */}
        <AddressFormDrawer />
      </div>
    );
  }

  // ── Main mobile checkout ────────────────────────────────────────────────
  return (
    <>
      <div className="px-4 space-y-6">
        {/* Stock issue banner */}
        {hasStockIssues && (
          <div className="py-3 px-4 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            Some items are out of stock. Update your cart before proceeding.
          </div>
        )}

        {/* Delivery section */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <MapPin className="h-4 w-4" />
            Delivery
          </h2>

          <div className="space-y-3">
            {addressesError && (
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg">
                {addressesError}
              </div>
            )}

            {addressesLoading ? (
              <div className="flex items-center gap-2 py-6 text-gray-400 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading addresses…
              </div>
            ) : (
              <AddressSelector
                addresses={addresses}
                selectedAddressId={selectedAddressId}
                onSelectAddress={onSelectAddress}
                onChangeRequest={() => onSetCheckoutView("address-select")}
                onAddNew={() => {
                  onSetEditingAddress(null);
                  onSetCheckoutView("address-form");
                }}
                onEditAddress={(addr) => {
                  onSetEditingAddress(addr);
                  onSetCheckoutView("address-form");
                }}
                onDeleteAddress={onDeleteAddress}
                onSetDefault={onSetDefault}
                updatingId={updating || undefined}
              />
            )}

            {!selectedAddressId && !addressesLoading && addresses.length > 0 && (
              <p className="text-xs text-gray-500">
                Please select a delivery address
              </p>
            )}
          </div>
        </section>

        <Separator />

        {/* Order items */}
        <section>
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
            Order Items ({items.length})
          </h2>
          <OrderItemsList />
        </section>

        <Separator />

        {/* Coupon */}
        <CouponInput
          orderAmount={subtotal}
          onCouponApplied={onCouponApplied}
          onCouponRemoved={onCouponRemoved}
          appliedCoupon={appliedCoupon}
        />

        <Separator />

        {/* Price summary */}
        <PriceSummary />

        {/* Spacer for fixed pay bar */}
        <div className="h-28" />
      </div>

      {/* Fixed pay bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="px-4 pt-3 pb-5 space-y-2 max-w-lg mx-auto">
          {payBlockedReason && (
            <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              {payBlockedReason}
            </p>
          )}
          <RazorpayPayment {...razorpayProps} />
        </div>
      </div>

      {/* Drawer for address form */}
      <AddressFormDrawer />
    </>
  );
}
