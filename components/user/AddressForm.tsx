"use client";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAddress } from "@/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, X } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const addressSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Phone number is required"),
  locality: z.string().min(2, "Locality is required"),
  city: z.string().min(2, "City is required"),
  pincode: z.string().min(6, "Pincode is required"),
  isDefault: z.boolean().default(false),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface AddressFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddressFormData) => Promise<void>;
  editingAddress?: UserAddress | null;
  isLoading?: boolean;
  isMobile?: boolean;
}

export default function AddressForm({
  isOpen,
  onClose,
  onSubmit,
  editingAddress,
  isLoading = false,
  isMobile = false,
}: AddressFormProps) {
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

  const FormContent = () => (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-2">
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
  );

  if (!isOpen) return null;

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {editingAddress ? "Edit Address" : "Add New Address"}
            </DrawerTitle>
            <DrawerDescription>
              {editingAddress 
                ? "Update your address details" 
                : "Enter your address details for delivery"
              }
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">
            <FormContent />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop Modal (reusing the existing modal logic)
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex flex-row items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <h2 className="text-lg font-semibold">
              {editingAddress ? "Edit Address" : "Add New Address"}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-3">
          <FormContent />
        </div>
      </div>
    </div>
  );
}
