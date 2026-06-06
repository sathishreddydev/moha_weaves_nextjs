"use client";

import { UserAddress } from "@/shared";
import { Button } from "@/components/ui/button";
import { ThreeDotsMenu } from "@/components/ui/three-dots-menu";
import {
  MapPin,
  Plus,
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
  if (type === "work") return <Briefcase className="h-4 w-4 text-gray-500" />;
  if (type === "other") return <Building2 className="h-4 w-4 text-gray-500" />;
  return <Home className="h-4 w-4 text-gray-500" />;
}

// ─── Single address row ───────────────────────────────────────────────────────

export function AddressRow({
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
        "relative flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all",
        isSelected
          ? "border-gray-900 bg-gray-50"
          : "border-gray-200 hover:border-gray-300 bg-white",
      ].join(" ")}
    >
      {/* Radio dot */}
      <div className="flex-shrink-0 mt-0.5">
        <div
          className={[
            "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
            isSelected ? "border-gray-900 bg-gray-900" : "border-gray-300",
          ].join(" ")}
        >
          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>
      </div>

      {/* Address details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          <span className="text-xs font-semibold text-gray-900">{address.name}</span>
          <span className="flex items-center gap-0.5 text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full capitalize">
            <AddressTypeIcon type={address.addressType} />
            {address.addressType || "home"}
          </span>
          {address.isDefault && (
            <span className="text-xs text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full font-medium">
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

      {/* Three-dots menu */}
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
  /** Called when user wants to see the full address list (Change button) */
  onChangeRequest: () => void;
  /** Called when user wants to add a new address */
  onAddNew: () => void;
  onEditAddress: (address: UserAddress) => void;
  onDeleteAddress: (addressId: string) => void;
  onSetDefault: (addressId: string) => void;
  updatingId?: string;
}

// ─── Selected address card (compact summary shown in checkout) ────────────────

export default function AddressSelector({
  addresses,
  selectedAddressId,
  onSelectAddress,
  onChangeRequest,
  onAddNew,
  onEditAddress,
  onDeleteAddress,
  onSetDefault,
  updatingId,
}: AddressSelectorProps) {
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  // ── Empty state ────────────────────────────────────────────────────────────
  if (addresses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 border border-dashed border-gray-200 rounded-xl text-center">
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
    <div className="border border-gray-900 rounded-xl p-3 bg-gray-50">
      <div className="flex items-start gap-2">
        {/* Address type icon — bare, no circle */}
        <div
          className="flex-shrink-0 mt-0.5"
          title={selectedAddress?.addressType || "home"}
        >
          <AddressTypeIcon type={selectedAddress?.addressType} />
        </div>

        {/* Address details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-sm font-semibold text-gray-900 truncate">
              {selectedAddress?.name ?? "Select an address"}
            </span>
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

        {/* Change button — triggers view swap in parent */}
        <button
          type="button"
          onClick={onChangeRequest}
          className="flex-shrink-0 flex items-center gap-0.5 text-xs font-semibold text-gray-900 hover:underline"
        >
          Change
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Address list (shown when user taps Change) ───────────────────────────────

interface AddressListViewProps {
  addresses: UserAddress[];
  selectedAddressId: string;
  onSelectAddress: (id: string) => void;
  onAddNew: () => void;
  onEditAddress: (address: UserAddress) => void;
  onDeleteAddress: (addressId: string) => void;
  onSetDefault: (addressId: string) => void;
  updatingId?: string;
}

export function AddressListView({
  addresses,
  selectedAddressId,
  onSelectAddress,
  onAddNew,
  onEditAddress,
  onDeleteAddress,
  onSetDefault,
  updatingId,
}: AddressListViewProps) {
  return (
    <div className="space-y-3">
      {addresses.map((address) => (
        <AddressRow
          key={address.id}
          address={address}
          isSelected={selectedAddressId === address.id}
          isUpdating={updatingId === address.id}
          onSelect={() => onSelectAddress(address.id)}
          onEdit={() => onEditAddress(address)}
          onDelete={() => onDeleteAddress(address.id)}
          onSetDefault={() => onSetDefault(address.id)}
        />
      ))}

      {/* Add new address button */}
      <button
        type="button"
        onClick={onAddNew}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-gray-200 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add New Address
      </button>
    </div>
  );
}
