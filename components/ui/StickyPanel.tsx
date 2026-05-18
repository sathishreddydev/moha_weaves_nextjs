"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StickyPanelProps {
  /** Controls visibility */
  isOpen: boolean;
  /** Called when the panel should close */
  onClose: () => void;
  /** Title shown in the sticky header */
  title: React.ReactNode;
  /** Optional icon placed before the title */
  icon?: React.ReactNode;
  /** Scrollable body content */
  children: React.ReactNode;
  /** Sticky footer content (e.g. action buttons) */
  footer?: React.ReactNode;
  /** Use bottom-sheet (Drawer) layout instead of centred modal */
  isMobile?: boolean;
  /** Extra classes for the desktop modal container */
  className?: string;
  /** Max height of the desktop modal (default: 90vh) */
  maxHeight?: string;
}

// ─── Desktop Modal (Radix Dialog) ─────────────────────────────────────────────

function DesktopModal({
  isOpen,
  onClose,
  title,
  icon,
  children,
  footer,
  className,
  maxHeight = "90vh",
}: Omit<StickyPanelProps, "isMobile">) {
  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogPrimitive.Portal>
        {/* Backdrop */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Modal card */}
        <DialogPrimitive.Content
          style={{ maxHeight }}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
            "w-full max-w-md flex flex-col bg-white rounded-xl shadow-xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
            className,
          )}
        >
          {/* ── Sticky header ── */}
          <div className="flex-none flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <DialogPrimitive.Title className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              {icon && (
                <span className="text-gray-500 flex-shrink-0">{icon}</span>
              )}
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Close"
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              <X className="h-4 w-4 text-gray-500" />
            </DialogPrimitive.Close>
          </div>

          {/* ── Scrollable body ── */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3">
            {children}
          </div>

          {/* ── Sticky footer ── */}
          {footer && (
            <div className="flex-none border-t border-gray-100 px-4 py-3 bg-white">
              {footer}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// ─── Mobile Bottom-Sheet ───────────────────────────────────────────────────────

function MobileSheet({
  isOpen,
  onClose,
  title,
  icon,
  children,
  footer,
}: Omit<StickyPanelProps, "isMobile" | "className" | "maxHeight">) {
  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      dismissible={false}
    >
      <DrawerContent className="flex flex-col">
        {/* ── Sticky header ── */}
        <DrawerHeader className="flex-none flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <DrawerTitle className="flex items-center gap-2 text-sm font-semibold">
            {icon && (
              <span className="text-gray-500 flex-shrink-0">{icon}</span>
            )}
            {title}
          </DrawerTitle>
          <DrawerClose asChild>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <div
          data-vaul-no-drag
          className="flex-1 max-h-[70vh] overflow-y-auto overscroll-contain px-4 py-3"
        >
          {children}
        </div>

        {footer && (
          <div className="flex-none border-t border-gray-100 px-4 py-3 bg-white">
            {footer}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * StickyPanel
 *
 * A reusable panel with:
 *  - sticky header
 *  - scrollable content area
 *  - sticky footer
 *
 * Renders as a bottom-sheet Drawer on mobile (`isMobile=true`)
 * and as a centred modal on desktop.
 *
 * @example
 * <StickyPanel
 *   isOpen={open}
 *   onClose={() => setOpen(false)}
 *   title="Add Address"
 *   icon={<MapPin className="h-4 w-4" />}
 *   footer={<Button onClick={save}>Save</Button>}
 *   isMobile={isMobile}
 * >
 *   <MyForm />
 * </StickyPanel>
 */
export function StickyPanel({ isMobile = false, ...props }: StickyPanelProps) {
  if (isMobile) {
    return <MobileSheet {...props} />;
  }
  return <DesktopModal {...props} />;
}

export default StickyPanel;
