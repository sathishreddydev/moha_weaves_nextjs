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
}

const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(
  ({ className, label, error, helperText, inputMode, autoComplete, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="space-y-2">
        {label && (
          <Label 
            htmlFor={inputId} 
            className="text-sm font-medium text-gray-700 touch-manipulation"
          >
            {label}
          </Label>
        )}
        <Input
          id={inputId}
          ref={ref}
          inputMode={inputMode}
          autoComplete={autoComplete}
          className={cn(
            // Mobile-optimized styles
            " text-base touch-manipulation",
            // Prevent zoom on iOS
            "font-size-16px",
            // Focus styles for mobile
            "focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
            // Error state
            error && "border-red-500 focus:ring-red-500 focus:border-red-500",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600 touch-manipulation">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500 touch-manipulation">{helperText}</p>
        )}
      </div>
    );
  }
);

MobileInput.displayName = "Input";

export { MobileInput };
