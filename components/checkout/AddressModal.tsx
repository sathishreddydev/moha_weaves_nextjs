"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserAddress } from "@/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  const titleText = editingAddress ? "Edit Address" : "Add New Address";
  const descriptionText = editingAddress
    ? "Update your saved address details"
    : "Fill in the details for your new address";

  const formContent = (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3 px-4">
      <div>
        <Label htmlFor="name" className="text-xs">Full Name</Label>
        <Input
          id="name"
          {...form.register("name")}
          placeholder="John Doe"
          disabled={isLoading}
          className="h-8 text-xs mt-1"
        />
        {form.formState.errors.name && (
          <p className="text-[11px] text-red-600 mt-0.5">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="phone" className="text-xs">Phone Number</Label>
        <Input
          id="phone"
          {...form.register("phone")}
          placeholder="+91 98765 43210"
          disabled={isLoading}
          className="h-8 text-xs mt-1"
        />
        {form.formState.errors.phone && (
          <p className="text-[11px] text-red-600 mt-0.5">
            {form.formState.errors.phone.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="locality" className="text-xs">Locality / Area</Label>
        <Input
          id="locality"
          {...form.register("locality")}
          placeholder="Sector 15, Gurgaon"
          disabled={isLoading}
          className="h-8 text-xs mt-1"
        />
        {form.formState.errors.locality && (
          <p className="text-[11px] text-red-600 mt-0.5">
            {form.formState.errors.locality.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="city" className="text-xs">City</Label>
        <Input
          id="city"
          {...form.register("city")}
          placeholder="Gurgaon"
          disabled={isLoading}
          className="h-8 text-xs mt-1"
        />
        {form.formState.errors.city && (
          <p className="text-[11px] text-red-600 mt-0.5">
            {form.formState.errors.city.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="pincode" className="text-xs">Pincode</Label>
        <Input
          id="pincode"
          {...form.register("pincode")}
          placeholder="122001"
          disabled={isLoading}
          className="h-8 text-xs mt-1"
        />
        {form.formState.errors.pincode && (
          <p className="text-[11px] text-red-600 mt-0.5">
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
        <Label htmlFor="isDefault" className="text-xs">
          Set as default address
        </Label>
      </div>

      {/* Buttons — only shown inside Dialog (Drawer uses DrawerFooter) */}
      {!isMobile && (
        <div className="flex gap-3 pt-2 pb-1">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 h-8 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 h-8 text-xs"
          >
            {isLoading ? "Saving..." : editingAddress ? "Update" : "Add"} Address
          </Button>
        </div>
      )}
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(v) => { if (!v) onClose(); }}>
        <DrawerContent>
          <DrawerHeader className="pb-2">
            <DrawerTitle className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              {titleText}
            </DrawerTitle>
            <DrawerDescription className="text-xs">{descriptionText}</DrawerDescription>
          </DrawerHeader>
          {formContent}
          <DrawerFooter className="pt-3">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-8 text-xs"
              onClick={form.handleSubmit(handleSubmit)}
            >
              {isLoading ? "Saving..." : editingAddress ? "Update" : "Add"} Address
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="w-full h-8 text-xs"
            >
              Cancel
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4" />
            {titleText}
          </DialogTitle>
          <DialogDescription className="text-xs">{descriptionText}</DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
