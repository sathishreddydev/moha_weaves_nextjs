"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserAddress } from "@/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, MapPin, Phone, Mail } from "lucide-react";

const addressSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Phone number is required"),
  locality: z.string().min(2, "Locality is required"),
  city: z.string().min(2, "City is required"),
  pincode: z.string().min(6, "Pincode is required"),
  isDefault: z.boolean().default(false),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddressFormData) => Promise<void>;
  editingAddress?: UserAddress | null;
  isLoading?: boolean;
}

export default function AddressModal({
  isOpen,
  onClose,
  onSubmit,
  editingAddress,
  isLoading = false,
}: AddressModalProps) {
  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: "",
      phone: "",
      locality: "",
      city: "",
      pincode: "",
      isDefault: false,
    },
  });

  useEffect(() => {
    if (editingAddress) {
      form.reset({
        name: editingAddress.name,
        phone: editingAddress.phone,
        locality: editingAddress.locality,
        city: editingAddress.city,
        pincode: editingAddress.pincode,
        isDefault: editingAddress.isDefault,
      });
    } else {
      form.reset({
        name: "",
        phone: "",
        locality: "",
        city: "",
        pincode: "",
        isDefault: false,
      });
    }
  }, [editingAddress, form]);

  const handleSubmit = async (data: AddressFormData) => {
    await onSubmit(data);
    if (!isLoading) {
      form.reset();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {editingAddress ? "Edit Address" : "Add New Address"}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="John Doe"
                disabled={isLoading}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                {...form.register("phone")}
                placeholder="+91 98765 43210"
                disabled={isLoading}
              />
              {form.formState.errors.phone && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="locality">Locality/Area</Label>
              <Input
                id="locality"
                {...form.register("locality")}
                placeholder="Sector 15, Gurgaon"
                disabled={isLoading}
              />
              {form.formState.errors.locality && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.locality.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                {...form.register("city")}
                placeholder="Gurgaon"
                disabled={isLoading}
              />
              {form.formState.errors.city && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.city.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                {...form.register("pincode")}
                placeholder="122001"
                disabled={isLoading}
              />
              {form.formState.errors.pincode && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.pincode.message}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDefault"
                {...form.register("isDefault")}
                disabled={isLoading}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="isDefault" className="text-sm">
                Set as default address
              </Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Saving..." : editingAddress ? "Update" : "Add"} Address
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
