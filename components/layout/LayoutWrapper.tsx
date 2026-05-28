"use client";

import { usePathname } from "next/navigation";
import clsx from "clsx";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isLogin = pathname === "/login";
  const isFullBleed = isHome || isLogin;

  return (
    <main
      className={clsx(
        !isFullBleed && "px-4 sm:px-6 lg:px-8",
        !isLogin && "pb-12",
        "min-h-screen bg-white font-sans text-slate-800 antialiased"
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
