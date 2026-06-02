"use client";

import { forwardRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface MobileSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

const Select = forwardRef<HTMLSelectElement, MobileSelectProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      id,
      icon,
      required,
      children,
      onChange,
      value,
      defaultValue,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const inputId: string =
      id || `select-${Math.random().toString(36).substring(2, 9)}`;

    // Tracks internal values and focus to handle floating transition smoothly
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);

    // Initial value detection
    useEffect(() => {
      const initialValue = value !== undefined ? value : defaultValue;
      setHasValue(
        initialValue !== undefined &&
          initialValue !== null &&
          initialValue !== "",
      );
    }, [value, defaultValue]);

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setHasValue(e.target.value !== "");
      if (onChange) onChange(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(true);
      if (onFocus) onFocus(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(false);
      if (onBlur) onBlur(e);
    };

    const isFloating = isFocused || hasValue;

    return (
      <div className="space-y-1.5 w-full">
        <div className="relative">
          <select
            id={inputId}
            ref={ref}
            required={required}
            value={value}
            defaultValue={defaultValue}
            onChange={handleSelectChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={cn(
              "block w-full px-5 h-12 text-sm bg-white border border-gray-300 text-gray-900 transition-all duration-200 outline-none rounded-xl appearance-none",
              "focus:border-black focus:ring-1 focus:ring-gray-100",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
              error && "border-red-500 focus:border-red-500 focus:ring-red-100",
              "pr-12",
              className,
            )}
            {...props}
          >
            {/* Creates an empty placeholder option if none is provided */}
            <option value="" disabled hidden></option>
            {children}
          </select>

          {label && (
            <label
              htmlFor={inputId}
              className={cn(
                "absolute left-5 z-10 origin-[0] bg-white px-1.5 text-gray-500 transition-all duration-200 pointer-events-none select-none",
                // Transition style mirroring inputs perfectly
                isFloating
                  ? "top-0 -translate-y-1/2 text-xs"
                  : "top-1/2 -translate-y-1/2 text-sm",
                isFocused && !error && "text-black",
                error && "text-red-500",
              )}
            >
              {label}
              {required && (
                <span
                  className="text-red-500 ml-0.5 font-medium select-none"
                  aria-hidden="true"
                >
                  *
                </span>
              )}
            </label>
          )}

          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center">
            {icon ? (
              icon
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            )}
          </div>
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

Select.displayName = "Select";
export { Select };
