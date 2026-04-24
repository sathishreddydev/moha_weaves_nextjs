"use client";

import { usePathname } from "next/navigation";
import { useOffersBanner } from "@/hooks/use-offers-banner";
import clsx from "clsx";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const { hasOfferData, isBannerVisible } = useOffersBanner();

  const isHome = pathname === "/";
  const hasBanner = hasOfferData && isBannerVisible;

  const paddingY = isHome
    ? hasBanner
      ? "pt-24"
      : "pt-16"
    : hasBanner
    ? "pt-32"
    : "pt-24";

  return (
    <main
      className={clsx(
        paddingY,
        !isHome && "px-6",
        "min-h-screen pb-12 bg-white font-sans text-slate-800 antialiased"
      )}
    >
      {children}
    </main>
  );
}