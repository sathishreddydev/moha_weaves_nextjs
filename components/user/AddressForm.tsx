"use client";

import { StickyPanel } from "@/components/ui/StickyPanel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MobileInput } from "@/components/ui/mobile-input";
import { UserAddress } from "@/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Briefcase,
  Building2,
  Check,
  Home,
  Loader2,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// ─── Schema ────────────────────────────────────────────────────────────────────

const addressSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z
    .string()
    .regex(
      /^(\+91[\-\s]?)?[6-9]\d{9}$/,
      "Enter a valid 10-digit number starting with 6–9",
    ),
  addressLine1: z
    .string()
    .min(5, "Address line 1 must be at least 5 characters"),
  locality: z.string().min(2, "Locality is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit pincode"),
  addressType: z.enum(["home", "work", "other"]).default("home"),
  isDefault: z.boolean().default(false),
});

type AddressFormData = z.infer<typeof addressSchema>;

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PincodeInfo {
  available: boolean;
  city?: string;
  state?: string;
  deliveryDays?: number;
  message?: string;
}

export interface AddressFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddressFormData) => Promise<void>;
  editingAddress?: UserAddress | null;
  isLoading?: boolean;
  isMobile?: boolean;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const ADDRESS_TYPES = [
  { value: "home", label: "Home", icon: Home },
  { value: "work", label: "Work", icon: Briefcase },
  { value: "other", label: "Other", icon: Building2 },
] as const;

// ─── Component ─────────────────────────────────────────────────────────────────

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

  const selectedType = form.watch("addressType");
  const isDefault = form.watch("isDefault");
  const city = form.watch("city");
  const state = form.watch("state");

  // Reset form whenever the panel opens or the editing target changes
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

  // ── Pincode lookup ──────────────────────────────────────────────────────────

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

  // ── Submit ──────────────────────────────────────────────────────────────────

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

  // ── Footer (sticky action buttons) ─────────────────────────────────────────

  const footer = (
    <div className="flex gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        disabled={isLoading}
        className="w-full"
        size="sm"
      >
        Cancel
      </Button>
      <Button
        type="submit"
        form="address-form"
        disabled={isLoading || isPincodeInvalid || pincodeLoading}
        className="w-full relative"
        size="sm"
      >
        {isLoading && (
          <Loader2 className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 animate-spin" />
        )}
        {editingAddress ? "Update" : "Add"} Address
      </Button>
    </div>
  );

  // ── Form body (scrollable) ──────────────────────────────────────────────────

  const formBody = (
    <form
      id="address-form"
      onSubmit={form.handleSubmit(handleSubmit)}
      className="space-y-3"
    >
      {/* Address type selector */}
      <div>
        <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
          Save Address As
        </Label>
        <div className="flex gap-2 mt-2">
          {ADDRESS_TYPES.map(({ value, label, icon: Icon }) => {
            const isSelected = selectedType === value;
            return (
              <Button
                key={value}
                type="button"
                onClick={() =>
                  form.setValue("addressType", value, { shouldValidate: true })
                }
                variant={isSelected ? "default" : "outline"}
                disabled={isLoading}
                className={[
                  "rounded-xl border-2 text-xs font-medium",
                  isSelected
                    ? "border-gray-900 bg-gray-900"
                    : "border-gray-200 hover:border-gray-400",
                ].join(" ")}
                size="sm"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Name + Phone */}
      <div className="grid grid-cols-2 gap-3">
        <MobileInput
          id="name"
          label="Full Name"
          {...form.register("name")}
          placeholder="Your Name"
          disabled={isLoading}
          error={form.formState.errors.name?.message}
          inputMode="text"
          autoComplete="name"
          icon={<User className="h-3.5 w-3.5 text-gray-400" />}
        />
        <MobileInput
          id="phone"
          label="Phone"
          {...form.register("phone")}
          placeholder="Your Phone"
          disabled={isLoading}
          error={form.formState.errors.phone?.message}
          inputMode="tel"
          autoComplete="tel"
          icon={<Phone className="h-3.5 w-3.5 text-gray-400" />}
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
        icon={<MapPin className="h-3.5 w-3.5 text-gray-400" />}
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
        icon={<MapPin className="h-3.5 w-3.5 text-gray-400" />}
      />

      {/* Pincode */}
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
        />

        {pincodeLoading && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Checking availability...
          </p>
        )}

        {pincodeInfo?.available && city && state && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
            <Check className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-green-800 truncate">
                {city}, {state}
              </p>
              <p className="text-[11px] text-green-600">
                Delivery in {pincodeInfo.deliveryDays} days
              </p>
            </div>
            <span className="text-[10px] text-green-600 bg-green-100 px-1.5 py-0.5 rounded font-medium">
              Serviceable
            </span>
          </div>
        )}

        {pincodeInfo && !pincodeInfo.available && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-700">
              {pincodeInfo.message ?? "Delivery not available in this area"}
            </p>
          </div>
        )}
      </div>

      {/* Hidden city / state — populated by pincode lookup */}
      <input type="hidden" {...form.register("city")} />
      <input type="hidden" {...form.register("state")} />

      {/* Set as Default */}
      <button
        type="button"
        onClick={() => form.setValue("isDefault", !isDefault)}
        disabled={isLoading}
        className={[
          "w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all",
          isDefault
            ? "border-gray-900 bg-gray-50"
            : "border-gray-200 bg-white hover:border-gray-300",
        ].join(" ")}
      >
        <div className="flex items-center gap-3">
          <div
            className={[
              "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
              isDefault
                ? "bg-gray-900 border-gray-900"
                : "border-gray-300 bg-white",
            ].join(" ")}
          >
            {isDefault && <Check className="h-2.5 w-2.5 text-white" />}
          </div>
          <div className="text-left">
            <p className="text-xs font-medium text-gray-900">
              Set as default address
            </p>
            <p className="text-[11px] text-gray-500">
              Used automatically at checkout
            </p>
          </div>
        </div>
        {isDefault && (
          <span className="text-[10px] font-medium text-gray-900 bg-gray-200 px-2 py-0.5 rounded-full">
            Default
          </span>
        )}
      </button>
      <input type="hidden" {...form.register("isDefault")} />
    </form>
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <StickyPanel
      isOpen={isOpen}
      onClose={onClose}
      title={editingAddress ? "Edit Address" : "Add New Address"}
      icon={<MapPin className="h-4 w-4" />}
      footer={footer}
      isMobile={isMobile}
    >
      {formBody}
    </StickyPanel>
  );
}
