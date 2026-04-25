"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  side?: "left" | "right";
}

const Sheet: React.FC<SheetProps> = ({ open, onOpenChange, children, className, side = "left" }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity duration-200"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      
      {/* Sheet Content */}
      <div
        className={cn(
          "fixed top-0 h-full w-96 max-w-[90vw] bg-white shadow-xl overflow-y-auto transform transition-transform duration-300 ease-out",
          side === "left" ? "left-0" : "right-0",
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
};

const SheetContent = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col h-full", className)}
    {...props}
  />
));
SheetContent.displayName = "SheetContent";

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between z-10",
      className
    )}
    {...props}
  />
);
SheetHeader.displayName = "SheetHeader";

const SheetTitle = React.forwardRef<
  React.ElementRef<"h2">,
  React.ComponentPropsWithoutRef<"h2">
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold text-gray-900",
      className
    )}
    {...props}
  />
));
SheetTitle.displayName = "SheetTitle";

const SheetDescription = React.forwardRef<
  React.ElementRef<"p">,
  React.ComponentPropsWithoutRef<"p">
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-500", className)}
    {...props}
  />
));
SheetDescription.displayName = "SheetDescription";

const SheetClose = React.forwardRef<
  React.ElementRef<"button">,
  React.ComponentPropsWithoutRef<"button">
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",
      className
    )}
    {...props}
  />
));
SheetClose.displayName = "SheetClose";

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "mt-auto flex flex-col gap-2 p-4",
      className
    )}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";

export {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
  SheetFooter,
};
