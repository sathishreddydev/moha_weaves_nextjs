"use client";

import { Separator } from "@/components/ui/separator";
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

interface DesktopCheckoutViewProps {
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
  onGoToCart: () => void;
}

export default function DesktopCheckoutView({
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
  onGoToCart,
}: DesktopCheckoutViewProps) {
  // ── Address section content ─────────────────────────────────────────────
  const addressSectionContent = (() => {
    if (checkoutView === "address-form") {
      return (
        <AddressForm
          isOpen
          onClose={() => {
            onSetEditingAddress(null);
            onSetCheckoutView("address-select");
          }}
          onSubmit={onAddressSubmit}
          editingAddress={editingAddress}
          isLoading={updating !== null}
        />
      );
    }

    if (checkoutView === "address-select") {
      return (
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
      );
    }

    return (
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
    );
  })();

  // ── Order items ─────────────────────────────────────────────────────────
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
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                {img ? (
                  <Image
                    src={img}
                    alt={item.product.name}
                    fill
                    sizes="64px"
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

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-sm text-gray-400">
          <button
            onClick={onGoToCart}
            className="hover:text-gray-700 transition-colors"
          >
            Cart
          </button>
          <span>/</span>
          <span className="text-gray-900 font-medium">Checkout</span>
        </nav>
      </div>

      {/* Stock issue banner */}
      {hasStockIssues && (
        <div className="mb-6 px-4 py-3 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          Some items in your cart are out of stock. Please update your cart
          before proceeding.
        </div>
      )}

      <div className="grid grid-cols-12 gap-0">
        {/* LEFT COLUMN */}
        <div className="col-span-7 pr-12 border-r border-gray-200">
          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <MapPin className="h-4 w-4" />
                Delivery
              </h2>
              {addressSectionContent}
            </section>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="col-span-5 pl-12">
          <div
            className="sticky space-y-6"
            style={{
              top: "calc(var(--banner-height, 0px) + var(--header-height, 74px) + 1.5rem)",
            }}
          >
            <div>
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                Order Summary ({items.length})
              </h2>
              <div className="max-h-[280px] overflow-y-auto pr-1">
                <OrderItemsList />
              </div>
            </div>

            <Separator />

            <CouponInput
              orderAmount={subtotal}
              onCouponApplied={onCouponApplied}
              onCouponRemoved={onCouponRemoved}
              appliedCoupon={appliedCoupon}
            />

            <Separator />

            <PriceSummary />

            <div className="space-y-3">
              <RazorpayPayment {...razorpayProps} />
              {payBlockedReason && (
                <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
                  <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                  {payBlockedReason}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
