"use client";

import { usePathname } from "next/navigation";
import { useOffersBanner } from "@/hooks/use-offers-banner";
import clsx from "clsx";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

// Header height constants (must match Header.tsx py-6 lg:py-4 values)
const HEADER_HEIGHT_MOBILE = 64; // py-6 = 24px top + 24px bottom + ~16px content
const HEADER_HEIGHT_DESKTOP = 56; // py-4 = 16px top + 16px bottom + ~24px content

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const { hasOfferData, isBannerVisible } = useOffersBanner();

  const isHome = pathname === "/";
  const hasBanner = hasOfferData && isBannerVisible;

  // Use CSS variable for banner height (set dynamically by OffersBanner via ResizeObserver).
  // Fall back to Tailwind classes when banner is not present.
  const paddingTop = hasBanner
    ? undefined // handled by inline style
    : isHome
    ? "pt-16"
    : "pt-24";

  return (
    <main
      className={clsx(
        paddingTop,
        !isHome && "px-6",
        "min-h-screen pb-12 bg-white font-sans text-slate-800 antialiased"
      )}
      style={
        hasBanner
          ? {
              // banner height + header height, using the CSS variable set by OffersBanner
              paddingTop: `calc(var(--banner-height, 32px) + ${
                isHome ? HEADER_HEIGHT_MOBILE : HEADER_HEIGHT_DESKTOP + 16
              }px)`,
            }
          : undefined
      }
    >
      {children}
    </main>
  );
}
