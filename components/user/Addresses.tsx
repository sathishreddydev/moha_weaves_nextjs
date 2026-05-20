"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Home,
  Briefcase,
  Building2,
  Plus,
  ArrowLeft,
  Loader2,
  Star,
  Edit2,
  Trash2,
  Share2,
} from "lucide-react";
import { useAddressStore } from "@/lib/stores/addressStore";
import AddressForm, { type AddressFormData } from "./AddressForm";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { UserAddress } from "@/shared";
import { useRouter } from "next/navigation";
import { ThreeDotsMenu } from "../ui/three-dots-menu";

function AddressTypeIcon({ type }: { type?: string }) {
  switch (type?.toLowerCase()) {
    case "work":
    case "office":
      return <Briefcase className="w-4 h-4" />;
    case "other":
      return <Building2 className="w-4 h-4" />;
    default:
      return <Home className="w-4 h-4" />;
  }
}

export default function Addresses() {
  const {
    addresses,
    loading,
    error,
    fetchAddresses,
    deleteAddress,
    setDefaultAddress,
    updating,
    createAddress,
    updateAddress,
  } = useAddressStore();
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(
    null,
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<UserAddress | null>(
    null,
  );
  const router = useRouter();


  const handleShareAddress = (address: UserAddress) => {
    const text = `${address.name}\n${address.phone}\n${address.locality}, ${address.city} - ${address.pincode}`;
    if (navigator.share) {
      navigator.share({ title: "Address", text });
    } else {
      navigator.clipboard.writeText(text);
    }
  };


  const handleDeleteAddress = (address: UserAddress) => {
    setAddressToDelete(address);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (addressToDelete) {
      await deleteAddress(addressToDelete.id);
      setAddressToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setAddressToDelete(null);
  };

  const handleSetDefault = async (addressId: string) => {
    await setDefaultAddress(addressId);
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setIsAddFormOpen(true);
  };

  const handleEditAddress = (address: UserAddress) => {
    setEditingAddress(address);
    setIsAddFormOpen(true);
  };

  const handleFormSubmit = async (data: AddressFormData) => {
    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, data);
      } else {
        await createAddress(data);
      }
      handleCloseForm();
    } catch {
      // Error handled by store — form stays open so user can retry
    }
  };

  const handleCloseForm = () => {
    setIsAddFormOpen(false);
    setEditingAddress(null);
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-center">
        <p>Error loading addresses: {error}</p>
        <Button onClick={fetchAddresses} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  const handleBack = () => {
    router.push("/my");
  };
  return (
    <div className="space-y-4">
      {/* ── Inline Address Form (replaces list when open) ── */}
      {isAddFormOpen ? (
        <AddressForm
          isOpen={isAddFormOpen}
          onClose={handleCloseForm}
          onSubmit={handleFormSubmit}
          editingAddress={editingAddress}
          isLoading={updating !== null}
        />
      ) : (
        <>
          <div className="">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-3 cursor-pointer lg:hidden group"
                aria-label="Back to profile"
              >
                <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-gray-800 transition-colors" />
                <h1 className="text-xl font-semibold text-gray-900">Addresses</h1>
              </button>
              {/* Desktop title (no back button) */}
              <h1 className="hidden lg:block text-xl font-semibold text-gray-900">Addresses</h1>
              <Button
                variant="outline"
                onClick={handleAddAddress}
                className="ml-auto active:scale-[0.98]"
                size="sm"
              >
                <Plus className="w-4 h-4" />
                Add Address
              </Button>
            </div>
          </div>
          <div>
            {addresses.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No addresses saved yet</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddAddress}
                  className="text-base"
                >
                  Add Your First Address
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className={[
                      "bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all",
                      updating === address.id
                        ? "opacity-60 pointer-events-none"
                        : "hover:shadow-md",
                    ].join(" ")}
                  >
                    <div className="flex items-start p-3 gap-3">
                      {/* Left: icon + type label */}
                      <div className="flex flex-col items-center gap-1 min-w-[48px] pt-0.5">
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                          <AddressTypeIcon type={address.addressType} />
                        </div>
                        <span className="text-[10px] font-medium text-gray-700 capitalize leading-none">
                          {address.addressType || "home"}
                        </span>
                      </div>

                      {/* Divider */}
                      <div className="w-px self-stretch bg-gray-200 mx-1" />

                      {/* Address details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {address.name}
                          </h3>
                          {address.isDefault && (
                            <span className="bg-green-100 text-green-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-xs mb-0.5">
                          {address.phone}
                        </p>
                        {address.addressLine1 && (
                          <p className="text-gray-600 text-xs leading-snug truncate">
                            {address.addressLine1}
                          </p>
                        )}
                        <p className="text-gray-700 text-xs leading-snug">
                          {address.locality}, {address.city} – {address.pincode}
                        </p>
                      </div>

                      {/* Right: three-dot menu */}
                      <ThreeDotsMenu
                        items={[
                          ...(!address.isDefault
                            ? [
                                {
                                  label: "Set as Default",
                                  icon: (
                                    <Star className="w-4 h-4 text-yellow-500" />
                                  ),
                                  onClick: () => handleSetDefault(address.id),
                                  disabled: updating === address.id,
                                },
                              ]
                            : []),

                          {
                            label: "Edit",
                            icon: <Edit2 className="w-4 h-4 text-blue-500" />,
                            onClick: () => handleEditAddress(address),
                          },

                          {
                            label: "Delete",
                            icon:
                              updating === address.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              ),
                            onClick: () => handleDeleteAddress(address),
                            disabled: updating === address.id,
                            variant: "destructive",
                          },

                          {
                            label: "Share",
                            icon: <Share2 className="w-4 h-4 text-green-500" />,
                            onClick: () => handleShareAddress(address),
                          },
                        ]}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={handleCloseDeleteConfirm}
        onConfirm={handleConfirmDelete}
        isMobile={false}
        isLoading={updating !== null}
        addressName={addressToDelete?.name}
      />
    </div>
  );
}
