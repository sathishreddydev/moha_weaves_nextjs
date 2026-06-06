"use client";

import { useState } from "react";
import { StickyPanel } from "@/components/ui/StickyPanel";
import { formatPrice } from "@/lib/formatters";
import { CartItemWithProduct, UserAddress } from "@/shared/types";
import {
  AlertTriangle,
  ArrowLeft,
  ImageIcon,
  Loader2,
  MapPin,
  Tag,
  Trash2,
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
  onSelectAddress,
  onDeleteAddress,
  onSetDefault,
  onAddressSubmit,
  onSetEditingAddress,
  onCouponApplied,
  onCouponRemoved,
}: MobileCheckoutViewProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelView, setPanelView] = useState<"list" | "form" | "confirm-delete">("list");
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);

  const openAddressList = () => {
    setPanelView("list");
    setPanelOpen(true);
  };

  const openAddressForm = (addr?: UserAddress) => {
    onSetEditingAddress(addr || null);
    setPanelView("form");
    setPanelOpen(true);
  };

  const openDeleteConfirm = (addressId: string) => {
    setDeletingAddressId(addressId);
    setPanelView("confirm-delete");
  };

  const handleConfirmDelete = () => {
    if (deletingAddressId) {
      onDeleteAddress(deletingAddressId);
    }
    setDeletingAddressId(null);
    setPanelView("list");
  };

  const closePanel = () => {
    setPanelOpen(false);
    onSetEditingAddress(null);
    setDeletingAddressId(null);
  };

  const handleSelectAddress = (id: string) => {
    onSelectAddress(id);
    closePanel();
  };

  const handleAddressSubmit = async (data: AddressFormData) => {
    await onAddressSubmit(data);
    setPanelView("list");
  };

  // ── Order items (compact) ───────────────────────────────────────────────
  const OrderItemsList = () => (
    <div className="space-y-0">
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
          <div key={item.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
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
          <span className="text-green-600">Discount</span>
          <span className="text-green-600 font-medium tabular-nums">
            -{formatPrice(totalSavings)}
          </span>
        </div>
      )}
      <div className="flex justify-between">
        <span className="text-gray-500 flex items-center gap-1.5">
          <Truck className="h-3.5 w-3.5" />
          Shipping
        </span>
        <span className={`font-medium tabular-nums ${shipping === 0 ? "text-green-600" : "text-gray-900"}`}>
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
      <div className="flex justify-between items-center pt-1 border-t border-gray-200 mt-2">
        <span className="text-sm font-semibold text-gray-900">Total</span>
        <span className="text-lg font-semibold text-gray-900 tabular-nums">
          {formatPrice(total)}
        </span>
      </div>
      <p className="text-xs text-gray-500">
        Tax included. Shipping calculated at checkout.
      </p>
    </div>
  );

  // ── Main mobile checkout ────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-6">
        {/* Stock issue banner */}
        {hasStockIssues && (
          <div className="py-3 px-4 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            Some items are unavailable. Please update your cart before proceeding.
          </div>
        )}

        {/* Delivery section */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <MapPin className="h-4 w-4" />
            Delivery
          </h2>

          {addressesError && (
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg mb-3">
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
              onSelectAddress={handleSelectAddress}
              onChangeRequest={openAddressList}
              onAddNew={() => openAddressForm()}
              onEditAddress={(addr) => openAddressForm(addr)}
              onDeleteAddress={onDeleteAddress}
              onSetDefault={onSetDefault}
              updatingId={updating || undefined}
            />
          )}

          {!selectedAddressId && !addressesLoading && addresses.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Please select a delivery address
            </p>
          )}
        </section>


        {/* Order items */}
        <section className="bg-gray-50 rounded-lg py-4">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
            Order Summary ({items.length})
          </h2>
          <div className="divide-y divide-gray-100">
            <OrderItemsList />
          </div>

          <div className="border-t border-gray-200 mt-4 pt-4">
            <CouponInput
              orderAmount={subtotal}
              onCouponApplied={onCouponApplied}
              onCouponRemoved={onCouponRemoved}
              appliedCoupon={appliedCoupon}
            />
          </div>

          <div className="mt-4">
            <PriceSummary />
          </div>
        </section>

        {/* Spacer for fixed pay bar */}
        <div className="h-28" />
      </div>

      {/* Fixed pay bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="px-4 pt-3 pb-5 space-y-2 max-w-lg mx-auto">
          <RazorpayPayment {...razorpayProps} />
          {payBlockedReason && (
            <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              {payBlockedReason}
            </p>
          )}
        </div>
      </div>

      {/* Address StickyPanel */}
      <StickyPanel
        isOpen={panelOpen}
        onClose={closePanel}
        title={
          panelView === "form" ? (
            <span className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPanelView("list")}
                className="p-1 -ml-1 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Back to address list"
              >
                <ArrowLeft className="h-4 w-4 text-gray-500" />
              </button>
              {editingAddress ? "Edit Address" : "Add New Address"}
            </span>
          ) : panelView === "confirm-delete" ? (
            <span className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPanelView("list")}
                className="p-1 -ml-1 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Back to address list"
              >
                <ArrowLeft className="h-4 w-4 text-gray-500" />
              </button>
              Delete Address
            </span>
          ) : "Select Address"
        }
        icon={panelView === "list" ? <MapPin className="h-4 w-4" /> : undefined}
        isMobile
        footer={
          panelView === "confirm-delete" ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          ) : panelView === "form" ? (
            <div>
              <button
                type="submit"
                form="address-form"
                className="px-5 py-2 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingAddress ? "Update Address" : "Save Address"}
              </button>
            </div>
          ) : undefined
        }
      >
        {panelView === "list" ? (
          <AddressListView
            addresses={addresses}
            selectedAddressId={selectedAddressId}
            onSelectAddress={handleSelectAddress}
            onAddNew={() => openAddressForm()}
            onEditAddress={(addr) => openAddressForm(addr)}
            onDeleteAddress={openDeleteConfirm}
            onSetDefault={onSetDefault}
            updatingId={updating || undefined}
          />
        ) : panelView === "confirm-delete" ? (
          <div className="flex flex-col py-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-sm font-medium text-gray-900">Delete this address?</p>
            </div>
            {(() => {
              const addr = addresses.find((a) => a.id === deletingAddressId);
              if (!addr) return null;
              return (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-900">{addr.name}</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {addr.addressLine1 ? `${addr.addressLine1}, ` : ""}
                    {addr.locality}, {addr.city}
                    {addr.state ? `, ${addr.state}` : ""} — {addr.pincode}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{addr.phone}</p>
                </div>
              );
            })()}
            <p className="text-xs text-gray-500">
              This action cannot be undone.
            </p>
          </div>
        ) : (
          <AddressForm
            isOpen
            onClose={() => setPanelView("list")}
            onSubmit={handleAddressSubmit}
            editingAddress={editingAddress}
            isLoading={updating !== null}
            hideHeader
          />
        )}
      </StickyPanel>
    </>
  );
}
