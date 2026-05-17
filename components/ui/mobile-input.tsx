"use client";

import { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  inputMode?: "text" | "numeric" | "tel" | "email" | "url" | "search";
  autoComplete?: string;
  icon?: React.ReactNode;
}

const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(
  ({ className, label, error, helperText, inputMode, autoComplete, id, icon, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="space-y-1.5">
        {label && (
          <Label
            htmlFor={inputId}
            className="text-xs font-medium text-gray-600 touch-manipulation"
          >
            {label}
          </Label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              {icon}
            </span>
          )}
          <Input
            id={inputId}
            ref={ref}
            inputMode={inputMode}
            autoComplete={autoComplete}
            className={cn(
              "text-xs touch-manipulation h-8",
              icon && "pl-8",
              "focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
              error && "border-red-500 focus:ring-red-500 focus:border-red-500",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-[11px] text-red-600 touch-manipulation">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-[11px] text-gray-500 touch-manipulation">{helperText}</p>
        )}
      </div>
    );
  }
);

MobileInput.displayName = "Input";

export { MobileInput };
