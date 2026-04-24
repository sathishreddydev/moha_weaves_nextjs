"use client";

import { useEffect } from "react";
import { useFilterStore } from "@/lib/stores/fillterStore";

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const { categories, fetchFilters } = useFilterStore();

  useEffect(() => {
    // Fetch filters once when the app loads
    if (categories.length === 0) {
      fetchFilters();
    }
  }, [categories.length, fetchFilters]);

  return <>{children}</>;
}
