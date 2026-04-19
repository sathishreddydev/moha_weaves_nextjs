"use client";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isMobile?: boolean;
  isLoading?: boolean;
  addressName?: string;
}

export default function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  isMobile = false,
  isLoading = false,
  addressName = "this address",
}: DeleteConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    if (!isLoading) {
      onClose();
    }
  };

  const DialogContent = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
        <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-red-900">Delete Address</h3>
          <p className="text-sm text-red-700">
            Are you sure you want to delete "{addressName}"?
          </p>
        </div>
      </div>

      <div className="text-sm text-gray-600 px-4">
        <p>
          This action cannot be undone. The address will be permanently removed
          from your account.
        </p>
      </div>

      <div className="flex gap-3 px-4 pb-4">
        {isMobile ? (
          <DrawerClose asChild>
            <Button variant="outline" disabled={isLoading} className="flex-1">
              Cancel
            </Button>
          </DrawerClose>
        ) : (
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button
          variant="destructive"
          onClick={handleConfirm}
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? (
            "Deleting..."
          ) : (
            <>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Address
            </>
          )}
        </Button>
      </div>
    </div>
  );

  if (!isOpen) return null;

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent>
          <DrawerTitle className="sr-only">Delete Address Confirmation</DrawerTitle>
          <DialogContent />
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop Modal
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6">
          <DialogContent />
        </div>
      </div>
    </div>
  );
}
