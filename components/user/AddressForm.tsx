"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MobileInput } from "@/components/ui/mobile-input";
import { useProfile, useUpdateProfile } from "@/hooks/useProfileQuery";
import { UserAddress } from "@/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Building2,
  Check,
  Home,
  Loader2,
  Lock,
  Mail,
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
  email: z.string().email("Enter a valid email address"),
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

export type AddressFormData = z.infer<typeof addressSchema>;

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
}: AddressFormProps) {
  const [pincodeInfo, setPincodeInfo] = useState<PincodeInfo | null>(null);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch user profile for email & phone defaults
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();

  // Whether the user already has an email saved in their profile
  const hasExistingEmail = !!profile?.email;

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: "",
      email: "",
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

  // Already the default — lock the toggle so user can't accidentally un-default
  const isAlreadyDefault = !!editingAddress?.isDefault;

  // Reset form whenever the form opens or the editing target changes
  useEffect(() => {
    setSubmitError(null);
    if (editingAddress) {
      form.reset({
        name: editingAddress.name,
        email: profile?.email || "",
        phone: editingAddress.phone || profile?.phone || "",
        addressLine1: editingAddress.addressLine1 ?? "",
        locality: editingAddress.locality,
        city: editingAddress.city,
        state: editingAddress.state ?? "",
        pincode: editingAddress.pincode,
        addressType: editingAddress.addressType || "home",
        isDefault: editingAddress.isDefault,
      });
      // Pre-populate pincode info so the serviceable banner shows immediately
      if (editingAddress.city && editingAddress.state) {
        setPincodeInfo({
          available: true,
          city: editingAddress.city,
          state: editingAddress.state ?? undefined,
        });
      } else {
        setPincodeInfo(null);
      }
    } else {
      form.reset({
        name: "",
        email: profile?.email || "",
        phone: profile?.phone || "",
        addressLine1: "",
        locality: "",
        city: "",
        state: "",
        pincode: "",
        addressType: "home",
        isDefault: false,
      });
      setPincodeInfo(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingAddress, isOpen, profile]);

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
    setSubmitError(null);
    try {
      // If user didn't have an email before, save it to their profile
      if (!hasExistingEmail && data.email) {
        try {
          await updateProfile.mutateAsync({ email: data.email });
        } catch (err) {
          // If email update fails (e.g. already taken), show error but don't block address save
          const msg = err instanceof Error ? err.message : "Failed to save email";
          setSubmitError(msg);
          return;
        }
      }
      await onSubmit(data);
      form.reset();
      setPincodeInfo(null);
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to save address. Please try again.",
      );
    }
  };

  const isPincodeInvalid = pincodeInfo !== null && !pincodeInfo.available;

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!isOpen) return null;

  return (
    <div className="space-y-4">
      {/* Header with back button */}
      <button
        type="button"
        onClick={onClose}
        disabled={isLoading}
        className="flex items-center gap-3 cursor-pointer disabled:opacity-50 group -ml-1 py-1"
        aria-label="Go back to addresses"
      >
        <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-gray-800 transition-colors" />
        <h1 className="text-xl font-semibold text-gray-900">
          {editingAddress ? "Edit Address" : "Add New Address"}
        </h1>
      </button>

      {/* Submit error banner */}
      {submitError && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-700">{submitError}</p>
        </div>
      )}

      {/* Form */}
      <form
        id="address-form"
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4"
      >
        {/* ── Section 1: Receiver Details ─────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3 space-y-3">
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-gray-500" />
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Receiver Details
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MobileInput
              id="name"
              label="Full Name"
              {...form.register("name")}
              placeholder="Your Name"
              disabled={isLoading}
              error={form.formState.errors.name?.message}
              inputMode="text"
              autoComplete="name"
              type="text"
              icon={<User className="h-3.5 w-3.5 text-gray-400" />}
            />
            <MobileInput
              id="phone"
              label="Phone"
              {...form.register("phone")}
              placeholder="10-digit mobile number"
              disabled={isLoading}
              error={form.formState.errors.phone?.message}
              inputMode="tel"
              autoComplete="tel"
              type="tel"
              icon={<Phone className="h-3.5 w-3.5 text-gray-400" />}
            />
            <div className="sm:col-span-2">
              <MobileInput
                id="email"
                label="Email"
                {...form.register("email")}
                placeholder="your@email.com"
                disabled={isLoading || hasExistingEmail}
                error={form.formState.errors.email?.message}
                inputMode="email"
                autoComplete="email"
                type="email"
                icon={<Mail className="h-3.5 w-3.5 text-gray-400" />}
              />
              {hasExistingEmail && (
                <p className="text-[11px] text-gray-500 mt-1">
                  You cannot edit this email as you are logged in using this on the website. Please login with an updated email on website to auto-update it.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Section 2: Location Details ──────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-gray-500" />
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Location Details
            </p>
          </div>

          {/* Address type */}
          <div>
            <Label className="text-xs font-medium text-gray-500">
              Address Type
            </Label>
            <div className="flex gap-2 mt-1.5">
              {ADDRESS_TYPES.map(({ value, label, icon: Icon }) => {
                const isSelected = selectedType === value;
                return (
                  <Button
                    key={value}
                    type="button"
                    onClick={() =>
                      form.setValue("addressType", value, {
                        shouldValidate: true,
                      })
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
            type="text"
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
            type="text"
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
              placeholder="6-digit pincode"
              type="text"
              disabled={isLoading}
              error={form.formState.errors.pincode?.message}
              inputMode="numeric"
              autoComplete="postal-code"
            />

            {pincodeLoading && (
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                Checking delivery availability…
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
                    {pincodeInfo.deliveryDays
                      ? `Delivery in ${pincodeInfo.deliveryDays} days`
                      : "Delivery available"}
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
        </div>

        {/* Hidden city / state — populated by pincode lookup */}
        <input type="hidden" {...form.register("city")} />
        <input type="hidden" {...form.register("state")} />

        {/* Set as Default */}
        {isAlreadyDefault ? (
          // Already default — show locked state, no toggle
          <div className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-green-200 bg-green-50">
            <Lock className="h-4 w-4 text-green-600 flex-shrink-0" />
            <div className="text-left">
              <p className="text-xs font-medium text-green-800">
                This is your default address
              </p>
              <p className="text-[11px] text-green-600">
                Used automatically at checkout
              </p>
            </div>
            <span className="ml-auto text-[10px] font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
              Default
            </span>
          </div>
        ) : (
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
        )}

        {/* Save button — full width, no cancel (back arrow handles that) */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={isLoading || isPincodeInvalid || pincodeLoading}
            className="w-full"
            size="sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving…
              </>
            ) : (
              <>{editingAddress ? "Update Address" : "Save Address"}</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}


