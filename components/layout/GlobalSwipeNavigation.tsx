"use client";

import { useSwipeToGoBack } from "@/hooks/use-swipe-gesture";
import { useRouter } from "next/navigation";

interface GlobalSwipeNavigationProps {
  children: React.ReactNode;
  enableSwipeBack?: boolean;
}

export default function GlobalSwipeNavigation({ 
  children, 
  enableSwipeBack = true 
}: GlobalSwipeNavigationProps) {
  const router = useRouter();
  
  // Global swipe to go back
  const swipeBackRef = useSwipeToGoBack(() => {
    if (enableSwipeBack && window.history.length > 1) {
      router.back();
    }
  }) as React.RefObject<HTMLDivElement>;

  return (
    <div ref={swipeBackRef} className="min-h-screen">
      {children}
    </div>
  );
}
