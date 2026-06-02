"use client";

import { forwardRef, useState, useEffect } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";

// ─── Radix-based Select (used by CategoryClient, etc.) ───────────────────────

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex w-full items-center justify-between px-5 h-10 text-sm bg-white border border-gray-300 text-gray-900 rounded-xl outline-none transition-all duration-200",
      "focus:border-black focus:ring-1 focus:ring-gray-100",
      "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
      "placeholder:text-gray-400",
      "[&>span]:truncate",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-60 min-w-[8rem] overflow-hidden bg-white border border-gray-200 rounded-xl shadow-lg",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
        className,
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectItem = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center rounded-lg py-2.5 px-3 text-sm text-gray-900 outline-none transition-colors",
      "focus:bg-gray-100",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute right-3 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-3.5 w-3.5 text-black" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-gray-100", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

// ─── Native MUI-style Select (used by AddressForm, etc.) ─────────────────────

export interface MobileSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

const NativeSelect = forwardRef<HTMLSelectElement, MobileSelectProps>(
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

    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);

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
              "block w-full px-5 h-10 text-sm bg-white border border-gray-300 text-gray-900 transition-all duration-200 outline-none rounded-xl appearance-none",
              "focus:border-black focus:ring-1 focus:ring-gray-100",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
              error && "border-red-500 focus:border-red-500 focus:ring-red-100",
              "pr-12",
              className,
            )}
            {...props}
          >
            <option value="" disabled hidden></option>
            {children}
          </select>

          {label && (
            <label
              htmlFor={inputId}
              className={cn(
                "absolute left-5 z-10 origin-[0] bg-white px-1.5 text-gray-500 transition-all duration-200 pointer-events-none select-none",
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
              <ChevronDown className="w-4 h-4" />
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

NativeSelect.displayName = "NativeSelect";

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectSeparator,
  NativeSelect,
};
