"use client";

import * as React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreVertical } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const menuTriggerVariants = cva(
  "inline-flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "hover:bg-gray-100 text-gray-500",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-8 w-8",
        sm: "h-7 w-7",
        lg: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const menuItemVariants = cva(
  "relative flex cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 text-sm outline-none transition-colors focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  {
    variants: {
      variant: {
        default: "text-gray-700 hover:bg-gray-50",
        destructive: "text-red-600 hover:bg-red-50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface ThreeDotsMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "default" | "destructive";
}

export interface ThreeDotsMenuProps extends VariantProps<
  typeof menuTriggerVariants
> {
  items: ThreeDotsMenuItem[];
  className?: string;
  contentClassName?: string;
}

const ThreeDotsMenu = React.forwardRef<HTMLButtonElement, ThreeDotsMenuProps>(
  ({ items, variant, size, className, contentClassName }, ref) => {
    return (
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            ref={ref}
            className={cn(
              menuTriggerVariants({
                variant,
                size,
                className,
              }),
            )}
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={6}
            className={cn(
              "z-50 min-w-[180px] overflow-hidden rounded-xl border bg-white p-1 shadow-md animate-in fade-in-80",
              contentClassName,
            )}
          >
            {items.map((item, index) => (
              <DropdownMenu.Item
                key={index}
                disabled={item.disabled}
                onClick={item.onClick}
                className={cn(
                  menuItemVariants({
                    variant: item.variant,
                  }),
                  "hover:bg-gray-100",
                  "active:bg-gray-100"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    );
  },
);

ThreeDotsMenu.displayName = "ThreeDotsMenu";

export { ThreeDotsMenu, menuTriggerVariants, menuItemVariants };
