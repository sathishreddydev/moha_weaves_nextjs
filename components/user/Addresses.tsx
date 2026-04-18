"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Edit2, Plus } from "lucide-react";
import { useAddressStore } from "@/lib/stores/addressStore";
import AddressForm from "./AddressForm";
import { UserAddress } from "@/shared";

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
  } = useAddressStore();
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(
    null,
  );
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleDeleteAddress = async (addressId: string) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      await deleteAddress(addressId);
    }
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

  const handleFormSubmit = async (data: any) => {
    if (editingAddress) {
      // Handle edit - you'll need to implement updateAddress in the store
      console.log("Edit address:", editingAddress.id, data);
      // await updateAddress(editingAddress.id, data)
    } else {
      // Handle create
      await createAddress(data);
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

  return (
    <div className="space-y-3">
      <div className="flex justify-end items-center">
        {/* <h2 className="text-lg font-semibold text-gray-900">
            Shipping Addresses
          </h2> */}
        <Button onClick={handleAddAddress}>
          <Plus className="w-4 h-4 mr-2" />
          Add Address
        </Button>
      </div>
      <div>
        {addresses.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No addresses saved yet</p>
            <Button onClick={handleAddAddress}>Add Your First Address</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start p-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-sm font-medium text-gray-900">
                        {address.name}
                      </h3>
                      {address.isDefault && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">{address.phone}</p>
                    <p className="text-gray-900 text-sm">
                      {address.locality}, {address.city}, {address.pincode}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {!address.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(address.id)}
                        disabled={updating === address.id}
                      >
                        {updating === address.id ? "Setting..." : "Set Default"}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditAddress(address)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteAddress(address.id)}
                      disabled={updating === address.id}
                    >
                      {updating === address.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Responsive Address Form */}
      <AddressForm
        isOpen={isAddFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        editingAddress={editingAddress}
        isLoading={loading}
        isMobile={isMobile}
      />
    </div>
  );
}
