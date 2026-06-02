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
      placeholder,
      value,
      ...props
    },
    ref,
  ) => {
    const inputId: string =
      id || `input-${Math.random().toString(36).substring(2, 9)}`;

    const hasValue = value !== undefined && value !== null && value !== "";

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
              "peer block w-full px-5 h-10 text-sm bg-white border border-gray-300 text-gray-900 transition-all duration-200 outline-none rounded-xl",
              label
                ? "placeholder:text-transparent placeholder:text-sm focus:placeholder:text-gray-400"
                : "placeholder:text-gray-400 placeholder:text-sm",
              "focus:border-black focus:ring-1 focus:ring-gray-100",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
              icon && "pr-12",
              error && "border-red-500 focus:border-red-500 focus:ring-red-100",
              className,
            )}
          />
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
