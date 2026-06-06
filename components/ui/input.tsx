"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

// ── Size variants ─────────────────────────────────────────────────────────────
const sizeStyles = {
  xs: { wrapper: "h-7",  text: "text-xs",  px: "px-3",  icon: "h-3 w-3",  iconX: "right-2.5 left-2.5" },
  sm: { wrapper: "h-8",  text: "text-xs",  px: "px-3.5",icon: "h-3.5 w-3.5", iconX: "right-3 left-3" },
  md: { wrapper: "h-10", text: "text-sm",  px: "px-5",  icon: "h-4 w-4",  iconX: "right-4 left-4" },
  lg: { wrapper: "h-12", text: "text-base",px: "px-5",  icon: "h-5 w-5",  iconX: "right-4 left-4" },
} as const;

type InputSize = keyof typeof sizeStyles;

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  helperText?: string;
  inputMode?: "text" | "numeric" | "tel" | "email" | "url" | "search";
  autoComplete?: string;
  /** Size variant — controls height, font size, padding and icon size together */
  size?: InputSize;
  /** Icon rendered on the left inside the input */
  startIcon?: React.ReactNode;
  /** Icon rendered on the right inside the input */
  endIcon?: React.ReactNode;
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
      startIcon,
      endIcon,
      size = "md",
      required,
      placeholder,
      value,
      ...props
    },
    ref,
  ) => {
    const inputId =
      id || `input-${Math.random().toString(36).substring(2, 9)}`;

    const hasValue = value !== undefined && value !== null && value !== "";
    const s = sizeStyles[size];

    // endIcon is the right-side icon
    const trailingIcon = endIcon;

    const effectivePlaceholder = label
      ? placeholder || `Enter ${label.replace(/\s*\*\s*$/, "")}`
      : placeholder || "";

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
            value={value}
            {...props}
            onDoubleClick={(e) => {
              (e.target as HTMLInputElement).select();
              props.onDoubleClick?.(e);
            }}
            placeholder={effectivePlaceholder}
            className={cn(
              // base
              "peer block w-full bg-white border border-gray-300 text-gray-900 transition-all duration-200 outline-none rounded-xl",
              // size-driven
              s.wrapper, s.text, s.px,
              // placeholder behaviour
              label
                ? "placeholder:text-transparent focus:placeholder:text-gray-400"
                : "placeholder:text-gray-400",
              // focus ring
              "focus:border-black focus:ring-1 focus:ring-gray-100",
              // disabled
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
              // icon padding adjustments
              startIcon && "pl-9",
              trailingIcon && "pr-9",
              // error
              error && "border-red-500 focus:border-red-500 focus:ring-red-100",
              className,
            )}
          />

          {/* Floating label */}
          {label && (
            <label
              htmlFor={inputId}
              className={cn(
                "absolute left-5 z-10 origin-[0] bg-white px-1.5 transition-all duration-200 pointer-events-none select-none",
                "top-1/2 -translate-y-1/2 text-sm text-gray-500",
                "peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-black",
                hasValue && "!top-0 !-translate-y-1/2 !text-xs",
                "peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-xs",
                error && "!text-red-500 peer-focus:!text-red-500",
              )}
            >
              {label}
              {required && (
                <span className="ml-0.5 font-medium select-none" aria-hidden="true">
                  *
                </span>
              )}
            </label>
          )}

          {/* Start icon */}
          {startIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center justify-center [&_svg]:h-[1em] [&_svg]:w-[1em]">
              <span className={cn("flex items-center", s.icon)}>{startIcon}</span>
            </div>
          )}

          {/* End icon */}
          {trailingIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 flex items-center justify-center [&_svg]:h-[1em] [&_svg]:w-[1em]">
              <span className={cn("flex items-center", s.icon)}>{trailingIcon}</span>
            </div>
          )}
        </div>

        {error && (
          <p className="text-[11px] text-red-600 pl-2 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-red-500 inline-block animate-pulse" />
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
export type { InputSize };
