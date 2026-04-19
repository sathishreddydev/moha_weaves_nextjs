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
import { MobileInput } from "@/components/ui/mobile-input";
import { MobileButton } from "@/components/ui/mobile-button";
import { UserAddress } from "@/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, X } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const addressSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit phone number starting with 6, 7, 8, or 9"),
  locality: z.string().min(2, "Locality is required"),
  city: z.string().min(2, "City is required"),
  pincode: z.string().regex(/^\d{6}$/, "Please enter a valid 6-digit pincode"),
  addressType: z.enum(["home", "work", "other"]).default("home"),
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
      addressType: "home" as const,
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
        addressType: editingAddress.addressType || "home",
        isDefault: editingAddress.isDefault,
      });
    } else {
      form.reset({
        name: "",
        phone: "",
        locality: "",
        city: "",
        pincode: "",
        addressType: "home" as const,
        isDefault: false,
      });
    }
  }, [editingAddress, form]);

  const handleSubmit = async (data: AddressFormData) => {
    try {
      await onSubmit(data);
      form.reset();
      onClose();
    } catch (error) {
      // Error is handled by the parent component
      console.error('Form submission error:', error);
    }
  };

  const FormContent = () => (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-2">
      <MobileInput
        id="name"
        label="Full Name"
        {...form.register("name")}
        placeholder="John Doe"
        disabled={isLoading}
        error={form.formState.errors.name?.message}
        inputMode="text"
        autoComplete="name"
      />

      <MobileInput
        id="phone"
        label="Phone Number"
        {...form.register("phone")}
        placeholder="9876543210"
        disabled={isLoading}
        error={form.formState.errors.phone?.message}
        inputMode="tel"
        autoComplete="tel"
        helperText="10-digit number starting with 6, 7, 8, or 9"
      />

      <MobileInput
        id="locality"
        label="Locality/Area"
        {...form.register("locality")}
        placeholder="Sector 15, Gurgaon"
        disabled={isLoading}
        error={form.formState.errors.locality?.message}
        inputMode="text"
        autoComplete="address-line1"
      />

      <MobileInput
        id="city"
        label="City"
        {...form.register("city")}
        placeholder="Gurgaon"
        disabled={isLoading}
        error={form.formState.errors.city?.message}
        inputMode="text"
        autoComplete="address-level2"
      />

      <MobileInput
        id="pincode"
        label="Pincode"
        {...form.register("pincode")}
        placeholder="122001"
        disabled={isLoading}
        error={form.formState.errors.pincode?.message}
        inputMode="numeric"
        autoComplete="postal-code"
        helperText="6-digit Indian pincode"
      />

      <div>
        <Label className="text-sm font-medium">Address Type</Label>
        <div className="flex gap-4 mt-2">
          <label className="flex items-center">
            <input
              type="radio"
              value="home"
              {...form.register("addressType")}
              disabled={isLoading}
              className="mr-2"
            />
            <span className="text-sm">Home</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="work"
              {...form.register("addressType")}
              disabled={isLoading}
              className="mr-2"
            />
            <span className="text-sm">Work</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="other"
              {...form.register("addressType")}
              disabled={isLoading}
              className="mr-2"
            />
            <span className="text-sm">Other</span>
          </label>
        </div>
        {form.formState.errors.addressType && (
          <p className="text-sm text-red-600 mt-1">
            {form.formState.errors.addressType.message}
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
        <MobileButton
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
          fullWidth
          size="lg"
        >
          Cancel
        </MobileButton>
        <MobileButton
          type="submit"
          disabled={isLoading}
          loading={isLoading}
          fullWidth
          size="lg"
        >
          {editingAddress ? "Update" : "Add"} Address
        </MobileButton>
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
