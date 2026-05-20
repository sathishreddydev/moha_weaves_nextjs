"use client";

import { usePathname } from "next/navigation";
import clsx from "clsx";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <main
      className={clsx(
        // Always offset by banner + header using CSS variables set by ResizeObservers.
        // On home the hero is full-bleed so we add no extra gap; on other pages add 1rem breathing room.
        !isHome && "px-4 sm:px-6 lg:px-8",
        "min-h-screen pb-12 bg-white font-sans text-slate-800 antialiased"
      )}
      style={{
        paddingTop: isHome
          ? "calc(var(--banner-height, 0px) + var(--header-height, 74px))"
          : "calc(var(--banner-height, 0px) + var(--header-height, 74px) + 1.5rem)",
      }}
    >
      {children}
    </main>
  );
}
