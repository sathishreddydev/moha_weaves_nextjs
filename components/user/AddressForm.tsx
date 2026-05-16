"use client";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MobileInput } from "@/components/ui/mobile-input";
import { MobileButton } from "@/components/ui/mobile-button";
import { UserAddress } from "@/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Check, Loader2, MapPin, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const addressSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z
    .string()
    .regex(
      /^(\+91[\-\s]?)?[6-9]\d{9}$/,
      "Enter a valid 10-digit number starting with 6–9"
    ),
  addressLine1: z
    .string()
    .min(5, "Address line 1 must be at least 5 characters"),
  locality: z.string().min(2, "Locality is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z
    .string()
    .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit pincode"),
  addressType: z.enum(["home", "work", "other"]).default("home"),
  isDefault: z.boolean().default(false),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface PincodeInfo {
  available: boolean;
  city?: string;
  state?: string;
  deliveryDays?: number;
  message?: string;
}

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
  const [pincodeInfo, setPincodeInfo] = useState<PincodeInfo | null>(null);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: "",
      phone: "",
      addressLine1: "",
      locality: "",
      city: "",
      state: "",
      pincode: "",
      addressType: "home",
      isDefault: false,
    },
  });

  useEffect(() => {
    if (editingAddress) {
      form.reset({
        name: editingAddress.name,
        phone: editingAddress.phone,
        addressLine1: editingAddress.addressLine1 ?? "",
        locality: editingAddress.locality,
        city: editingAddress.city,
        state: editingAddress.state ?? "",
        pincode: editingAddress.pincode,
        addressType: editingAddress.addressType || "home",
        isDefault: editingAddress.isDefault,
      });
    } else {
      form.reset({
        name: "",
        phone: "",
        addressLine1: "",
        locality: "",
        city: "",
        state: "",
        pincode: "",
        addressType: "home",
        isDefault: false,
      });
    }
    setPincodeInfo(null);
  }, [editingAddress, form, isOpen]);

  const checkPincode = async (pincode: string) => {
    if (!/^[1-9][0-9]{5}$/.test(pincode)) return;
    setPincodeLoading(true);
    setPincodeInfo(null);
    try {
      const res = await fetch(`/api/pincodes/${pincode}`);
      const data: PincodeInfo = await res.json();
      setPincodeInfo(data);
      if (data.available && data.city && data.state) {
        form.setValue("city", data.city, { shouldValidate: true });
        form.setValue("state", data.state, { shouldValidate: true });
      }
    } catch {
      setPincodeInfo({ available: false, message: "Could not check pincode" });
    } finally {
      setPincodeLoading(false);
    }
  };

  const handleSubmit = async (data: AddressFormData) => {
    try {
      await onSubmit(data);
      form.reset();
      setPincodeInfo(null);
      onClose();
    } catch {
      // Error handled by parent
    }
  };

  const isPincodeInvalid = pincodeInfo !== null && !pincodeInfo.available;

  const FormContent = () => (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
      {/* Name + Phone side by side */}
      <div className="grid grid-cols-2 gap-3">
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
          helperText="Starts with 6–9"
        />
      </div>

      {/* Address Line 1 */}
      <MobileInput
        id="addressLine1"
        label="Address Line 1"
        {...form.register("addressLine1")}
        placeholder="House no., Building, Street"
        disabled={isLoading}
        error={form.formState.errors.addressLine1?.message}
        inputMode="text"
        autoComplete="address-line1"
      />

      {/* Locality */}
      <MobileInput
        id="locality"
        label="Locality / Area"
        {...form.register("locality")}
        placeholder="Sector 15, Colony name"
        disabled={isLoading}
        error={form.formState.errors.locality?.message}
        inputMode="text"
        autoComplete="address-line2"
      />

      {/* Pincode — triggers auto-fill */}
      <div>
        <MobileInput
          id="pincode"
          label="Pincode"
          {...form.register("pincode", {
            onChange: (e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 6);
              form.setValue("pincode", value);
              if (value.length === 6) checkPincode(value);
            },
          })}
          placeholder="110001"
          disabled={isLoading}
          error={form.formState.errors.pincode?.message}
          inputMode="numeric"
          autoComplete="postal-code"
          helperText="6-digit Indian pincode"
        />
        {pincodeLoading && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Checking availability...
          </p>
        )}
        {pincodeInfo && (
          <p
            className={`text-xs mt-1 flex items-center gap-1 ${
              pincodeInfo.available ? "text-green-600" : "text-red-600"
            }`}
          >
            {pincodeInfo.available ? (
              <Check className="h-3 w-3" />
            ) : (
              <AlertCircle className="h-3 w-3" />
            )}
            {pincodeInfo.available
              ? `Delivery available — ${pincodeInfo.city}, ${pincodeInfo.state} (${pincodeInfo.deliveryDays} days)`
              : (pincodeInfo.message ?? "Delivery not available in this area")}
          </p>
        )}
      </div>

      {/* City + State — auto-filled from pincode, read-only */}
      <div className="grid grid-cols-2 gap-3">
        <MobileInput
          id="city"
          label="City"
          {...form.register("city")}
          placeholder="Auto-filled"
          disabled
          error={form.formState.errors.city?.message}
          inputMode="text"
          autoComplete="address-level2"
        />
        <MobileInput
          id="state"
          label="State"
          {...form.register("state")}
          placeholder="Auto-filled"
          disabled
          error={form.formState.errors.state?.message}
          inputMode="text"
          autoComplete="address-level1"
        />
      </div>

      {/* Address Type */}
      <div>
        <Label className="text-sm font-medium">Address Type</Label>
        <div className="flex gap-4 mt-2">
          {(["home", "work", "other"] as const).map((type) => (
            <label key={type} className="flex items-center">
              <input
                type="radio"
                value={type}
                {...form.register("addressType")}
                disabled={isLoading}
                className="mr-2"
              />
              <span className="text-sm capitalize">{type}</span>
            </label>
          ))}
        </div>
        {form.formState.errors.addressType && (
          <p className="text-sm text-red-600 mt-1">
            {form.formState.errors.addressType.message}
          </p>
        )}
      </div>

      {/* Default */}
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
          disabled={isLoading || isPincodeInvalid || pincodeLoading}
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
                : "Enter your address details for delivery"}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto">
            <FormContent />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

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
