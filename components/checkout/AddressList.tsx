"use client";

import { UserAddress } from "@/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "../ui/badge";
import { MapPin, Edit, Trash2, Check } from "lucide-react";

interface AddressListProps {
  addresses: UserAddress[];
  selectedAddressId?: string;
  onSelectAddress: (addressId: string) => void;
  onEditAddress: (address: UserAddress) => void;
  onDeleteAddress: (addressId: string) => void;
  onSetDefault: (addressId: string) => void;
  updatingId?: string;
}

export default function AddressList({
  addresses,
  selectedAddressId,
  onSelectAddress,
  onEditAddress,
  onDeleteAddress,
  onSetDefault,
  updatingId,
}: AddressListProps) {
  if (addresses.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Saved Addresses
          </h3>
          <p className="text-gray-600 mb-4">
            You haven't saved any addresses yet. Add your first address to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {addresses.map((address) => (
        <Card
          key={address.id}
          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
            selectedAddressId === address.id
              ? "ring-2 ring-blue-500 border-blue-500"
              : "border-gray-200"
          }`}
          onClick={() => onSelectAddress(address.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="flex-shrink-0 mt-1">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      selectedAddressId === address.id
                        ? "bg-blue-600 border-blue-600"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedAddressId === address.id && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">
                      {address.name}
                    </h4>
                    {address.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {address.locality}, {address.city} - {address.pincode}
                    </p>
                    <p className="flex items-center gap-1">
                      <span className="font-medium">Phone:</span> {address.phone}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1 ml-2">
                {!address.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetDefault(address.id);
                    }}
                    disabled={updatingId === address.id}
                    className="h-8 w-8 p-0"
                    title="Set as default"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditAddress(address);
                  }}
                  disabled={updatingId === address.id}
                  className="h-8 w-8 p-0"
                  title="Edit address"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteAddress(address.id);
                  }}
                  disabled={updatingId === address.id}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Delete address"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
