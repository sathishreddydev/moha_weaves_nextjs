"use client";

import { StickyPanel } from "@/components/ui/StickyPanel";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isMobile?: boolean;
  isLoading?: boolean;
  addressName?: string;
}

// ─── Component ─────────────────────────────────────────────────────────────────

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
    if (!isLoading) onClose();
  };

  // ── Footer (sticky) ─────────────────────────────────────────────────────────

  const footer = (
    <div className="flex gap-3">
      <Button
        variant="outline"
        onClick={onClose}
        disabled={isLoading}
        className="flex-1"
      >
        Cancel
      </Button>
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
  );

  // ── Body (scrollable) ───────────────────────────────────────────────────────

  const body = (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
        <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-red-900">Delete Address</h3>
          <p className="text-sm text-red-700">
            Are you sure you want to delete &quot;{addressName}&quot;?
          </p>
        </div>
      </div>
      <p className="text-sm text-gray-600 px-1">
        This action cannot be undone. The address will be permanently removed
        from your account.
      </p>
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <StickyPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Delete"
      icon={<Trash2 className="h-4 w-4 text-red-500" />}
      footer={footer}
      isMobile={isMobile}
      maxHeight="60vh"
    >
      {body}
    </StickyPanel>
  );
}
