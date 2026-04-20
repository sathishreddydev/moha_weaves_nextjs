"use client";

import { forwardRef } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface MobileButtonProps extends Omit<ButtonProps, 'size'> {
  loading?: boolean;
  fullWidth?: boolean;
  size?: "sm" | "default" | "lg" | "xl";
  touchFeedback?: boolean;
}

const MobileButton = forwardRef<HTMLButtonElement, MobileButtonProps>(
  ({ 
    className, 
    children, 
    loading = false, 
    fullWidth = false, 
    size = "default",
    touchFeedback = true,
    disabled,
    ...props 
  }, ref) => {
    const sizeClasses = {
      sm: "h-10 px-4 text-sm ",
      default: "h-12 px-6 text-base ",
      lg: "h-14 px-8 text-lg ",
      xl: "h-16 px-10 text-xl ",
    };

    // Map our custom sizes to Button component sizes
    const buttonSize = size === "xl" ? "lg" : size as "sm" | "default" | "lg";

    return (
      <Button
        ref={ref}
        size={buttonSize}
        disabled={disabled || loading}
        className={cn(
          // Mobile-optimized base styles
          "touch-manipulation",
          // Size-specific styles (override default Button sizes)
          sizeClasses[size],
          // Full width
          fullWidth && "w-full",
          // Touch feedback
          touchFeedback && "active:scale-95 transition-transform duration-100",
          // Loading state
          loading && "relative",
          className
        )}
        {...props}
      >
        {loading && (
          <Loader2 className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 animate-spin" />
        )}
        <span className={loading ? "invisible" : ""}>
          {children}
        </span>
      </Button>
    );
  }
);

MobileButton.displayName = "MobileButton";

export { MobileButton };
