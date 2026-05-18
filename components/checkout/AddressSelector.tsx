"use client";

import { useState } from "react";
import { UserAddress } from "@/shared";
import { Button } from "@/components/ui/button";
import { StickyPanel } from "@/components/ui/StickyPanel";
import { ThreeDotsMenu } from "@/components/ui/three-dots-menu";
import {
  MapPin,
  Plus,
  Check,
  Loader2,
  ChevronRight,
  Briefcase,
  Home,
  Building2,
  Edit2,
  Trash2,
  Share2,
  Star,
} from "lucide-react";

// ─── Address type icon ────────────────────────────────────────────────────────

function AddressTypeIcon({ type }: { type?: string }) {
  if (type === "work") return <Briefcase className="h-3 w-3" />;
  if (type === "other") return <Building2 className="h-3 w-3" />;
  return <Home className="h-3 w-3" />;
}

// ─── Single address row (used inside the picker sheet) ───────────────────────

function AddressRow({
  address,
  isSelected,
  isUpdating,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  address: UserAddress;
  isSelected: boolean;
  isUpdating: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  const handleShare = () => {
    const text = `${address.name}\n${address.phone}\n${address.addressLine1 ? address.addressLine1 + ", " : ""}${address.locality}, ${address.city} - ${address.pincode}`;
    if (navigator.share) {
      navigator.share({ title: "Address", text });
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <div
      onClick={onSelect}
      className={[
        "relative flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all",
        isSelected
          ? "border-gray-900 bg-gray-50"
          : "border-gray-200 hover:border-gray-300 bg-white",
      ].join(" ")}
    >
      {/* Radio dot */}
      <div className="flex-shrink-0 mt-0.5">
        <div
          className={[
            "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
            isSelected ? "border-gray-900 bg-gray-900" : "border-gray-300",
          ].join(" ")}
        >
          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>
      </div>

      {/* Address details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-xs font-semibold text-gray-900">{address.name}</span>
          <span className="flex items-center gap-0.5 text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full capitalize">
            <AddressTypeIcon type={address.addressType} />
            {address.addressType || "home"}
          </span>
          {address.isDefault && (
            <span className="text-[10px] text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full font-medium">
              Default
            </span>
          )}
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          {address.addressLine1 ? `${address.addressLine1}, ` : ""}
          {address.locality}, {address.city}
          {address.state ? `, ${address.state}` : ""} — {address.pincode}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{address.phone}</p>
      </div>

      {/* Three-dots menu — stopPropagation so clicking it doesn't select the address */}
      <div onClick={(e) => e.stopPropagation()}>
        {isUpdating ? (
          <div className="h-8 w-8 flex items-center justify-center">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
          </div>
        ) : (
          <ThreeDotsMenu
            size="sm"
            items={[
              ...(!address.isDefault
                ? [
                    {
                      label: "Set as Default",
                      icon: <Star className="h-4 w-4 text-yellow-500" />,
                      onClick: onSetDefault,
                    },
                  ]
                : []),
              {
                label: "Edit",
                icon: <Edit2 className="h-4 w-4 text-blue-500" />,
                onClick: onEdit,
              },
              {
                label: "Delete",
                icon: <Trash2 className="h-4 w-4" />,
                onClick: onDelete,
                variant: "destructive" as const,
              },
              {
                label: "Share",
                icon: <Share2 className="h-4 w-4 text-green-500" />,
                onClick: handleShare,
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AddressSelectorProps {
  addresses: UserAddress[];
  selectedAddressId: string;
  onSelectAddress: (id: string) => void;
  onAddNew: () => void;
  onEditAddress: (address: UserAddress) => void;
  onDeleteAddress: (addressId: string) => void;
  onSetDefault: (addressId: string) => void;
  updatingId?: string;
  isMobile?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AddressSelector({
  addresses,
  selectedAddressId,
  onSelectAddress,
  onAddNew,
  onEditAddress,
  onDeleteAddress,
  onSetDefault,
  updatingId,
  isMobile = false,
}: AddressSelectorProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  // ── Empty state ────────────────────────────────────────────────────────────
  if (addresses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed border-gray-200 rounded-xl text-center">
        <MapPin className="h-8 w-8 text-gray-300 mb-2" />
        <p className="text-sm font-medium text-gray-700 mb-1">No saved addresses</p>
        <p className="text-xs text-gray-500 mb-4">Add an address to continue</p>
        <Button size="sm" onClick={onAddNew} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add Address
        </Button>
      </div>
    );
  }

  // ── Selected address card ──────────────────────────────────────────────────
  return (
    <>
      <div className="border-2 border-gray-900 rounded-xl p-3 bg-gray-50">
        <div className="flex items-start gap-3">
          {/* Check icon */}
          <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center">
            <Check className="h-3 w-3 text-white" />
          </div>

          {/* Address details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-sm font-semibold text-gray-900">
                {selectedAddress?.name ?? "Select an address"}
              </span>
              {selectedAddress && (
                <span className="flex items-center gap-0.5 text-[10px] text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded-full capitalize">
                  <AddressTypeIcon type={selectedAddress.addressType} />
                  {selectedAddress.addressType || "home"}
                </span>
              )}
            </div>
            {selectedAddress ? (
              <>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {selectedAddress.addressLine1
                    ? `${selectedAddress.addressLine1}, `
                    : ""}
                  {selectedAddress.locality}, {selectedAddress.city}
                  {selectedAddress.state ? `, ${selectedAddress.state}` : ""} —{" "}
                  {selectedAddress.pincode}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{selectedAddress.phone}</p>
              </>
            ) : (
              <p className="text-xs text-gray-500">
                Tap "Change" to pick a delivery address
              </p>
            )}
          </div>

          {/* Change button */}
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex-shrink-0 flex items-center gap-0.5 text-xs font-semibold text-gray-900 hover:underline"
          >
            Change
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Address picker sheet ── */}
      <StickyPanel
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Select Delivery Address"
        icon={<MapPin className="h-4 w-4" />}
        isMobile={isMobile}
        footer={
          <Button
            size="sm"
            variant="outline"
            className="w-full gap-1.5"
            onClick={() => {
              setPickerOpen(false);
              onAddNew();
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add New Address
          </Button>
        }
      >
        <div className="space-y-2">
          {addresses.map((address) => (
            <AddressRow
              key={address.id}
              address={address}
              isSelected={selectedAddressId === address.id}
              isUpdating={updatingId === address.id}
              onSelect={() => {
                onSelectAddress(address.id);
                setPickerOpen(false);
              }}
              onEdit={() => {
                setPickerOpen(false);
                onEditAddress(address);
              }}
              onDelete={() => onDeleteAddress(address.id)}
              onSetDefault={() => onSetDefault(address.id)}
            />
          ))}
        </div>
      </StickyPanel>
    </>
  );
}
