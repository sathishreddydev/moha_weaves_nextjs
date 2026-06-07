"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/auth";
import { SocketInitializer } from "@/components/SocketInitializer";
import { FilterInitializer } from "@/components/FilterInitializer";
import { useFilterStore } from "@/lib/stores/fillterStore";
import type { FiltersData } from "@/app/api/filters/filterService";
import type { Offer } from "@/app/api/offers/offersService";
import { useState, useRef, createContext, useContext, useLayoutEffect } from "react";
const InitialOffersContext = createContext<Offer[]>([]);
export const useInitialOffers = () => useContext(InitialOffersContext);

interface ProvidersProps {
  children: React.ReactNode;
  session?: any;
  filters?: FiltersData;
  initialOffers?: Offer[];
}

export function Providers({
  children,
  session,
  filters,
  initialOffers = [],
}: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  // Seed filter store once from server-provided data.
  // Runs in useLayoutEffect to avoid side-effects during render (StrictMode / concurrent mode safe).
  const seeded = useRef(false);
  useLayoutEffect(() => {
    if (!seeded.current && filters) {
      useFilterStore.setState({
        categories: filters.categories,
        colors: filters.colors,
        fabrics: filters.fabrics,
        isHydrated: true,
        loading: false,
        error: null,
      });
      seeded.current = true;
    }
  }, [filters]);

  return (
    <InitialOffersContext.Provider value={initialOffers}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider session={session}>
          <SocketInitializer />
          <FilterInitializer />
          {children}
        </AuthProvider>
      </QueryClientProvider>
    </InitialOffersContext.Provider>
  );
}
