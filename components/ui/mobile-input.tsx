"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  inputMode?: "text" | "numeric" | "tel" | "email" | "url" | "search";
  autoComplete?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      inputMode,
      autoComplete,
      id,
      icon,
      required,
      ...props
    },
    ref,
  ) => {
    // Generates a robust safe fallback ID for labels
    const inputId: string =
      id || `input-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className="space-y-1.5 w-full">
        <div className="relative">
          <input
            type="text"
            id={inputId}
            ref={ref}
            required={required}
            inputMode={inputMode}
            autoComplete={autoComplete}
            placeholder=" " // Crucial fallback for peer-placeholder-shown mechanics
            className={cn(
              "peer block w-full px-5 h-12 text-sm bg-white border border-gray-300 text-gray-900 transition-all duration-200 outline-none rounded-xl",
              "focus:border-black focus:ring-1 focus:ring-gray-100", // Outlined focus states
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
              icon && "pr-12", // Apply extra padding on right if icon exists
              error && "border-red-500 focus:border-red-500 focus:ring-red-100",
              className,
            )}
            {...props}
          />
          {label && (
            <label
              htmlFor={inputId}
              className={cn(
                "absolute left-5 top-0 z-10 origin-[0] -translate-y-1/2 bg-white px-1.5 text-xs text-gray-500 transition-all duration-200 pointer-events-none select-none",
                "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm",
                "peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-black",
                error && "text-red-500 peer-focus:text-red-500",
              )}
            >
              {label}
              {required && (
                <span
                  className="ml-0.5 font-medium select-none"
                  aria-hidden="true"
                >
                  *
                </span>
              )}
            </label>
          )}
          {icon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {icon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-[11px] text-red-600 pl-2 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-red-500 inline-block animate-pulse"></span>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-[11px] text-gray-500 pl-2">{helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
