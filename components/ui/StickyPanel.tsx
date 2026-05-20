"use client";

import * as React from "react";
import { X } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "./button";
import { cn } from "@/lib/utils";
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className={cn("flex flex-col p-0 overflow-hidden gap-0", className)}
        style={{ maxHeight }}
      >
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {icon && (
                <span className="text-gray-500 flex-shrink-0">{icon}</span>
              )}
              {title}
            </div>
            <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <X className="h-5 w-5" />
            </DialogClose>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 text-sm [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {children}
        </div>

        {footer && (
          <DialogFooter className="p-4 border-t bg-muted/20">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
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
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[90vh] data-[vaul-drawer-direction=top]:max-h-[50vh] flex flex-col overflow-hidden">
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
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 opacity-70 hover:opacity-100"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <div
          data-vaul-no-drag
          className="flex-1 overflow-y-auto px-4 py-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {children}
        </div>

        {footer && (
          <DrawerFooter className="flex-none border-t border-gray-100 p-4">
            {footer}
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}

export function StickyPanel({ isMobile = false, ...props }: StickyPanelProps) {
  if (isMobile) {
    return <MobileSheet {...props} />;
  }
  return <DesktopModal {...props} />;
}

export default StickyPanel;
