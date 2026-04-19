"use client";

// Mobile-specific components with code splitting
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/ui/SkeletonLoader";

// Lazy load mobile-specific components
export const MobileCartView = dynamic(
  () => import("@/components/cart/MobileCartView"),
  {
    loading: () => <LoadingSpinner size="lg" className="h-64" />,
    ssr: false,
  }
);

export const MobileProfileLayout = dynamic(
  () => import("@/components/user/MobileProfileLayout"),
  {
    loading: () => <LoadingSpinner size="lg" className="h-64" />,
    ssr: false,
  }
);

export const MobileNavigation = dynamic(
  () => import("@/components/ui/mobile-navigation"),
  {
    loading: () => <LoadingSpinner size="md" className="h-16" />,
    ssr: false,
  }
);

export const MobileButton = dynamic(
  () => import("@/components/ui/mobile-button").then(mod => ({ default: mod.MobileButton })),
  {
    loading: () => <div className="h-12 w-full animate-pulse bg-gray-200 rounded-md" />,
    ssr: false,
  }
);

// Mobile-specific product components (to be created when needed)
// export const MobileProductCard = dynamic(
//   () => import("@/components/products/MobileProductCard"),
//   {
//     loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-80" />,
//     ssr: false,
//   }
// );

// Mobile-specific filter components (to be created when needed)
// export const MobileFilters = dynamic(
//   () => import("@/components/filters/MobileFilters"),
//   {
//     loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-96" />,
//     ssr: false,
//   }
// );

// Mobile-specific checkout components (to be created when needed)
// export const MobileCheckout = dynamic(
//   () => import("@/components/checkout/MobileCheckout"),
//   {
//     loading: () => <LoadingSpinner size="lg" className="h-64" />,
//     ssr: false,
//   }
// );

// Helper component to wrap mobile components with loading states
export function MobileComponentWrapper({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <Suspense fallback={fallback || <LoadingSpinner size="lg" className="h-32" />}>
      {children}
    </Suspense>
  );
}

// Utility to conditionally load mobile components
export function useMobileComponent<T extends React.ComponentType<any>>(
  Component: T,
  isMobile: boolean
) {
  if (!isMobile) {
    return null;
  }
  
  return Component;
}

// Mobile-specific hooks wrapper (to be created when needed)
// export const useMobileFilters = dynamic(
//   () => import("@/hooks/use-mobile-filters"),
//   {
//     ssr: false,
//   }
// );

// export const useMobileCart = dynamic(
//   () => import("@/hooks/use-mobile-cart"),
//   {
//     ssr: false,
//   }
// );
