"use client";

import { useEffect, useCallback, useRef } from "react";
import { useFilterStore } from "@/lib/stores/fillterStore";
import { useSocket } from "@/providers/socket-provider";

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const { categories, loading, error, fetchFilters } = useFilterStore();
  const { socket } = useSocket();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced version of fetchFilters to prevent multiple rapid calls
  const debouncedFetchFilters = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      if (!loading) {
        fetchFilters();
      }
    }, 300); // 300ms debounce
  }, [fetchFilters, loading]);

  useEffect(() => {
    // Fetch filters once when the app loads, only if not already loading and no error
    if (categories.length === 0 && !loading && !error) {
      fetchFilters();
    }
  }, [categories.length, loading, error]);

  useEffect(() => {
    if (!socket) return;

    const handleCategoryCreated = (data: any) => {
      // Use debounced fetch to prevent multiple rapid API calls
      debouncedFetchFilters();
    };

    socket.on("category.created", handleCategoryCreated);

    return () => {
      socket.off("category.created", handleCategoryCreated);
      // Clear debounce timeout on cleanup
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [socket, debouncedFetchFilters]);

  return <>{children}</>;
}
