"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input } from "../ui/input";

const addressSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit number starting with 6–9"),
  addressLine1: z
    .string()
    .min(5, "Flat, House No. must be at least 5 characters"),
  locality: z.string().min(2, "Apartment, Area, Sector, Village is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit pincode"),
  addressType: z.enum(["home", "work", "other"]).default("home"),
  isDefault: z.boolean().default(false),
});

export type AddressFormData = z.infer<typeof addressSchema>;

interface PincodeInfo {
  available: boolean;
  city?: string;
  state?: string;
  deliveryDays?: number;
  message?: string;
}

interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface AddressFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddressFormData) => Promise<void>;
  editingAddress?: UserAddress | null;
  isLoading?: boolean;
}

const ADDRESS_TYPES = [
  { value: "home", label: "Home", icon: Home },
  { value: "work", label: "Work", icon: Briefcase },
  { value: "other", label: "Other", icon: Building2 },
] as const;

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

  // Google Places Autocomplete state
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);
  const localityContainerRef = useRef<HTMLDivElement>(null);

  // Fetch user profile for email & phone defaults
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
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

  // Pincode is valid when we have a successful lookup
  const isPincodeValid = pincodeInfo?.available === true;
  const isPincodeInvalid = pincodeInfo !== null && !pincodeInfo.available;

  // Already the default — lock the toggle
  const isAlreadyDefault = !!editingAddress?.isDefault;

  // Reset form whenever it opens or editing target changes
  useEffect(() => {
    setSubmitError(null);
    setSuggestions([]);
    setShowSuggestions(false);

    const cleanPhone = (raw: string | null | undefined) => {
      if (!raw) return "";
      const digits = raw.replace(/\D/g, "");
      if (digits.length === 12 && digits.startsWith("91"))
        return digits.slice(2);
      if (digits.length === 11 && digits.startsWith("0"))
        return digits.slice(1);
      return digits.slice(0, 10);
    };

    if (editingAddress) {
      form.reset({
        name: editingAddress.name,
        email: profile?.email || "",
        phone: cleanPhone(editingAddress.phone) || cleanPhone(profile?.phone),
        addressLine1: editingAddress.addressLine1 ?? "",
        locality: editingAddress.locality,
        city: editingAddress.city,
        state: editingAddress.state ?? "",
        pincode: editingAddress.pincode,
        addressType: editingAddress.addressType || "home",
        isDefault: editingAddress.isDefault,
      });
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
        phone: cleanPhone(profile?.phone),
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

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        localityContainerRef.current &&
        !localityContainerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  // ── Google Places Autocomplete for Locality ─────────────────────────────────

  const fetchSuggestions = useCallback(
    async (input: string) => {
      if (input.length < 3 || !isPincodeValid) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const currentPincode = form.getValues("pincode");
      setSuggestionsLoading(true);
      try {
        // Pass pincode to restrict suggestions to that area only
        const res = await fetch(
          `/api/places/autocomplete?input=${encodeURIComponent(input)}&pincode=${encodeURIComponent(currentPincode)}`,
        );
        const data = await res.json();

        if (data.suggestions && data.suggestions.length > 0) {
          setSuggestions(data.suggestions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isPincodeValid],
  );

  const handleLocalityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue("locality", value, { shouldValidate: true });
    setHighlightedIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 400);
  };

  const handleSuggestionSelect = async (suggestion: PlaceSuggestion) => {
    setShowSuggestions(false);
    setSuggestions([]);

    // Combine mainText + first part of secondaryText for full locality
    // e.g. "Frontline Seven" + "Kokapet, Gandipet..." → "Frontline Seven, Kokapet"
    const firstArea = suggestion.secondaryText?.split(",")[0]?.trim() || "";
    const locality = firstArea
      ? `${suggestion.mainText}, ${firstArea}`
      : suggestion.mainText;

    form.setValue("locality", locality, {
      shouldValidate: true,
    });
  };

  const handleLocalityKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1,
      );
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleSuggestionSelect(suggestions[highlightedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async (data: AddressFormData) => {
    setSubmitError(null);
    try {
      if (!hasExistingEmail && data.email) {
        try {
          await updateProfile.mutateAsync({ email: data.email });
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : "Failed to save email";
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
        err instanceof Error
          ? err.message
          : "Failed to save address. Please try again.",
      );
    }
  };

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
            <Input
              required
              id="name"
              label="Full Name"
              {...form.register("name")}
              disabled={isLoading}
              error={form.formState.errors.name?.message}
              inputMode="text"
              autoComplete="name"
              type="text"
              icon={<User className="h-3.5 w-3.5 text-gray-400" />}
            />
            <Input
              required
              id="phone"
              label="Phone"
              {...form.register("phone", {
                onChange: (e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  form.setValue("phone", value);
                },
              })}
              disabled={isLoading}
              error={form.formState.errors.phone?.message}
              inputMode="tel"
              autoComplete="tel"
              type="tel"
              maxLength={10}
              icon={<Phone className="h-3.5 w-3.5 text-gray-400" />}
            />
            <div className="sm:col-span-2">
              <Input
                required
                id="email"
                label="Email"
                {...form.register("email")}
                disabled={isLoading || hasExistingEmail}
                error={form.formState.errors.email?.message}
                inputMode="email"
                autoComplete="email"
                type="email"
                icon={<Mail className="h-3.5 w-3.5 text-gray-400" />}
              />
              {hasExistingEmail && (
                <p className="text-[11px] text-gray-500 mt-1 ml-1">
                  Email linked to your account and cannot be changed here.
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

          {/* Pincode — ALWAYS visible first */}
          <div>
            <Input
              required
              id="pincode"
              label="Pincode"
              {...form.register("pincode", {
                onChange: (e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  form.setValue("pincode", value);
                  if (value.length === 6) {
                    checkPincode(value);
                  } else {
                    // Reset if pincode is cleared/changed
                    setPincodeInfo(null);
                    form.setValue("city", "", { shouldValidate: false });
                    form.setValue("state", "", { shouldValidate: false });
                  }
                },
              })}
              type="text"
              disabled={isLoading}
              error={form.formState.errors.pincode?.message}
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={6}
            />

            {pincodeLoading && (
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                Checking delivery availability…
              </p>
            )}

            {isPincodeValid && city && state && (
              <div className="mt-2 grid grid-cols-2 gap-3">
                <Input
                  id="city"
                  label="City / District"
                  {...form.register("city")}
                  type="text"
                  disabled={isLoading}
                />
                <Input
                  id="state"
                  label="State"
                  value={state || ""}
                  disabled
                  type="text"
                />
              </div>
            )}

            {isPincodeInvalid && (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-700">
                  {pincodeInfo?.message ??
                    "Delivery not available in this area"}
                </p>
              </div>
            )}
          </div>

          {/* Address Line 1 — only show after valid pincode */}
          {isPincodeValid && (
            <Input
              required
              id="addressLine1"
              label="Flat, House No."
              {...form.register("addressLine1")}
              disabled={isLoading}
              error={form.formState.errors.addressLine1?.message}
              inputMode="text"
              autoComplete="address-line1"
              type="text"
              icon={<MapPin className="h-3.5 w-3.5 text-gray-400" />}
            />
          )}

          {/* Locality / Area (Address Line 2) — only show after valid pincode */}
          {isPincodeValid && (
            <div ref={localityContainerRef} className="relative">
              <Input
                required
                id="locality"
                label="Apartment, Area, Sector, Village"
                value={form.watch("locality")}
                onChange={handleLocalityChange}
                onKeyDown={handleLocalityKeyDown}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                disabled={isLoading}
                error={form.formState.errors.locality?.message}
                inputMode="text"
                type="text"
                autoComplete="off"
                icon={
                  suggestionsLoading ? (
                    <Loader2 className="h-3.5 w-3.5 text-gray-400 animate-spin" />
                  ) : (
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  )
                }
              />

              {/* Google Places Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <ul
                  ref={suggestionsRef}
                  role="listbox"
                  className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto"
                >
                  {suggestions.map((suggestion, index) => (
                    <li
                      key={suggestion.placeId}
                      role="option"
                      aria-selected={highlightedIndex === index}
                      onClick={() => handleSuggestionSelect(suggestion)}
                      className={[
                        "flex items-start gap-3 px-4 py-2.5 cursor-pointer transition-colors",
                        highlightedIndex === index
                          ? "bg-gray-100"
                          : "hover:bg-gray-50",
                        index !== suggestions.length - 1
                          ? "border-b border-gray-100"
                          : "",
                      ].join(" ")}
                    >
                      <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {suggestion.mainText}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {suggestion.secondaryText}
                        </p>
                      </div>
                    </li>
                  ))}
                  <li className="px-4 py-1.5 border-t border-gray-100">
                    <p className="text-[9px] text-gray-400 text-center">
                      Powered by Google
                    </p>
                  </li>
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Hidden state for form submission (city is visible & editable above) */}
        <input type="hidden" {...form.register("state")} />

        {/* Set as Default */}
        {isAlreadyDefault ? (
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
              "w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all",
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

        {/* Save button */}
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
